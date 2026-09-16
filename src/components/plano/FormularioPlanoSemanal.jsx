import { useEffect, useRef } from "react";
import {
  DIAS_SEMANA,
  DURACOES_PLANO,
  EXPERIENCIAS_INICIANTES,
  EXPERIENCIAS_CORRIDA,
  RITMOS_CONFORTAVEIS,
  VOLUMES_SEMANAIS_MARATONA
} from "../../constants/planoTreino";
import {
  completarEntradaTempo,
  completarTempo5Km,
  diaLongaoEhAplicavel,
  distanciaObjetivoPerformance,
  ehObjetivoPerformance,
  formatoTempoObjetivo,
  mascararEntradaTempo,
  normalizarIdade,
  corre5KmSemCaminharEhAplicavel,
  objetivosDisponiveisPorExperiencia,
  rotuloObjetivoPorExperiencia,
  planoIndicaMeiaOuMaratona,
  planoIndicaMaratona,
  validarComparacaoTemposPerformance,
  validarBloqueiosMaratona,
  volumesDisponiveisPorObjetivo
} from "../../utils/planoTreino";
import {
  analyticsHabilitado,
  observarCamposAlcancados,
  rastrearEventoUmami
} from "../../utils/analytics";

function OpcoesSelect({ opcoes, rotulo = (opcao) => opcao }) {
  return opcoes.map((opcao) => (
    <option value={opcao} key={opcao}>
      {rotulo(opcao)}
    </option>
  ));
}

function PlaceholderSelect({ children }) {
  return (
    <option value="" disabled hidden>
      {children}
    </option>
  );
}

function FormularioPlanoSemanal({
  form,
  erro,
  sucesso,
  carregando,
  mensagemLoading,
  onAlterar,
  onAlternarDia,
  onSubmit,
  validarMaratonaEmTempoReal = false
}) {
  const formularioRef = useRef(null);
  const camposRegistradosRef = useRef(new Set());
  const objetivosDisponiveis = objetivosDisponiveisPorExperiencia(form.experienciaCorrida);
  const objetivoPerformance = ehObjetivoPerformance(form.objetivo);
  const distanciaPerformance = distanciaObjetivoPerformance(form.objetivo);
  const formatoPerformance = formatoTempoObjetivo(form.objetivo);
  const alterarTempoPerformance = (event) => onAlterar({
    target: {
      name: event.target.name,
      value: mascararEntradaTempo(event.target.value),
      type: "text"
    }
  });
  const completarTempoPerformanceAoSair = (event) => onAlterar({
    target: {
      name: event.target.name,
      value: completarEntradaTempo(event.target.value),
      type: "text"
    }
  });
  const alterarTempo5Km = (event) => onAlterar({
    target: {
      name: event.target.name,
      value: mascararEntradaTempo(event.target.value),
      type: "text"
    }
  });
  const completarTempo5KmAoSair = (event) => {
    onAlterar({
      target: {
        name: event.target.name,
        value: completarTempo5Km(event.target.value),
        type: "text"
      }
    });
  };
  const erroTempoReal = validarMaratonaEmTempoReal
    ? validarBloqueiosMaratona(form)
    : null;
  const planoMaratona = planoIndicaMaratona(form);
  const planoMeiaOuMaratona = planoIndicaMeiaOuMaratona(form);
  const exibirPergunta5Km = corre5KmSemCaminharEhAplicavel(
    form.experienciaCorrida,
    form.objetivo
  );
  const ocultarVolumeSemanal = EXPERIENCIAS_INICIANTES.includes(form.experienciaCorrida);
  const exibirDiaLongao = diaLongaoEhAplicavel(form.experienciaCorrida);
  const volumesPorObjetivo = volumesDisponiveisPorObjetivo(
    form.objetivo,
    form.experienciaCorrida
  );
  const volumesDisponiveisBase = planoMaratona
    ? volumesPorObjetivo.filter((volume) => VOLUMES_SEMANAIS_MARATONA.includes(volume))
    : volumesPorObjetivo;
  const volumesDisponiveis = volumesDisponiveisBase;
  const erroTempoDesejado = validarComparacaoTemposPerformance(form) ||
    (erro === "O tempo desejado deve ser menor que o tempo atual." ? erro : null);
  const erroVisivel = erroTempoReal || (erroTempoDesejado ? null : erro);
  const submitBloqueado = carregando || Boolean(erroTempoReal);
  const camposCondicionais = [
    objetivoPerformance,
    exibirPergunta5Km,
    form.corre5KmSemCaminhar === "sim",
    planoMeiaOuMaratona,
    ocultarVolumeSemanal,
    exibirDiaLongao,
    form.possuiLesao
  ].join("|");

  useEffect(() => {
    if (!analyticsHabilitado({
      producao: import.meta.env.PROD,
      hostname: window.location.hostname
    })) return undefined;

    return observarCamposAlcancados({
      raiz: formularioRef.current,
      registrados: camposRegistradosRef.current,
      rastrear: rastrearEventoUmami
    });
  }, [camposCondicionais]);

  return (
    <form ref={formularioRef} className="coach-ia-form plano-ia-form" onSubmit={onSubmit}>
      <div className="coach-ia-form-titulo">
        <div><h2>Configure seu plano</h2></div>
      </div>

      <div className="coach-ia-campos plano-ia-campos">
        <label className="coach-ia-campo coach-ia-largo" data-analytics-field="email">
          <span>E-mail *</span>
          <input
            type="email"
            name="email"
            value={form.email || ""}
            onChange={onAlterar}
            placeholder="seu@email.com"
            autoComplete="email"
            required
          />
          <small className="coach-ia-campo-ajuda">
            Necessário para processar e identificar seu pagamento via Pix.
          </small>
        </label>

        <label className="coach-ia-campo" data-analytics-field="idade">
          <span>Idade *</span>
          <input
            type="number"
            name="idade"
            value={form.idade}
            onChange={onAlterar}
            onBlur={(event) => {
              if (event.target.value !== "" && Number(event.target.value) < 16) {
                onAlterar({
                  target: {
                    name: "idade",
                    value: "",
                    type: "text"
                  }
                });
              }
            }}
            onKeyDown={(event) => {
              if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                event.preventDefault();
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              onAlterar({
                target: {
                  name: "idade",
                  value: normalizarIdade(event.clipboardData.getData("text")),
                  type: "text"
                }
              });
            }}
            placeholder="Digite sua idade"
            min="16"
            max="80"
            step="1"
            required
          />
        </label>

        <label className="coach-ia-campo" data-analytics-field="experiencia">
          <span>Experiência na corrida *</span>
          <select
            name="experienciaCorrida"
            value={form.experienciaCorrida}
            onChange={onAlterar}
            required
          >
            <PlaceholderSelect>Há quanto tempo você corre?</PlaceholderSelect>
            <OpcoesSelect opcoes={EXPERIENCIAS_CORRIDA} />
          </select>
        </label>

        <label className="coach-ia-campo" data-analytics-field="objetivo">
          <span>Objetivo *</span>
          <select name="objetivo" value={form.objetivo} onChange={onAlterar} required>
            <PlaceholderSelect>Selecione</PlaceholderSelect>
            <OpcoesSelect
              opcoes={objetivosDisponiveis}
              rotulo={(objetivo) => rotuloObjetivoPorExperiencia(
                objetivo,
                form.experienciaCorrida
              )}
            />
          </select>
        </label>

        {objetivoPerformance && (
          <>
            <label className="coach-ia-campo" data-analytics-field="tempo_atual">
              <span>Tempo atual {distanciaPerformance === "Maratona" ? "na" : "nos"} {distanciaPerformance} *</span>
              <input
                name="tempoAtual"
                value={form.tempoAtual}
                onChange={alterarTempoPerformance}
                onBlur={completarTempoPerformanceAoSair}
                placeholder={formatoPerformance}
                inputMode="numeric"
                maxLength={7}
                required
              />
            </label>
            <label className="coach-ia-campo" data-analytics-field="tempo_desejado">
              <span>Tempo desejado *</span>
              <input name="tempoDesejado" value={form.tempoDesejado}
                onChange={alterarTempoPerformance} onBlur={completarTempoPerformanceAoSair}
                placeholder={formatoPerformance}
                inputMode="numeric" maxLength={7} required />
              {erroTempoDesejado && (
                <small className="coach-ia-erro" role="alert">{erroTempoDesejado}</small>
              )}
            </label>
          </>
        )}

        <label className="coach-ia-campo" data-analytics-field="ritmo_confortavel">
          <span>Ritmo confortável atual *</span>
          <select
            name="ritmoConfortavel"
            value={form.ritmoConfortavel}
            onChange={onAlterar}
            required
          >
            <PlaceholderSelect>Qual é seu ritmo confortável atual?</PlaceholderSelect>
            <OpcoesSelect opcoes={RITMOS_CONFORTAVEIS} />
          </select>
        </label>

        {exibirPergunta5Km && (
          <fieldset className="coach-ia-radio-grupo" data-analytics-field="corre_5km">
            <legend>Você já corre 5 km direto sem caminhar? *</legend>
            <div>
              <label>
                <input
                  type="radio"
                  name="corre5KmSemCaminhar"
                  value="sim"
                  checked={form.corre5KmSemCaminhar === "sim"}
                  onChange={onAlterar}
                  required
                />
                <span>Sim</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="corre5KmSemCaminhar"
                  value="nao"
                  checked={form.corre5KmSemCaminhar === "nao"}
                  onChange={onAlterar}
                  required
                />
                <span>Não</span>
              </label>
            </div>
          </fieldset>
        )}

        {exibirPergunta5Km && form.corre5KmSemCaminhar === "sim" && (
          <label className="coach-ia-campo" data-analytics-field="tempo_5km">
            <span>Em quanto tempo? *</span>
            <input
              name="tempo5Km"
              value={form.tempo5Km}
              onChange={alterarTempo5Km}
              onBlur={completarTempo5KmAoSair}
              placeholder="Digite seu tempo nos 5 km"
              inputMode="numeric"
              maxLength={7}
              required
            />
          </label>
        )}

        {planoMeiaOuMaratona && (
          <label className="coach-ia-campo" data-analytics-field="maior_distancia">
            <span>Qual foi a maior distância que você já correu? *</span>
            <input
              name="maiorDistanciaCorrida"
              value={form.maiorDistanciaCorrida}
              onChange={onAlterar}
              placeholder="Ex.: 15"
              inputMode="numeric"
              maxLength={2}
              pattern="\d{1,2}"
              required
            />
          </label>
        )}

        {!ocultarVolumeSemanal && (
          <label className="coach-ia-campo" data-analytics-field="volume_semanal">
          <span>Volume semanal *</span>
          <select
            name="volumeSemanalAtual"
            value={form.volumeSemanalAtual}
            onChange={onAlterar}
            required
          >
            <PlaceholderSelect>
              Quantos km você pretende correr por semana?
            </PlaceholderSelect>
            <OpcoesSelect opcoes={volumesDisponiveis} />
          </select>
          </label>
        )}

        <fieldset className="coach-ia-dias" data-analytics-field="dias_disponiveis">
          <legend>Dias disponíveis para treinar *</legend>
          <div>
            {DIAS_SEMANA.map((dia) => {
              const selecionado = form.diasDisponiveis.includes(dia.valor);

              return (
                <button
                  className={selecionado ? "coach-ia-dia-selecionado" : ""}
                  type="button"
                  key={dia.valor}
                  aria-pressed={selecionado}
                  onClick={() => onAlternarDia(dia.valor)}
                >
                  {dia.sigla}
                </button>
              );
            })}
          </div>
        </fieldset>

        {exibirDiaLongao && <label className="coach-ia-campo" data-analytics-field="dia_longao">
          <span>Dia do longão (treino mais longo) *</span>
          <select
            name="diaLongao"
            value={form.diaLongao}
            onChange={onAlterar}
            disabled={form.diasDisponiveis.length === 0}
            required
          >
            <option value="">Selecione o dia do longão</option>
            {DIAS_SEMANA
              .filter((dia) => form.diasDisponiveis.includes(dia.valor))
              .map((dia) => (
                <option value={dia.valor} key={dia.valor}>
                  {dia.valor}
                </option>
              ))}
          </select>
        </label>}

        <label className="coach-ia-campo" data-analytics-field="duracao_plano">
          <span>Duração do plano *</span>
          <select
            name="duracaoSemanas"
            value={form.duracaoSemanas}
            onChange={onAlterar}
            required
          >
            {DURACOES_PLANO.map((duracao) => (
              <option value={duracao.valor} key={duracao.valor}>
                {duracao.label}
              </option>
            ))}
          </select>
        </label>

        <label className="coach-ia-lesao" data-analytics-field="lesao_limitacao">
          <input
            type="checkbox"
            name="possuiLesao"
            checked={form.possuiLesao}
            onChange={onAlterar}
          />
          <span className="coach-ia-check" aria-hidden="true">✓</span>
          <span>
            <strong>Possui lesão ou limitação?</strong>
            <small>O plano priorizará sua segurança.</small>
          </span>
        </label>

        {form.possuiLesao && (
          <label className="coach-ia-campo" data-analytics-field="descricao_lesao">
            <span>Descrição da lesão *</span>
            <textarea
              name="descricaoLesao"
              value={form.descricaoLesao}
              onChange={onAlterar}
              required
            />
          </label>
        )}

        <label className="coach-ia-campo coach-ia-largo" data-analytics-field="observacoes">
          <span>Observações</span>
          <textarea
            name="observacoes"
            value={form.observacoes}
            onChange={onAlterar}
            placeholder="Fadiga, preferências ou limitações."
          />
        </label>
      </div>

      {erroVisivel && <p className="coach-ia-erro">{erroVisivel}</p>}
      {sucesso && <p className="coach-ia-sucesso">{sucesso}</p>}
      {carregando && (
        <p className="coach-ia-loading-mensagem">
          {mensagemLoading}
        </p>
      )}
      <button className="coach-ia-submit" type="submit" disabled={submitBloqueado}>
        {carregando
          ? <><span className="coach-ia-spinner" />Gerando plano...</>
          : <><span>▦</span>Gerar meu plano</>}
      </button>
    </form>
  );
}

export default FormularioPlanoSemanal;
