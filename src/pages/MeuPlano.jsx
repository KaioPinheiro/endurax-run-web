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
  reconciliarPagamento,
  tentarGeracaoNovamente
} from "../services/api";
import { obterMensagemErroIa } from "../utils/mensagemErroIa";
import {
  CHAVES_FLUXO_MEU_PLANO,
  criarRecuperacaoCompra,
  estadoDoResultado,
  limparFluxoComercialMeuPlano
} from "../utils/fluxoMeuPlano";
import {
  alternarDiaDisponivel,
  criarEstadoInicialPlano,
  montarPayloadMeuPlano,
  normalizarCampoPlano,
  normalizarFormularioPlanoRestaurado,
  validarFormularioMeuPlano
} from "../utils/planoTreino";
import "./GerarTreinoIA.css";
import "./PlanoSemanalIA.css";

const PAGAMENTO_TOKEN_KEY = CHAVES_FLUXO_MEU_PLANO.pagamentoToken;
const SOLICITACAO_ID_KEY = CHAVES_FLUXO_MEU_PLANO.solicitacaoPlanoId;
const PLANO_TOKEN_KEY = CHAVES_FLUXO_MEU_PLANO.planoToken;
const PAYLOAD_PLANO_KEY = CHAVES_FLUXO_MEU_PLANO.payloadMeuPlano;

function lerPayloadPersistido() {
  try {
    const payload = JSON.parse(localStorage.getItem(PAYLOAD_PLANO_KEY)) || null;
    const normalizado = normalizarFormularioPlanoRestaurado(payload);
    if (payload?.objetivo && !normalizado?.objetivo) {
      localStorage.removeItem(PAYLOAD_PLANO_KEY);
      localStorage.removeItem(SOLICITACAO_ID_KEY);
      return null;
    }
    return normalizado;
  } catch {
    return null;
  }
}

function mensagemDoEstado(estado, mensagem) {
  if (estado === "PROCESSING") return <>Pagamento confirmado.<br />Estamos gerando seu plano...</>;
  if (estado === "COMPLETED") return mensagem || "Pagamento confirmado. Seu plano está pronto.";
  if (estado === "FAILED") return mensagem || "Não foi possível gerar seu plano.";
  if (estado === "EXPIRED") return "Pagamento expirado.";
  return "Aguardando pagamento...";
}

function MeuPlano() {
  const recuperacaoInicial = criarRecuperacaoCompra({
    pagamentoToken: localStorage.getItem(PAGAMENTO_TOKEN_KEY),
    planoToken: localStorage.getItem(PLANO_TOKEN_KEY),
    solicitacaoPlanoId: localStorage.getItem(SOLICITACAO_ID_KEY),
    payload: lerPayloadPersistido()
  });
  const [form, setForm] = useState(criarEstadoInicialPlano);
  const [plano, setPlano] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [indiceMensagemLoading, setIndiceMensagemLoading] = useState(0);
  const [versaoPlano, setVersaoPlano] = useState(0);
  const [pagamento, setPagamento] = useState(recuperacaoInicial.pagamento);
  const [estadoPagamento, setEstadoPagamento] = useState(recuperacaoInicial.estadoPagamento);
  const [mensagemPagamento, setMensagemPagamento] = useState("");
  const [pagamentoOculto, setPagamentoOculto] = useState(false);
  const [pagamentoSincronizado, setPagamentoSincronizado] = useState(false);
  const [solicitacaoSemPagamento, setSolicitacaoSemPagamento] = useState(
    recuperacaoInicial.solicitacaoSemPagamento
  );
  const payloadRef = useRef(recuperacaoInicial.payload);
  const envioEmAndamento = useRef(false);
  const ignorarRecuperacaoPlano = useRef(false);

  const concluirComPlano = useCallback(async (planoToken) => {
    if (!planoToken) {
      throw new Error("O pagamento foi concluído, mas o plano ainda não está disponível.");
    }
    localStorage.setItem(PLANO_TOKEN_KEY, planoToken);
    const planoGerado = await buscarPlanoGerado(planoToken);
    setPlano(planoGerado);
    setVersaoPlano((atual) => atual + 1);
    setSucesso("Meu Plano foi gerado com sucesso!");
    setPagamento(null);
    setEstadoPagamento(null);
  }, []);

  const consultarPagamento = useCallback(async (acessoToken) => {
    try {
      const resultado = await buscarResultadoPagamento(acessoToken);
      const estado = estadoDoResultado(resultado);
      setPagamento((atual) => ({ ...atual, ...resultado, acessoToken }));
      setPagamentoSincronizado(true);
      setEstadoPagamento(estado);
      setMensagemPagamento(resultado.mensagem || "");

      if (resultado.pagamentoStatus === "APPROVED" && resultado.geracaoStatus === "PENDING") {
        await tentarGeracaoNovamente(acessoToken);
        setEstadoPagamento("PROCESSING");
      } else if (estado === "COMPLETED") {
        try {
          await concluirComPlano(resultado.planoToken);
        } catch (error) {
          setErro(obterMensagemErroIa(error, "Seu plano está pronto, mas não foi possível carregá-lo."));
        }
      }
    } catch (error) {
      setErro(obterMensagemErroIa(error, "Não foi possível consultar o pagamento."));
    }
  }, [concluirComPlano]);

  useEffect(() => {
    const planoToken = localStorage.getItem(PLANO_TOKEN_KEY);
    if (!planoToken || plano || ignorarRecuperacaoPlano.current) return undefined;

    const recuperacao = setTimeout(() => {
      concluirComPlano(planoToken).catch((error) => {
        const pagamentoToken = localStorage.getItem(PAGAMENTO_TOKEN_KEY);
        if (pagamentoToken) setPagamento((atual) => atual || { acessoToken: pagamentoToken });
        setEstadoPagamento("COMPLETED");
        setErro(obterMensagemErroIa(error, "Seu plano está pronto, mas não foi possível carregá-lo."));
      });
    }, 0);
    return () => clearTimeout(recuperacao);
  }, [concluirComPlano, plano]);

  useEffect(() => {
    if (!pagamento?.acessoToken || !["PENDING", "PROCESSING"].includes(estadoPagamento)) {
      return undefined;
    }

    const consultaInicial = setTimeout(() => consultarPagamento(pagamento.acessoToken), 0);
    const intervalo = setInterval(() => consultarPagamento(pagamento.acessoToken), 3000);
    return () => {
      clearTimeout(consultaInicial);
      clearInterval(intervalo);
    };
  }, [consultarPagamento, estadoPagamento, pagamento?.acessoToken]);

  // Reconciliação com o Mercado Pago: só enquanto o pagamento não foi confirmado, em
  // frequência baixa e sem bloquear o polling. Falhas são ignoradas de propósito — quem
  // garante o início da geração ao detectar aprovação é o backend.
  useEffect(() => {
    const acessoToken = pagamento?.acessoToken;
    if (!acessoToken || estadoPagamento !== "PENDING") return undefined;

    const reconciliar = () => reconciliarPagamento(acessoToken).catch(() => {});
    const primeira = setTimeout(reconciliar, 0);
    const intervalo = setInterval(reconciliar, 30000);
    return () => {
      clearTimeout(primeira);
      clearInterval(intervalo);
    };
  }, [estadoPagamento, pagamento?.acessoToken]);

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
    const email = form.email.trim() || localStorage.getItem("email") || "";
    let solicitacaoPlanoId = localStorage.getItem(SOLICITACAO_ID_KEY);
    localStorage.setItem(PAYLOAD_PLANO_KEY, JSON.stringify(payload));

    if (!solicitacaoPlanoId) {
      const solicitacao = await criarSolicitacaoPlano(email, payload);
      solicitacaoPlanoId = String(solicitacao.solicitacaoPlanoId);
      localStorage.setItem(SOLICITACAO_ID_KEY, solicitacaoPlanoId);
      setSolicitacaoSemPagamento(true);
    }

    const cobranca = await criarPagamentoPix(email, Number(solicitacaoPlanoId));
    localStorage.setItem(PAGAMENTO_TOKEN_KEY, cobranca.acessoToken);
    setPagamento(cobranca);
    setPagamentoSincronizado(true);
    setSolicitacaoSemPagamento(false);
    setPagamentoOculto(false);
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
    localStorage.setItem(PAYLOAD_PLANO_KEY, JSON.stringify(payload));

    try {
      localStorage.setItem("email", form.email.trim());
      const config = await buscarConfigPublica();
      if (config.modoFluxoPlano === "DESENVOLVIMENTO") {
        await concluirPlanoDesenvolvimento(payload);
      } else {
        await iniciarPagamento(payload);
      }
    } catch (error) {
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
    if (carregando || !pagamento?.acessoToken) return;
    setCarregando(true);
    setErro("");
    try {
      await tentarGeracaoNovamente(pagamento.acessoToken);
      setEstadoPagamento("PROCESSING");
    } catch (error) {
      setErro(obterMensagemErroIa(error, "Não foi possível tentar a geração novamente."));
    } finally {
      setCarregando(false);
    }
  }

  async function gerarNovoQrCode() {
    if (carregando) return;
    const payload = payloadRef.current || lerPayloadPersistido();
    if (!payload) {
      setErro("Não foi possível recuperar os dados do formulário. Inicie uma nova solicitação.");
      return;
    }

    setPagamento(null);
    setEstadoPagamento(null);
    setMensagemPagamento("");
    setPagamentoSincronizado(false);
    localStorage.removeItem(PAGAMENTO_TOKEN_KEY);
    localStorage.removeItem(SOLICITACAO_ID_KEY);
    localStorage.removeItem(PLANO_TOKEN_KEY);

    setCarregando(true);
    try {
      await iniciarPagamento(payload);
    } catch (error) {
      setErro(obterMensagemErroIa(error, "Não foi possível gerar um novo QR Code."));
    } finally {
      setCarregando(false);
    }
  }

  async function continuarSolicitacao() {
    const payload = payloadRef.current || lerPayloadPersistido();
    if (!payload || carregando) return;
    setCarregando(true);
    setErro("");
    try {
      await iniciarPagamento(payload);
    } catch (error) {
      setErro(obterMensagemErroIa(error, "Não foi possível retomar o pagamento."));
    } finally {
      setCarregando(false);
    }
  }

  function cancelarJornadaPagamento() {
    setPagamentoOculto(true);
    setErro("");
    setCarregando(false);
  }

  async function buscarPlanoNovamente() {
    if (carregando) return;
    const planoToken = localStorage.getItem(PLANO_TOKEN_KEY);
    setCarregando(true);
    setErro("");
    try {
      await concluirComPlano(planoToken);
    } catch (error) {
      setEstadoPagamento("COMPLETED");
      setErro(obterMensagemErroIa(error, "Seu plano está pronto, mas não foi possível carregá-lo."));
    } finally {
      setCarregando(false);
    }
  }

  function iniciarNovoPlano() {
    ignorarRecuperacaoPlano.current = true;
    limparFluxoComercialMeuPlano(localStorage);
    payloadRef.current = null;
    envioEmAndamento.current = false;
    setForm(criarEstadoInicialPlano());
    setPlano(null);
    setPagamento(null);
    setEstadoPagamento(null);
    setMensagemPagamento("");
    setPagamentoOculto(false);
    setPagamentoSincronizado(false);
    setSolicitacaoSemPagamento(false);
    setErro("");
    setCarregando(false);
    setSucesso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const fluxoAtivo = carregando || Boolean(pagamento);

  return (
    <section className="coach-ia-page plano-ia-page">
      <header className="coach-ia-hero">
        <span>MEU PLANO</span>
        <h1>Meu Plano</h1>
        <p>Receba um ciclo de corrida personalizado para o objetivo que deseja alcançar.</p>
      </header>

      {!pagamento && !plano && !solicitacaoSemPagamento && (
        <FormularioPlanoSemanal
          form={form} erro={erro} sucesso={sucesso} carregando={fluxoAtivo}
          mensagemLoading={MENSAGENS_LOADING_PLANO[indiceMensagemLoading]}
          onAlterar={alterar} onAlternarDia={alternarDia} onSubmit={enviar}
          validarMaratonaEmTempoReal
        />
      )}

      {!pagamento && !plano && solicitacaoSemPagamento && (
        <section className="pix-card" aria-live="polite">
          {erro && <p className="coach-ia-erro pix-erro">{erro}</p>}
          <h2>Solicitação salva</h2>
          <p>Seus dados foram preservados. Continue para recuperar ou gerar o Pix.</p>
          <button className="coach-ia-submit" type="button" onClick={continuarSolicitacao} disabled={carregando}>
            Continuar pagamento
          </button>
        </section>
      )}

      {pagamento && pagamentoOculto && (
        <section className="pix-card" aria-live="polite">
          <h2>Pagamento ocultado</h2>
          <p>Ocultar esta tela não cancela o Pix. Continuaremos acompanhando esse pagamento.</p>
          <button className="coach-ia-submit" type="button" onClick={() => setPagamentoOculto(false)}>
            Retomar pagamento
          </button>
        </section>
      )}

      {pagamento && !pagamentoOculto && (
        <>
          {erro && <p className="coach-ia-erro pix-erro">{erro}</p>}
          <PagamentoPix
            pagamento={pagamento}
            estado={estadoPagamento || "PENDING"}
            mensagem={mensagemDoEstado(estadoPagamento || "PENDING", mensagemPagamento)}
            onTentarNovamente={
              pagamento.geracaoStatus === "FAILED" ? tentarNovamente : gerarNovoQrCode
            }
            onBuscarPlano={buscarPlanoNovamente}
            onGerarNovo={gerarNovoQrCode}
            onCancelarPagamento={cancelarJornadaPagamento}
            sincronizado={pagamentoSincronizado}
          />
        </>
      )}

      <ResultadoMeuPlano
        key={versaoPlano} plano={plano} carregando={fluxoAtivo}
        onGerarNovamente={iniciarNovoPlano}
      />
    </section>
  );
}

export default MeuPlano;
