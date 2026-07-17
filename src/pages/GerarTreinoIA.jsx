import { useEffect, useState } from "react";
import { DIAS_SEMANA } from "../constants/diasSemana";
import { gerarTreinoComIA } from "../services/api";
import { obterMensagemErroIa } from "../utils/mensagemErroIa";
import { normalizarIdade } from "../utils/planoTreino";
import "./GerarTreinoIA.css";

const FORM_INICIAL = {
  objetivo: "",
  objetivoPersonalizado: "",
  idade: "",
  experienciaCorrida: "",
  volumeSemanalAtual: "",
  ritmoConfortavel: "",
  distanciaAlvo: "",
  outraDistanciaAlvo: "",
  diasDisponiveis: [],
  possuiLesao: false,
  descricaoLesao: "",
  possuiProva: "",
  dataProva: "",
  distanciaProva: "",
  outraDistanciaProva: "",
  objetivoProva: "",
  tempoDesejadoProva: "",
  importanciaProva: "",
  observacoes: ""
};

const MENSAGENS_LOADING = [
  "Analisando seu perfil...",
  "Definindo intensidade...",
  "Montando seu treino...",
  "Quase pronto..."
];

function GerarTreinoIA() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [treino, setTreino] = useState(null);
  const [sucesso, setSucesso] = useState("");
  const [indiceMensagemLoading, setIndiceMensagemLoading] = useState(0);

  useEffect(() => {
    if (!carregando) {
      return undefined;
    }

    const intervalo = setInterval(() => {
      setIndiceMensagemLoading((atual) =>
        (atual + 1) % MENSAGENS_LOADING.length
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

  function alterarCampo(event) {
    const { name, value, type, checked } = event.target;

    setForm((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "objetivo" && value !== "Outro"
        ? { objetivoPersonalizado: "" }
        : {}),
      ...(name === "possuiLesao" && !checked
        ? { descricaoLesao: "" }
        : {}),
      ...(name === "distanciaAlvo" && value !== "Outro"
        ? { outraDistanciaAlvo: "" }
        : {}),
      ...(name === "possuiProva" && value !== "sim"
        ? {
            dataProva: "",
            distanciaProva: "",
            outraDistanciaProva: "",
            objetivoProva: "",
            tempoDesejadoProva: "",
            importanciaProva: ""
          }
        : {}),
      ...(name === "distanciaProva" && value !== "Outra"
        ? { outraDistanciaProva: "" }
        : {}),
      ...(name === "objetivoProva" && value !== "Buscar um tempo específico"
        ? { tempoDesejadoProva: "" }
        : {})
    }));
  }

  function alternarDia(dia) {
    setForm((atual) => ({
      ...atual,
      diasDisponiveis: atual.diasDisponiveis.includes(dia)
        ? atual.diasDisponiveis.filter((item) => item !== dia)
        : [...atual.diasDisponiveis, dia]
    }));
    setErro("");
  }

  async function enviarFormulario(event) {
    event?.preventDefault();

    if (carregando) {
      return;
    }

    const idadeNumero = Number(form.idade);
    if (
      !Number.isInteger(idadeNumero) ||
      idadeNumero < 16 ||
      idadeNumero > 80
    ) {
      setErro("Informe uma idade inteira entre 16 e 80 anos.");
      return;
    }

    if (form.diasDisponiveis.length === 0) {
      setErro("Selecione pelo menos um dia disponível para treinar.");
      return;
    }

    if (
      form.objetivo === "Outro" &&
      !form.objetivoPersonalizado.trim()
    ) {
      setErro("Informe o objetivo personalizado.");
      return;
    }

    if (
      form.distanciaAlvo === "Outro" &&
      !form.outraDistanciaAlvo.trim()
    ) {
      setErro("Informe a distância alvo desejada.");
      return;
    }

    setCarregando(true);
    setErro("");
    setSucesso("");
    setIndiceMensagemLoading(0);
    setTreino(null);

    try {
      const {
        idade,
        objetivoPersonalizado,
        outraDistanciaAlvo,
        observacoes,
        ...dadosTreino
      } = form;
      const perfilAtleta = `Idade: ${idade} anos.`;

      const resultado = await gerarTreinoComIA({
        ...dadosTreino,
        objetivo: form.objetivo === "Outro"
          ? objetivoPersonalizado.trim()
          : form.objetivo,
        idade: idadeNumero,
        distanciaAlvo: form.distanciaAlvo === "Outro"
          ? outraDistanciaAlvo.trim()
          : form.distanciaAlvo,
        possuiProva: form.possuiProva === "sim",
        intensidadeDesejada: "adequada ao perfil informado",
        observacoes: observacoes.trim()
          ? `${perfilAtleta} Observações adicionais: ${observacoes.trim()}`
          : perfilAtleta
      });
      setTreino(resultado);
      setSucesso("Treino gerado com sucesso!");
    } catch (error) {
      setErro(obterMensagemErroIa(
        error,
        "Não foi possível gerar seu treino agora. Tente novamente em alguns instantes."
      ));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="coach-ia-page">
      <header className="coach-ia-hero">
        <span>✦ ENDURAX COACH</span>
        <h1>Seu próximo treino, pensado para você.</h1>
        <p>
          Conte como está sua rotina e receba uma sugestão segura,
          objetiva e alinhada ao seu momento.
        </p>
      </header>

      <div className="coach-ia-layout">
        <form className="coach-ia-form" onSubmit={enviarFormulario}>
          <div className="coach-ia-form-titulo">
            <div><h2>Perfil do treino</h2></div>
            <p>Preencha os dados para personalizar sua sessão.</p>
          </div>

          <div className="coach-ia-campos">
            <label className="coach-ia-campo">
              <span>Objetivo *</span>
              <select name="objetivo" value={form.objetivo} onChange={alterarCampo} required>
                <option value="">Selecione seu objetivo</option>
                <option value="Emagrecer">Emagrecer</option>
                <option value="Melhorar condicionamento">Melhorar condicionamento</option>
                <option value="Melhorar pace">Melhorar pace</option>
                <option value="Primeiros 5 km">Primeiros 5 km</option>
                <option value="Primeiros 10 km">Primeiros 10 km</option>
                <option value="Primeira meia maratona">Primeira meia maratona</option>
                <option value="Primeira maratona">Primeira maratona</option>
                <option value="Sub 20 nos 5 km">Sub 20 nos 5 km</option>
                <option value="Sub 40 nos 10 km">Sub 40 nos 10 km</option>
                <option value="RP na meia">RP na meia</option>
                <option value="RP na maratona">RP na maratona</option>
                <option value="Outro">Outro</option>
              </select>
            </label>

            {form.objetivo === "Outro" && (
              <label className="coach-ia-campo">
                <span>Objetivo personalizado *</span>
                <input
                  name="objetivoPersonalizado"
                  value={form.objetivoPersonalizado}
                  onChange={alterarCampo}
                  placeholder="Ex.: Correr 7 km, completar uma ultramaratona, melhorar meu tempo nos 15 km, correr 30 km em trilha, etc."
                  required
                />
              </label>
            )}

            <label className="coach-ia-campo">
              <span>Idade *</span>
              <input
                type="number"
                name="idade"
                value={form.idade}
                onChange={(event) => {
                  setForm((atual) => ({
                    ...atual,
                    idade: normalizarIdade(event.target.value)
                  }));
                }}
                onBlur={() => {
                  if (form.idade !== "" && Number(form.idade) < 16) {
                    setForm((atual) => ({ ...atual, idade: "" }));
                    setErro("A idade mínima permitida é 16 anos.");
                  }
                }}
                onKeyDown={(event) => {
                  if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                    event.preventDefault();
                    setErro("A idade deve ser informada somente com números inteiros.");
                  }
                }}
                onPaste={(event) => {
                  event.preventDefault();
                  setForm((atual) => ({
                    ...atual,
                    idade: normalizarIdade(event.clipboardData.getData("text"))
                  }));
                }}
                min="16"
                max="80"
                step="1"
                placeholder="Ex.: 30"
                onInvalid={(event) => {
                  event.preventDefault();
                  setErro("Informe uma idade inteira entre 16 e 80 anos.");
                }}
                required
              />
            </label>

            <label className="coach-ia-campo">
              <span>Experiência na corrida *</span>
              <select
                name="experienciaCorrida"
                value={form.experienciaCorrida}
                onChange={alterarCampo}
                required
              >
                <option value="">Há quanto tempo você corre?</option>
                <option value="Nunca corri">Nunca corri</option>
                <option value="Menos de 6 meses">Menos de 6 meses</option>
                <option value="6 meses a 1 ano">6 meses a 1 ano</option>
                <option value="1 a 3 anos">1 a 3 anos</option>
                <option value="Mais de 3 anos">Mais de 3 anos</option>
              </select>
            </label>

            <label className="coach-ia-campo">
              <span>Volume semanal atual *</span>
              <select
                name="volumeSemanalAtual"
                value={form.volumeSemanalAtual}
                onChange={alterarCampo}
                required
              >
                <option value="">Quantos km você corre por semana?</option>
                <option value="Não sei informar">Não sei informar</option>
                <option value="Ainda não corro">Ainda não corro</option>
                <option value="Menos de 10 km">Menos de 10 km</option>
                <option value="10–20 km">10–20 km</option>
                <option value="20–40 km">20–40 km</option>
                <option value="40–60 km">40–60 km</option>
                <option value="60–80 km">60–80 km</option>
                <option value="80+ km">80+ km</option>
              </select>
            </label>

            <label className="coach-ia-campo">
              <span>Ritmo confortável atual *</span>
              <select
                name="ritmoConfortavel"
                value={form.ritmoConfortavel}
                onChange={alterarCampo}
                required
              >
                <option value="">Qual é seu ritmo confortável atual?</option>
                <option value="Ainda não sei informar">Ainda não sei informar</option>
                <option value="Caminhada / trote leve">Caminhada / trote leve</option>
                <option value="Acima de 7:00 min/km">Acima de 7:00 min/km</option>
                <option value="6:30–7:00 min/km">6:30–7:00 min/km</option>
                <option value="6:00–6:30 min/km">6:00–6:30 min/km</option>
                <option value="5:30–6:00 min/km">5:30–6:00 min/km</option>
                <option value="5:00–5:30 min/km">5:00–5:30 min/km</option>
                <option value="4:30–5:00 min/km">4:30–5:00 min/km</option>
                <option value="4:00–4:30 min/km">4:00–4:30 min/km</option>
                <option value="Abaixo de 4:00 min/km">Abaixo de 4:00 min/km</option>
              </select>
            </label>

            <label className="coach-ia-campo">
              <span>Distância alvo *</span>
              <select
                name="distanciaAlvo"
                value={form.distanciaAlvo}
                onChange={alterarCampo}
                required
              >
                <option value="">Selecione a distância alvo</option>
                <option value="5 km">5 km</option>
                <option value="10 km">10 km</option>
                <option value="15 km">15 km</option>
                <option value="21 km">21 km</option>
                <option value="42 km">42 km</option>
                <option value="Ultra">Ultra</option>
                <option value="Outro">Outro</option>
              </select>
            </label>

            {form.distanciaAlvo === "Outro" && (
              <label className="coach-ia-campo">
                <span>Informe a distância alvo *</span>
                <input
                  name="outraDistanciaAlvo"
                  value={form.outraDistanciaAlvo}
                  onChange={alterarCampo}
                  placeholder="Ex.: 8 km, 12 km, 30 km"
                  onInvalid={(event) => {
                    event.preventDefault();
                    setErro("Informe a distância alvo desejada.");
                  }}
                  required
                />
              </label>
            )}

            <fieldset className="coach-ia-dias">
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
                      onClick={() => alternarDia(dia.valor)}
                    >
                      {dia.sigla}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="coach-ia-radio-grupo">
              <legend>Possui uma prova marcada? *</legend>
              <div>
                <label>
                  <input
                    type="radio"
                    name="possuiProva"
                    value="sim"
                    checked={form.possuiProva === "sim"}
                    onChange={alterarCampo}
                    required
                  />
                  <span>Sim</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="possuiProva"
                    value="nao"
                    checked={form.possuiProva === "nao"}
                    onChange={alterarCampo}
                    required
                  />
                  <span>Não</span>
                </label>
              </div>
            </fieldset>

            {form.possuiProva === "sim" && (
              <>
                <label className="coach-ia-campo">
                  <span>Data da prova *</span>
                  <input
                    type="date"
                    name="dataProva"
                    value={form.dataProva}
                    onChange={alterarCampo}
                    required
                  />
                </label>

                <label className="coach-ia-campo">
                  <span>Distância da prova *</span>
                  <select
                    name="distanciaProva"
                    value={form.distanciaProva}
                    onChange={alterarCampo}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="5 km">5 km</option>
                    <option value="10 km">10 km</option>
                    <option value="15 km">15 km</option>
                    <option value="21 km (Meia Maratona)">21 km (Meia Maratona)</option>
                    <option value="42 km (Maratona)">42 km (Maratona)</option>
                    <option value="Ultramaratona">Ultramaratona</option>
                    <option value="Outra">Outra</option>
                  </select>
                </label>

                {form.distanciaProva === "Outra" && (
                  <label className="coach-ia-campo">
                    <span>Qual é a distância? *</span>
                    <input
                      name="outraDistanciaProva"
                      value={form.outraDistanciaProva}
                      onChange={alterarCampo}
                      placeholder="Ex.: 50 km"
                      required
                    />
                  </label>
                )}

                <label className="coach-ia-campo">
                  <span>Objetivo para a prova</span>
                  <select
                    name="objetivoProva"
                    value={form.objetivoProva}
                    onChange={alterarCampo}
                  >
                    <option value="">Selecione</option>
                    <option value="Completar a prova">Completar a prova</option>
                    <option value="Bater meu recorde pessoal">Bater meu recorde pessoal</option>
                    <option value="Buscar um tempo específico">Buscar um tempo específico</option>
                  </select>
                </label>

                {form.objetivoProva === "Buscar um tempo específico" && (
                  <label className="coach-ia-campo">
                    <span>Tempo desejado *</span>
                    <input
                      name="tempoDesejadoProva"
                      value={form.tempoDesejadoProva}
                      onChange={alterarCampo}
                      placeholder="Ex.: 45:00 ou 1:35:00"
                      required
                    />
                  </label>
                )}

                <label className="coach-ia-campo">
                  <span>Importância da prova *</span>
                  <select
                    name="importanciaProva"
                    value={form.importanciaProva}
                    onChange={alterarCampo}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="Apenas participar">Apenas participar</option>
                    <option value="Prova importante">Prova importante</option>
                    <option value="Prova principal da temporada">
                      Prova principal da temporada
                    </option>
                  </select>
                </label>
              </>
            )}

            <label className="coach-ia-lesao">
              <input
                type="checkbox"
                name="possuiLesao"
                checked={form.possuiLesao}
                onChange={alterarCampo}
              />
              <span className="coach-ia-check" aria-hidden="true">✓</span>
              <span>
                <strong>Possui lesão ou limitação?</strong>
                <small>Isso ajuda o Coach a priorizar sua segurança.</small>
              </span>
            </label>

            {form.possuiLesao && (
              <label className="coach-ia-campo coach-ia-largo">
                <span>Descrição da lesão ou limitação *</span>
                <textarea
                  name="descricaoLesao"
                  value={form.descricaoLesao}
                  onChange={alterarCampo}
                  placeholder="Descreva a lesão, dor ou limitação."
                  required
                />
              </label>
            )}

            <label className="coach-ia-campo coach-ia-largo">
              <span>Observações adicionais</span>
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={alterarCampo}
                placeholder="Ex.: estou voltando de fadiga e quero evitar estímulos muito fortes."
              />
            </label>
          </div>

          {erro && <p className="coach-ia-erro">{erro}</p>}
          {sucesso && <p className="coach-ia-sucesso">{sucesso}</p>}
          {carregando && (
            <p className="coach-ia-loading-mensagem">
              {MENSAGENS_LOADING[indiceMensagemLoading]}
            </p>
          )}

          <button className="coach-ia-submit" type="submit" disabled={carregando}>
            {carregando ? (
              <><span className="coach-ia-spinner" />Gerando treino...</>
            ) : (
              <><span>✦</span>Gerar treino personalizado</>
            )}
          </button>
        </form>

        <aside className={`coach-ia-resultado ${treino ? "coach-ia-pronto" : ""}`}>
          {treino ? (
            <>
              <div className="coach-ia-resultado-topo">
                <span>SEU TREINO</span>
                <strong>{treino.tipo}</strong>
              </div>
              <h2>{treino.titulo}</h2>
              <p className="coach-ia-descricao">{treino.descricao}</p>

              <div className="coach-ia-metricas">
                <div><span>Distância</span><strong>{treino.distanciaKm || "—"}</strong></div>
                <div><span>Duração</span><strong>{treino.duracaoEstimada || "—"}</strong></div>
                <div><span>Pace</span><strong>{treino.paceSugerido || "—"}</strong></div>
              </div>

              {treino.observacoes && (
                <div className="coach-ia-nota">
                  <span>Como executar</span>
                  <p>{treino.observacoes}</p>
                </div>
              )}

              {treino.alerta && (
                <div className="coach-ia-alerta">
                  <span>!</span>
                  <p>{treino.alerta}</p>
                </div>
              )}

              <button
                className="coach-ia-gerar-novamente"
                type="button"
                onClick={() => enviarFormulario()}
                disabled={carregando}
              >
                Gerar novamente
              </button>
            </>
          ) : (
            <div className="coach-ia-vazio">
              <div>✦</div>
              <h2>Seu treino aparecerá aqui</h2>
              <p>
                Preencha o formulário para o Coach montar uma sessão
                alinhada ao seu objetivo.
              </p>
              <ul>
                <li>Personalizado para seu perfil</li>
                <li>Duração definida para seu perfil</li>
                <li>Com recomendações de segurança</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export default GerarTreinoIA;


