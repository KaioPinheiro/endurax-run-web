import { useEffect, useState } from "react";
import { DIAS_SEMANA } from "../constants/diasSemana";
import { gerarPlanoSemanalComIA } from "../services/api";
import { obterMensagemErroIa } from "../utils/mensagemErroIa";
import "./GerarTreinoIA.css";
import "./PlanoSemanalIA.css";

const INICIAL = {
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

const SEM_VALOR = "—";

const MENSAGENS_LOADING = [
  "Analisando sua rotina...",
  "Distribuindo os estímulos...",
  "Montando sua semana...",
  "Finalizando seu plano..."
];

const NOMENCLATURAS_TREINO = {
  "corrida continua": "Corrida contínua",
  "corida continua": "Corrida contínua",
  "corrrida continua": "Corrida contínua",
  "corria continua": "Corrida contínua",
  rodagem: "Corrida contínua",
  "corrida leve": "Corrida contínua",
  "corrida longa": "Corrida longa",
  "corida longa": "Corrida longa",
  "corrrida longa": "Corrida longa",
  "corria longa": "Corrida longa",
  longao: "Corrida longa",
  "treino longo": "Corrida longa",
  "treino de velocidade": "Treino de velocidade",
  velocidade: "Treino de velocidade",
  velocidadee: "Treino de velocidade",
  tiro: "Treino de velocidade",
  tiros: "Treino de velocidade",
  "treino de resistencia": "Treino de resistência",
  resistencia: "Treino de resistência",
  "corrida de resistencia": "Treino de resistência",
  intervalado: "Intervalado",
  interbalado: "Intervalado",
  intervalada: "Intervalado",
  fartlek: "Fartlek",
  "recuperacao ativa": "Recuperação ativa",
  recuperacao: "Recuperação ativa",
  mobilidade: "Mobilidade",
  mobilidadee: "Mobilidade",
  fortalecimento: "Fortalecimento",
  fortalescimento: "Fortalecimento",
  "fortalecimento leve": "Fortalecimento",
  descanso: "Descanso",
  regenerativo: "Regenerativo"
};

function textoNormalizado(valor) {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function normalizarNomenclaturaTreino(valor) {
  const chave = textoNormalizado(valor);

  return NOMENCLATURAS_TREINO[chave] ?? valor;
}

function ehValorSemMetrica(valor) {
  const texto = textoNormalizado(valor);

  return (
    !texto ||
    texto === "-" ||
    texto === "—" ||
    texto === "0" ||
    texto === "0 km" ||
    texto === "nao se aplica"
  );
}

function formatarDistancia(valor) {
  if (ehValorSemMetrica(valor)) {
    return SEM_VALOR;
  }

  const texto = String(valor).trim();
  const distancia = texto.match(/^(\d+(?:[,.]\d+)?)\s*(?:km)?$/i);

  if (!distancia) {
    return texto;
  }

  return `${distancia[1]} km`;
}

function formatarDuracao(valor) {
  if (ehValorSemMetrica(valor)) {
    return SEM_VALOR;
  }

  const texto = String(valor).trim();
  const normalizado = textoNormalizado(texto);
  const horas = normalizado.match(/(\d+)\s*(?:h|hora|horas)/);
  const minutos = normalizado.match(/(\d+)\s*(?:min|minuto|minutos)/);

  if (horas || minutos) {
    if (!horas && minutos) {
      return `${Number(minutos[1])} min`;
    }

    if (horas) {
      const horasFormatadas = `${Number(horas[1])}h`;

      if (minutos && Number(minutos[1]) > 0) {
        return `${horasFormatadas} ${Number(minutos[1])}min`;
      }

      return horasFormatadas;
    }
  }

  const apenasNumero = normalizado.match(/^(\d+)$/);
  if (apenasNumero) {
    return `${Number(apenasNumero[1])} min`;
  }

  return texto;
}

function formatarPace(valor) {
  if (ehValorSemMetrica(valor)) {
    return SEM_VALOR;
  }

  const texto = String(valor)
    .trim()
    .replace(/\s*-\s*/g, "–")
    .replace(/\s*–\s*/g, "–");

  if (/^\d+:\d{2}(?:–\d+:\d{2})?$/.test(texto)) {
    return `${texto} min/km`;
  }

  return texto;
}

function PlanoSemanalIA() {
  const [form, setForm] = useState(INICIAL);
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

  function alterar(event) {
    const { name, value, type, checked } = event.target;
    setForm((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "objetivo" && value !== "Outro"
        ? { objetivoPersonalizado: "" }
        : {}),
      ...(name === "possuiLesao" && !checked ? { descricaoLesao: "" } : {}),
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

  async function enviar(event) {
    event?.preventDefault();

    if (carregando) {
      return;
    }

    const idadeNumero = Number(form.idade);
    if (
      !Number.isInteger(idadeNumero) ||
      idadeNumero < 18 ||
      idadeNumero > 100
    ) {
      setErro("Informe uma idade inteira entre 18 e 100 anos.");
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
    setPlano(null);
    try {
      const {
        idade,
        objetivoPersonalizado,
        outraDistanciaAlvo,
        observacoes,
        ...dadosPlano
      } = form;
      const perfilAtleta = `Idade: ${idade} anos.`;

      const resultado = await gerarPlanoSemanalComIA({
        ...dadosPlano,
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

      <form className="coach-ia-form plano-ia-form" onSubmit={enviar}>
        <div className="coach-ia-form-titulo">
          <div><h2>Configure sua semana</h2></div>
          <p>O Coach distribuirá os estímulos de segunda a domingo.</p>
        </div>

        <div className="coach-ia-campos plano-ia-campos">
          <label className="coach-ia-campo">
            <span>Objetivo *</span>
            <select name="objetivo" value={form.objetivo} onChange={alterar} required>
              <option value="">Selecione</option>
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
                onChange={alterar}
                placeholder="Ex.: Correr 7 km, completar uma ultramaratona, melhorar meu tempo nos 15 km, correr 30 km em trilha, etc."
                required
              />
            </label>
          )}
          <label className="coach-ia-campo">
            <span>Idade *</span>
            <input type="number" name="idade" value={form.idade}
              onChange={(event) => {
                const valor = event.target.value;
                if (valor === "" || /^\d+$/.test(valor)) {
                  if (valor === "" || Number(valor) <= 100) {
                    alterar(event);
                  } else {
                    setErro("A idade máxima permitida é 100 anos.");
                  }
                }
              }}
              onBlur={() => {
                if (form.idade !== "" && Number(form.idade) < 18) {
                  setForm((atual) => ({ ...atual, idade: "" }));
                  setErro("A idade mínima permitida é 18 anos.");
                }
              }}
              onKeyDown={(event) => {
                if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                  event.preventDefault();
                  setErro("A idade deve ser informada somente com números inteiros.");
                }
              }}
              min="18" max="100" step="1"
              onInvalid={(event) => {
                event.preventDefault();
                setErro("Informe uma idade inteira entre 18 e 100 anos.");
              }}
              placeholder="Ex.: 30" required />
          </label>
          <label className="coach-ia-campo">
            <span>Experiência na corrida *</span>
            <select name="experienciaCorrida" value={form.experienciaCorrida}
              onChange={alterar} required>
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
            <select name="volumeSemanalAtual" value={form.volumeSemanalAtual}
              onChange={alterar} required>
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
            <select name="ritmoConfortavel" value={form.ritmoConfortavel}
              onChange={alterar} required>
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
            <select name="distanciaAlvo" value={form.distanciaAlvo}
              onChange={alterar} required>
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
              <input name="outraDistanciaAlvo" value={form.outraDistanciaAlvo}
                onChange={alterar} placeholder="Ex.: 8 km, 12 km, 30 km"
                onInvalid={(event) => {
                  event.preventDefault();
                  setErro("Informe a distância alvo desejada.");
                }}
                required />
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
                <input type="radio" name="possuiProva" value="sim"
                  checked={form.possuiProva === "sim"} onChange={alterar} required />
                <span>Sim</span>
              </label>
              <label>
                <input type="radio" name="possuiProva" value="nao"
                  checked={form.possuiProva === "nao"} onChange={alterar} required />
                <span>Não</span>
              </label>
            </div>
          </fieldset>
          {form.possuiProva === "sim" && (
            <>
              <label className="coach-ia-campo">
                <span>Data da prova *</span>
                <input type="date" name="dataProva" value={form.dataProva}
                  onChange={alterar} required />
              </label>
              <label className="coach-ia-campo">
                <span>Distância da prova *</span>
                <select name="distanciaProva" value={form.distanciaProva}
                  onChange={alterar} required>
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
                  <input name="outraDistanciaProva" value={form.outraDistanciaProva}
                    onChange={alterar} placeholder="Ex.: 50 km" required />
                </label>
              )}
              <label className="coach-ia-campo">
                <span>Objetivo para a prova</span>
                <select name="objetivoProva" value={form.objetivoProva}
                  onChange={alterar}>
                  <option value="">Selecione</option>
                  <option value="Completar a prova">Completar a prova</option>
                  <option value="Bater meu recorde pessoal">Bater meu recorde pessoal</option>
                  <option value="Buscar um tempo específico">Buscar um tempo específico</option>
                </select>
              </label>
              {form.objetivoProva === "Buscar um tempo específico" && (
                <label className="coach-ia-campo">
                  <span>Tempo desejado *</span>
                  <input name="tempoDesejadoProva" value={form.tempoDesejadoProva}
                    onChange={alterar} placeholder="Ex.: 45:00 ou 1:35:00" required />
                </label>
              )}
              <label className="coach-ia-campo">
                <span>Importância da prova *</span>
                <select name="importanciaProva" value={form.importanciaProva}
                  onChange={alterar} required>
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
            <input type="checkbox" name="possuiLesao"
              checked={form.possuiLesao} onChange={alterar} />
            <span className="coach-ia-check" aria-hidden="true">✓</span>
            <span><strong>Possui lesão ou limitação?</strong>
              <small>O plano priorizará sua segurança.</small></span>
          </label>
          {form.possuiLesao && (
            <label className="coach-ia-campo">
              <span>Descrição da lesão *</span>
              <textarea name="descricaoLesao" value={form.descricaoLesao}
                onChange={alterar} required />
            </label>
          )}
          <label className="coach-ia-campo coach-ia-largo">
            <span>Observações</span>
            <textarea name="observacoes" value={form.observacoes}
              onChange={alterar} placeholder="Fadiga, preferências ou limitações." />
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
          {carregando
            ? <><span className="coach-ia-spinner" />Gerando plano...</>
            : <><span>▦</span>Gerar plano semanal</>}
        </button>
      </form>

      {plano && (
        <section className="plano-ia-resultado">
          <header>
            <div><span>PLANO GERADO</span><h2>{plano.tituloPlano}</h2></div>
            <div className="plano-ia-badges">
              <span>{plano.objetivo}</span>
            </div>
          </header>
          <p className="plano-ia-observacoes">{plano.observacoesGerais}</p>
          {plano.alerta && <p className="plano-ia-alerta">! {plano.alerta}</p>}
          <div className="plano-ia-grid">
            {plano.treinos.map((treino) => (
              <article className="plano-ia-card" key={treino.diaSemana}>
                <div className="plano-ia-card-topo">
                  <span>{treino.diaSemana}</span>
                  <strong>{normalizarNomenclaturaTreino(treino.tipo)}</strong>
                </div>
                <h3>{normalizarNomenclaturaTreino(treino.titulo)}</h3>
                <p>{treino.descricao}</p>
                <dl>
                  <div><dt>Distância</dt><dd>{formatarDistancia(treino.distanciaKm)}</dd></div>
                  <div><dt>Duração</dt><dd>{formatarDuracao(treino.duracaoEstimada)}</dd></div>
                  <div><dt>Pace</dt><dd>{formatarPace(treino.paceSugerido)}</dd></div>
                </dl>
                {treino.observacoes && <small>{treino.observacoes}</small>}
              </article>
            ))}
          </div>
          <button
            className="coach-ia-gerar-novamente plano-ia-gerar-novamente"
            type="button"
            onClick={() => enviar()}
            disabled={carregando}
          >
            Gerar novamente
          </button>
        </section>
      )}
    </section>
  );
}

export default PlanoSemanalIA;

