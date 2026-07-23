import { useCallback, useEffect, useRef, useState } from "react";
import FormularioPlanoSemanal from "../components/plano/FormularioPlanoSemanal";
import PagamentoPix from "../components/plano/PagamentoPix";
import ResultadoMeuPlano from "../components/plano/ResultadoMeuPlano";
import { MENSAGENS_LOADING_PLANO } from "../constants/planoTreino";
import {
  buscarConfigPublica,
  buscarPlanoGerado,
  buscarResultadoPagamento,
  criarPagamentoPix,
  criarSolicitacaoPlano,
  gerarPlanoComIA,
  tentarGeracaoNovamente
} from "../services/api";
import { obterMensagemErroIa } from "../utils/mensagemErroIa";
import {
  alternarDiaDisponivel,
  criarEstadoInicialPlano,
  montarPayloadMeuPlano,
  normalizarCampoPlano,
  validarFormularioMeuPlano
} from "../utils/planoTreino";
import "./GerarTreinoIA.css";
import "./PlanoSemanalIA.css";

const PAGAMENTO_ID_KEY = "pagamentoId";
const SOLICITACAO_ID_KEY = "solicitacaoPlanoId";

function limparPagamentoPersistido() {
  localStorage.removeItem(PAGAMENTO_ID_KEY);
  localStorage.removeItem(SOLICITACAO_ID_KEY);
}

function estadoDoResultado(resultado) {
  if (resultado.pagamentoStatus === "EXPIRED") return "EXPIRED";
  if (["REJECTED", "CANCELLED"].includes(resultado.pagamentoStatus)) return "FAILED";
  if (resultado.geracaoStatus === "FAILED") return "FAILED";
  if (resultado.geracaoStatus === "COMPLETED") return "COMPLETED";
  if (resultado.pagamentoStatus === "APPROVED" || resultado.geracaoStatus === "PROCESSING") {
    return "PROCESSING";
  }
  return "PENDING";
}

function mensagemDoEstado(estado, mensagem) {
  if (estado === "PROCESSING") return <>Pagamento confirmado.<br />Estamos gerando seu plano...</>;
  if (estado === "FAILED") return mensagem || "Não foi possível gerar seu plano.";
  if (estado === "EXPIRED") return "Pagamento expirado.";
  return "Aguardando pagamento...";
}

function MeuPlano() {
  const [form, setForm] = useState(criarEstadoInicialPlano);
  const [plano, setPlano] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [indiceMensagemLoading, setIndiceMensagemLoading] = useState(0);
  const [versaoPlano, setVersaoPlano] = useState(0);
  const [pagamento, setPagamento] = useState(() => {
    const pagamentoId = localStorage.getItem(PAGAMENTO_ID_KEY);
    return pagamentoId ? { pagamentoId } : null;
  });
  const [estadoPagamento, setEstadoPagamento] = useState(() =>
    localStorage.getItem(PAGAMENTO_ID_KEY) ? "PENDING" : null
  );
  const [mensagemPagamento, setMensagemPagamento] = useState("");
  const payloadRef = useRef(null);
  const envioEmAndamento = useRef(false);

  const concluirComPlano = useCallback(async (planoId) => {
    const planoGerado = await buscarPlanoGerado(planoId);
    setPlano(planoGerado);
    setVersaoPlano((atual) => atual + 1);
    setSucesso("Meu Plano foi gerado com sucesso!");
    setPagamento(null);
    setEstadoPagamento(null);
    limparPagamentoPersistido();
  }, []);

  const consultarPagamento = useCallback(async (pagamentoId) => {
    try {
      const resultado = await buscarResultadoPagamento(pagamentoId);
      const estado = estadoDoResultado(resultado);
      setEstadoPagamento(estado);
      setMensagemPagamento(resultado.mensagem || "");

      if (estado === "COMPLETED") {
        await concluirComPlano(resultado.planoId);
      } else if (estado === "EXPIRED") {
        limparPagamentoPersistido();
      }
    } catch (error) {
      setErro(obterMensagemErroIa(error, "Não foi possível consultar o pagamento."));
    }
  }, [concluirComPlano]);

  useEffect(() => {
    if (!pagamento?.pagamentoId || !["PENDING", "PROCESSING"].includes(estadoPagamento)) {
      return undefined;
    }

    const consultaInicial = setTimeout(() => consultarPagamento(pagamento.pagamentoId), 0);
    const intervalo = setInterval(() => consultarPagamento(pagamento.pagamentoId), 3000);
    return () => {
      clearTimeout(consultaInicial);
      clearInterval(intervalo);
    };
  }, [consultarPagamento, estadoPagamento, pagamento?.pagamentoId]);

  useEffect(() => {
    if (!carregando) return undefined;
    const intervalo = setInterval(() => {
      setIndiceMensagemLoading((atual) => (atual + 1) % MENSAGENS_LOADING_PLANO.length);
    }, 1800);
    return () => clearInterval(intervalo);
  }, [carregando]);

  useEffect(() => {
    if (!sucesso) return undefined;
    const timeout = setTimeout(() => setSucesso(""), 4000);
    return () => clearTimeout(timeout);
  }, [sucesso]);

  function alterar(event) {
    const { name, value, type, checked } = event.target;
    setForm((atual) => normalizarCampoPlano(atual, { name, value, type, checked }));
    setErro("");
  }

  function alternarDia(dia) {
    setForm((atual) => alternarDiaDisponivel(atual, dia));
    setErro("");
  }

  async function iniciarPagamento(payload) {
    const solicitacao = await criarSolicitacaoPlano(form.email.trim(), payload);
    localStorage.setItem(SOLICITACAO_ID_KEY, String(solicitacao.solicitacaoPlanoId));

    const cobranca = await criarPagamentoPix(form.email.trim(), solicitacao.solicitacaoPlanoId);
    localStorage.setItem(PAGAMENTO_ID_KEY, String(cobranca.pagamentoId));
    setPagamento(cobranca);
    setEstadoPagamento("PENDING");
  }

  async function enviar(event) {
    event?.preventDefault();
    if (envioEmAndamento.current || carregando || pagamento) return;

    const erroValidacao = validarFormularioMeuPlano(form);
    if (erroValidacao) return setErro(erroValidacao);
    if (!/^\S+@\S+\.\S+$/.test(form.email?.trim() || "")) {
      return setErro("Informe um e-mail válido.");
    }

    envioEmAndamento.current = true;
    setCarregando(true);
    setErro("");
    setSucesso("");
    setIndiceMensagemLoading(0);
    const payload = montarPayloadMeuPlano(form);
    payloadRef.current = payload;

    try {
      localStorage.setItem("email", form.email.trim());
      const config = await buscarConfigPublica();
      if (config.modoFluxoPlano === "DESENVOLVIMENTO") {
        await concluirPlanoDesenvolvimento(payload);
      } else {
        await iniciarPagamento(payload);
      }
    } catch (error) {
      limparPagamentoPersistido();
      setErro(obterMensagemErroIa(error, "Não foi possível iniciar a geração do plano."));
    } finally {
      envioEmAndamento.current = false;
      setCarregando(false);
    }
  }

  async function concluirPlanoDesenvolvimento(payload) {
    const resultado = await gerarPlanoComIA(payload);
    setPlano(resultado);
    setVersaoPlano((atual) => atual + 1);
    setSucesso("Meu Plano foi gerado com sucesso!");
  }

  async function tentarNovamente() {
    if (carregando || !pagamento?.pagamentoId) return;
    setCarregando(true);
    setErro("");
    try {
      await tentarGeracaoNovamente(pagamento.pagamentoId);
      setEstadoPagamento("PROCESSING");
    } catch (error) {
      setErro(obterMensagemErroIa(error, "Não foi possível tentar a geração novamente."));
    } finally {
      setCarregando(false);
    }
  }

  async function gerarNovoQrCode() {
    setPagamento(null);
    setEstadoPagamento(null);
    setMensagemPagamento("");
    limparPagamentoPersistido();
    if (!payloadRef.current) return;

    setCarregando(true);
    try {
      await iniciarPagamento(payloadRef.current);
    } catch (error) {
      setErro(obterMensagemErroIa(error, "Não foi possível gerar um novo QR Code."));
    } finally {
      setCarregando(false);
    }
  }

  function cancelarJornadaPagamento() {
    limparPagamentoPersistido();
    setPagamento(null);
    setEstadoPagamento(null);
    setMensagemPagamento("");
    setErro("");
    setCarregando(false);
    payloadRef.current = null;
  }

  const fluxoAtivo = carregando || Boolean(pagamento);

  return (
    <section className="coach-ia-page plano-ia-page">
      <header className="coach-ia-hero">
        <span>MEU PLANO</span>
        <h1>Meu Plano</h1>
        <p>Receba um ciclo de corrida personalizado para sua prova-alvo ou para o objetivo que deseja alcançar.</p>
      </header>

      {!pagamento && !plano && (
        <FormularioPlanoSemanal
          form={form} erro={erro} sucesso={sucesso} carregando={fluxoAtivo}
          mensagemLoading={MENSAGENS_LOADING_PLANO[indiceMensagemLoading]}
          onAlterar={alterar} onAlternarDia={alternarDia} onSubmit={enviar}
          validarMaratonaEmTempoReal
        />
      )}

      {pagamento && (
        <>
          {erro && <p className="coach-ia-erro pix-erro">{erro}</p>}
          <PagamentoPix
            pagamento={pagamento}
            estado={estadoPagamento || "PENDING"}
            mensagem={mensagemDoEstado(estadoPagamento || "PENDING", mensagemPagamento)}
            onTentarNovamente={tentarNovamente}
            onGerarNovo={gerarNovoQrCode}
            onCancelarPagamento={cancelarJornadaPagamento}
          />
        </>
      )}

      <ResultadoMeuPlano
        key={versaoPlano} plano={plano} carregando={fluxoAtivo}
        onGerarNovamente={() => { setPlano(null); setSucesso(""); }}
      />
    </section>
  );
}

export default MeuPlano;
