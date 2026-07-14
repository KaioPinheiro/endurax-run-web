import { useEffect, useState } from "react";
import FormularioPlanoSemanal from "../components/plano/FormularioPlanoSemanal";
import ResultadoPlanoSemanal from "../components/plano/ResultadoPlanoSemanal";
import { MENSAGENS_LOADING_PLANO } from "../constants/planoTreino";
import { gerarPlanoSemanalComIA } from "../services/api";
import { obterMensagemErroIa } from "../utils/mensagemErroIa";
import {
  alternarDiaDisponivel,
  criarEstadoInicialPlano,
  montarPayloadPlanoSemanal,
  normalizarCampoPlano,
  validarFormularioPlano
} from "../utils/planoTreino";
import "./GerarTreinoIA.css";
import "./PlanoSemanalIA.css";

function PlanoSemanalIA() {
  const [form, setForm] = useState(criarEstadoInicialPlano);
  const [plano, setPlano] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [indiceMensagemLoading, setIndiceMensagemLoading] = useState(0);

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

    const erroValidacao = validarFormularioPlano(form);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setCarregando(true);
    setErro("");
    setSucesso("");
    setIndiceMensagemLoading(0);
    setPlano(null);

    try {
      const resultado = await gerarPlanoSemanalComIA(
        montarPayloadPlanoSemanal(form)
      );

      setPlano(resultado);
      setSucesso("Plano semanal gerado com sucesso!");
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
        <span>▦ PLANO SEMANAL ENDURAX</span>
        <h1>Uma semana inteira no seu ritmo.</h1>
        <p>Organize corrida, recuperação e descanso em uma rotina equilibrada.</p>
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
        setErro={setErro}
        setForm={setForm}
      />

      <ResultadoPlanoSemanal
        plano={plano}
        carregando={carregando}
        onGerarNovamente={() => enviar()}
      />
    </section>
  );
}

export default PlanoSemanalIA;
