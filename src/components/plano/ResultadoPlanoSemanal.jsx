import {
  formatarDistancia,
  formatarDuracao,
  formatarPace,
  normalizarNomenclaturaTreino
} from "../../utils/planoTreino";

function CardTreinoDia({ treino }) {
  return (
    <article className="plano-ia-card">
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
  );
}

function ResultadoPlanoSemanal({ plano, carregando, onGerarNovamente }) {
  if (!plano) {
    return null;
  }

  return (
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
          <CardTreinoDia treino={treino} key={treino.diaSemana} />
        ))}
      </div>
      <button
        className="coach-ia-gerar-novamente plano-ia-gerar-novamente"
        type="button"
        onClick={onGerarNovamente}
        disabled={carregando}
      >
        Gerar novamente
      </button>
    </section>
  );
}

export default ResultadoPlanoSemanal;
