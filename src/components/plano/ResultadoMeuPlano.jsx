import { useMemo, useState } from "react";
import {
  ehTreinoCorrida,
  formatarDistancia,
  formatarDuracao,
  formatarPace,
  normalizarNomenclaturaTreino
} from "../../utils/planoTreino";

function classeTipoBloco(tipo) {
  return String(tipo ?? "").trim().toLowerCase();
}

function metricaBloco(bloco) {
  if (bloco.distancia) {
    return formatarDistancia(bloco.distancia);
  }
  return bloco.duracao || "—";
}

function extrairPace(texto) {
  const pace = String(texto ?? "").match(
    /(\d+:\d{2}\s*(?:-|–|—|â€“|â€”)\s*\d+:\d{2}|\d+:\d{2})\s*min\/km/i
  );
  return pace?.[0] ?? "";
}

function extrairMetrica(texto) {
  const metrica = String(texto ?? "").trim().match(
    /^(\d+(?:[,.]\d+)?\s*(?:min(?:uto)?s?|km|m|h)|\d+:\d{2})/i
  );
  return metrica?.[1] ?? "";
}

function criarPasso(tipo, titulo, texto) {
  const metrica = extrairMetrica(texto);
  const distancia = /(?:km|m)$/i.test(metrica) ? metrica : "";
  const duracao = distancia ? "" : metrica;

  return {
    tipo,
    titulo,
    distancia,
    duracao,
    pace: extrairPace(texto),
    descricao: String(texto ?? "").trim(),
    passos: []
  };
}

function criarPassoPrincipal(texto) {
  const conteudo = String(texto ?? "").trim();

  if (/caminhada/i.test(conteudo)) {
    return criarPasso("RECUPERACAO", "Caminhada", conteudo);
  }
  if (/trote/i.test(conteudo)) {
    return criarPasso("CORRIDA", "Trote leve", conteudo);
  }
  if (/corrida/i.test(conteudo)) {
    return criarPasso("CORRIDA", "Corrida", conteudo);
  }
  return criarPasso("CORRIDA", "Treino principal", conteudo);
}

function dividirPassosPrincipais(texto) {
  const partes = [];
  let inicio = 0;
  let nivelParenteses = 0;

  for (let indice = 0; indice < texto.length; indice += 1) {
    if (texto[indice] === "(") nivelParenteses += 1;
    if (texto[indice] === ")") nivelParenteses -= 1;
    if (texto[indice] === "+" && nivelParenteses === 0) {
      partes.push(texto.slice(inicio, indice).trim());
      inicio = indice + 1;
    }
  }

  partes.push(texto.slice(inicio).trim());
  return partes.filter(Boolean);
}

function criarEtapaPrincipal(texto) {
  const conteudo = String(texto ?? "").trim();
  const repeticao = conteudo.match(/^(\d+)\s*x\s*\((.+)\)$/i);

  if (!repeticao) {
    return criarPassoPrincipal(conteudo);
  }

  const [, quantidade, sequencia] = repeticao;
  return {
    tipo: "REPETICAO",
    titulo: "Série",
    repeticoes: Number(quantidade),
    descricao: "Repita os passos na ordem indicada.",
    passos: dividirPassosPrincipais(sequencia).map(criarEtapaPrincipal)
  };
}

function criarBlocoPrincipal(texto) {
  const textoPrincipal = String(texto ?? "").trim();
  const sequenciaComposta = dividirPassosPrincipais(textoPrincipal);

  if (sequenciaComposta.length > 1) {
    return {
      tipo: "SEQUENCIA",
      titulo: "Treino principal",
      descricao: "",
      passos: sequenciaComposta.map(criarEtapaPrincipal)
    };
  }

  const etapaComRepeticao = criarEtapaPrincipal(textoPrincipal);
  if (
    textoPrincipal.includes("+") &&
    classeTipoBloco(etapaComRepeticao.tipo) === "repeticao"
  ) {
    return etapaComRepeticao;
  }

  const repeticaoNoFinal = textoPrincipal.match(
    /^(.+?)\s*\(\s*repetir\s+(\d+)\s*x\s*\)\s*$/i
  );

  if (repeticaoNoFinal) {
    const [, sequencia, quantidade] = repeticaoNoFinal;
    const passos = sequencia
      .split(/\s*,\s*/)
      .filter(Boolean)
      .map(criarPassoPrincipal);

    if (passos.length > 1) {
      return {
        tipo: "REPETICAO",
        titulo: "Série principal",
        repeticoes: Number(quantidade),
        descricao: "Repita os passos na ordem indicada.",
        passos
      };
    }
  }

  const repeticao = textoPrincipal.match(
    /^(\d+)\s*x\s*(.+?)(?:,\s*com\s+(.+?)\s+entre\s+repeti(?:ç|c)ões?)?$/i
  );

  if (!repeticao) {
    return criarPasso("CORRIDA", "Treino principal", texto);
  }

  const [, quantidade, conteudoRepeticao, recuperacaoEntreRepeticoes] = repeticao;
  const conteudoSemParenteses = conteudoRepeticao
    .replace(/^\(\s*/, "")
    .replace(/\s*\)$/, "");
  const corridaECaminhada = conteudoSemParenteses.match(
    /^(.+?),\s*((?:\d+(?:[,.]\d+)?\s*(?:min(?:uto)?s?)?\s+de\s+)?(?:caminhada|recupera(?:ç|c)ão).*)$/i
  );
  const corrida = corridaECaminhada?.[1] ?? conteudoSemParenteses;
  const recuperacao = recuperacaoEntreRepeticoes ?? corridaECaminhada?.[2];
  const passos = [criarPasso("CORRIDA", "Corrida", corrida)];
  if (recuperacao) {
    const caminhada = /caminhada/i.test(recuperacao);
    passos.push(criarPasso(
      "RECUPERACAO",
      caminhada ? "Caminhada" : "Recuperação",
      recuperacao
    ));
  }

  return {
    tipo: "REPETICAO",
    titulo: "Série principal",
    repeticoes: Number(quantidade),
    descricao: "Repita os passos na ordem indicada.",
    passos
  };
}

function blocosDaDescricao(descricao) {
  const partes = String(descricao ?? "")
    .split("|")
    .map((parte) => parte.trim())
    .filter(Boolean);

  const blocos = partes.map((parte) => {
    const separador = parte.indexOf(":");
    if (separador < 0) {
      return null;
    }

    const titulo = parte.slice(0, separador).trim().toLowerCase();
    const conteudo = parte.slice(separador + 1).trim();
    if (titulo === "aquecimento") {
      return criarPasso("AQUECIMENTO", "Aquecimento", conteudo);
    }
    if (titulo === "principal") {
      return criarBlocoPrincipal(conteudo);
    }
    if (titulo === "desaquecimento") {
      return criarPasso("DESAQUECIMENTO", "Desaquecimento", conteudo);
    }
    return null;
  }).filter(Boolean);

  return blocos.length >= 3 ? blocos : [];
}

function PassoTreino({ bloco }) {
  const tipo = classeTipoBloco(bloco.tipo);
  const passos = Array.isArray(bloco.passos) ? bloco.passos : [];

  if (tipo === "sequencia") {
    return (
      <section className="plano-bloco-repeticao">
        <header><strong>{bloco.titulo}</strong></header>
        <div className="plano-bloco-repeticao-passos">
          {passos.map((passo, indice) => (
            <PassoTreino bloco={passo} key={`${passo.tipo}-${indice}`} />
          ))}
        </div>
      </section>
    );
  }

  if (tipo === "repeticao") {
    return (
      <section className="plano-bloco-repeticao">
        <header>
          <strong>{bloco.repeticoes} vezes</strong>
          {bloco.descricao && <span>{bloco.descricao}</span>}
        </header>
        <div className="plano-bloco-repeticao-passos">
          {passos.map((passo, indice) => (
            <PassoTreino bloco={passo} key={`${passo.tipo}-${indice}`} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <article className={`plano-bloco plano-bloco-${tipo || "padrao"}`}>
      <div className="plano-bloco-conteudo">
        <div className="plano-bloco-cabecalho">
          <strong>{bloco.titulo || bloco.tipo}</strong>
          <span>{metricaBloco(bloco)}</span>
        </div>
        {bloco.pace && (
          <p className="plano-bloco-pace">Pace: {formatarPace(bloco.pace)}</p>
        )}
        {bloco.descricao && <p>{bloco.descricao}</p>}
      </div>
    </article>
  );
}

function BlocosTreino({ descricao }) {
  const blocos = blocosDaDescricao(descricao);
  if (!Array.isArray(blocos) || blocos.length === 0) {
    return null;
  }

  return (
    <section className="plano-blocos" aria-label="Passos do treino">
      <h4>Passos do treino</h4>
      <div className="plano-blocos-lista">
        {blocos.map((bloco, indice) => (
          <PassoTreino bloco={bloco} key={`${bloco.tipo}-${indice}`} />
        ))}
      </div>
    </section>
  );
}

function CardTreinoDia({ treino }) {
  const possuiBlocos = blocosDaDescricao(treino.descricao).length > 0;
  const distancia = treino.distanciaKm ??
    treino.distancia ??
    treino.distanceKm ??
    treino.distance;
  const pace = treino.paceSugerido ??
    treino.pace ??
    treino.suggestedPace ??
    extrairPace(treino.descricao);

  return (
    <article className="plano-ia-card">
      <div className="plano-ia-card-topo">
        <span>{treino.diaSemana}</span>
        <strong>{normalizarNomenclaturaTreino(treino.tipo)}</strong>
      </div>
      <h3>{normalizarNomenclaturaTreino(treino.titulo)}</h3>
      {!possuiBlocos && <p>{treino.descricao}</p>}
      <dl>
        <div><dt>Distância</dt><dd>{formatarDistancia(distancia)}</dd></div>
        <div><dt>Duração</dt><dd>{formatarDuracao(treino.duracaoEstimada)}</dd></div>
        <div><dt>Pace</dt><dd>{formatarPace(pace)}</dd></div>
      </dl>
      <BlocosTreino descricao={treino.descricao} />
      {treino.observacoes && <small>{treino.observacoes}</small>}
    </article>
  );
}

function ResultadoMeuPlano({ plano, carregando, onGerarNovamente }) {
  const [semanaAtiva, setSemanaAtiva] = useState(0);
  const semanas = useMemo(() => plano?.semanas ?? [], [plano]);
  const semanaSelecionada = semanas[semanaAtiva] ?? semanas[0];
  const treinosCorrida = useMemo(
    () => (semanaSelecionada?.treinos ?? []).filter(ehTreinoCorrida),
    [semanaSelecionada]
  );

  if (!plano) {
    return null;
  }

  return (
    <section className="plano-ia-resultado">
      <header className="plano-ia-resultado-cabecalho">
        <div>
          <span>MEU PLANO</span>
          <h2>{plano.titulo}</h2>
        </div>
        <div className="plano-ia-badges">
          <span>{plano.duracaoSemanas} semanas</span>
        </div>
      </header>

      <div className="plano-ia-resumo">
        <div>
          <span>Objetivo</span>
          <strong>{plano.objetivoPlano}</strong>
        </div>
        <div>
          <span>Duração</span>
          <strong>{plano.duracaoSemanas} semanas</strong>
        </div>
      </div>

      {plano.resumo && (
        <p className="plano-ia-observacoes">{plano.resumo}</p>
      )}
      {plano.alerta && (
        <p className="plano-ia-alerta">Atenção: {plano.alerta}</p>
      )}

      <div className="plano-ia-semanas-tabs" role="tablist" aria-label="Semanas do plano">
        {semanas.map((semana, indice) => (
          <button
            className={indice === semanaAtiva ? "plano-ia-semana-ativa" : ""}
            type="button"
            key={semana.numeroSemana}
            role="tab"
            aria-selected={indice === semanaAtiva}
            onClick={() => setSemanaAtiva(indice)}
          >
            Semana {semana.numeroSemana}
          </button>
        ))}
      </div>

      {semanaSelecionada && (
        <section className="plano-ia-semana">
          <header>
            <div>
              <span>Semana {semanaSelecionada.numeroSemana}</span>
              <h3>{semanaSelecionada.titulo}</h3>
            </div>
            {semanaSelecionada.foco && (
              <p><strong>Foco:</strong> {semanaSelecionada.foco}</p>
            )}
          </header>

          <div className="plano-ia-grid">
            {treinosCorrida.map((treino) => (
              <CardTreinoDia treino={treino} key={treino.diaSemana} />
            ))}
          </div>
        </section>
      )}

      <button
        className="coach-ia-gerar-novamente plano-ia-gerar-novamente"
        type="button"
        onClick={onGerarNovamente}
        disabled={carregando}
      >
        Gerar novo plano
      </button>
    </section>
  );
}

export default ResultadoMeuPlano;
