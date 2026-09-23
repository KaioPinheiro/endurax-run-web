function BlocoDemonstracao({ tipo, titulo }) {
  return (
    <div className={`plano-bloco plano-bloco-${tipo}`}>
      <div className="plano-bloco-conteudo">
        <div className="plano-bloco-cabecalho">
          <strong>{titulo}</strong>
          <span className="plano-demo-bloqueado">Conteúdo personalizado</span>
        </div>
      </div>
    </div>
  );
}

function DemonstracaoPlano() {
  return (
    <section className="plano-demo" aria-labelledby="plano-demo-titulo">
      <header>
        <span>Demonstração visual</span>
        <h2 id="plano-demo-titulo">Veja como seu plano será apresentado</h2>
      </header>

      <article className="plano-ia-card plano-demo-card">
        <div className="plano-ia-card-topo">
          <span>Formato do treino</span>
          <strong>Personalizado para você</strong>
        </div>
        <h3>Intervalado</h3>

        <div className="plano-blocos">
          <h4>Estrutura do treino</h4>
          <div className="plano-blocos-lista">
            <BlocoDemonstracao tipo="aquecimento" titulo="Aquecimento" />
            <BlocoDemonstracao tipo="corrida" titulo="Parte principal" />
            <BlocoDemonstracao tipo="desaquecimento" titulo="Desaquecimento" />
          </div>
        </div>
      </article>

      <p>Ritmos, distâncias, duração e progressão serão personalizados no seu plano.</p>
      <p>Seu plano será gerado de acordo com suas respostas após a confirmação do pagamento.</p>
    </section>
  );
}

export default DemonstracaoPlano;
