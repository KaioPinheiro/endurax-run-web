import { useEffect, useState } from "react";
import FormularioPlanoSemanal from "../components/plano/FormularioPlanoSemanal";
import ResultadoMeuPlano from "../components/plano/ResultadoMeuPlano";
import { MENSAGENS_LOADING_PLANO } from "../constants/planoTreino";
import { gerarPlanoComIA } from "../services/api";
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

function MeuPlano() {
  const [form, setForm] = useState(criarEstadoInicialPlano);
  const [plano, setPlano] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [indiceMensagemLoading, setIndiceMensagemLoading] = useState(0);
  const [versaoPlano, setVersaoPlano] = useState(0);

  useEffect(() => {
    if (!carregando) {
      return undefined;
    }

    const intervalo = setInterval(() => {
      setIndiceMensagemLoading((atual) =>
        (atual + 1) % MENSAGENS_LOADING_PLANO.length
      );
    }, 1800);

    return () => clearInterval(intervalo);
  }, [carregando]);

  useEffect(() => {
    if (!sucesso) {
      return undefined;
    }

    const timeout = setTimeout(() => setSucesso(""), 4000);

    return () => clearTimeout(timeout);
  }, [sucesso]);

  function alterar(event) {
    const { name, value, type, checked } = event.target;

    setForm((atual) => normalizarCampoPlano(atual, {
      name,
      value,
      type,
      checked
    }));
    setErro("");
  }

  function alternarDia(dia) {
    setForm((atual) => alternarDiaDisponivel(atual, dia));
    setErro("");
  }

  async function enviar(event) {
    event?.preventDefault();

    if (carregando) {
      return;
    }

    const erroValidacao = validarFormularioMeuPlano(form);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setCarregando(true);
    setErro("");
    setSucesso("");
    setIndiceMensagemLoading(0);

    try {
      const resultado = await gerarPlanoComIA(montarPayloadMeuPlano(form));

      setPlano(resultado);
      setVersaoPlano((atual) => atual + 1);
      setSucesso("Meu Plano foi gerado com sucesso!");
    } catch (error) {
      setErro(obterMensagemErroIa(
        error,
        "Não foi possível gerar seu plano agora. Tente novamente em alguns instantes."
      ));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="coach-ia-page plano-ia-page">
      <header className="coach-ia-hero">
        <span>MEU PLANO</span>
        <h1>Meu Plano</h1>
        <p>
          Receba um ciclo de corrida personalizado para sua prova-alvo ou para
          o objetivo que deseja alcançar.
        </p>
      </header>

      <FormularioPlanoSemanal
        form={form}
        erro={erro}
        sucesso={sucesso}
        carregando={carregando}
        mensagemLoading={MENSAGENS_LOADING_PLANO[indiceMensagemLoading]}
        onAlterar={alterar}
        onAlternarDia={alternarDia}
        onSubmit={enviar}
        validarMaratonaEmTempoReal
        setErro={setErro}
      />

      <ResultadoMeuPlano
        key={versaoPlano}
        plano={plano}
        carregando={carregando}
        onGerarNovamente={() => enviar()}
      />
    </section>
  );
}

export default MeuPlano;
