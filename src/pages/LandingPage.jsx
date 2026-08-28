import { Link } from "react-router-dom";
import logoEndurax from "../assets/brand/endurax-run-logo.svg";
import "./LandingPage.css";

const treinosSemana = [
  { dia: "Terça", tipo: "Corrida leve", detalhe: "42 min · 6:10–6:30 min/km", tom: "leve" },
  { dia: "Quinta", tipo: "Intervalado", detalhe: "6 × 800 m · pausa de 2 min", tom: "ritmo" },
  { dia: "Sábado", tipo: "Longão", detalhe: "14 km · ritmo confortável", tom: "longao" },
];

const beneficios = [
  "Plano de corrida de 4 a 6 semanas",
  "Treinos apenas nos dias escolhidos",
  "Plano para seu objetivo",
  "Ciclo ajustado ao seu nível",
  "Organização simples",
  "Funciona no celular e computador",
];

function IconeSeta() {
  return <span aria-hidden="true">↗</span>;
}

function Cta({ children = "MONTAR MEU PLANO", destaque = false }) {
  return (
    <Link className={`landing-cta${destaque ? " landing-cta--grande" : ""}`} to="/meu-plano">
      {children}
      <IconeSeta />
    </Link>
  );
}

function PreviaSemana({ completa = false }) {
  return (
    <div className={`plano-preview${completa ? " plano-preview--completa" : ""}`} aria-label="Prévia de uma semana de treinos">
      <div className="plano-preview__topo">
        <div>
          <span className="landing-eyebrow">SEU CICLO</span>
          <h3>Semana 1</h3>
        </div>
        <span className="plano-preview__badge">3 treinos</span>
      </div>
      <div className="plano-preview__progresso"><span /></div>
      <div className="plano-preview__lista">
        {treinosSemana.map((treino, indice) => (
          <article className={`treino-mini treino-mini--${treino.tom}`} key={treino.dia}>
            <span className="treino-mini__numero">0{indice + 1}</span>
            <div>
              <span className="treino-mini__dia">{treino.dia}</span>
              <strong>{treino.tipo}</strong>
              {completa && <small>{treino.detalhe}</small>}
            </div>
            <span className="treino-mini__seta" aria-hidden="true">→</span>
          </article>
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link className="landing-logo" to="/" aria-label="Endurax Run — início">
          <img src={logoEndurax} alt="Endurax Run" />
        </Link>
        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#para-quem">Para quem é</a>
          <a href="#previa">Veja o plano</a>
        </nav>
        <Link className="landing-header__acao" to="/meu-plano">MONTAR MEU PLANO <IconeSeta /></Link>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero__conteudo">
            <span className="landing-eyebrow landing-reveal">PLANEJAMENTO QUE CABE NA SUA ROTINA</span>
            <h1 id="hero-title" className="landing-reveal landing-reveal--delay-1">
              Treine com direção.<br /><em>Corra com propósito.</em>
            </h1>
            <p className="landing-hero__subtitulo landing-reveal landing-reveal--delay-2">
              Escolha seus dias, defina seu objetivo e receba um plano de corrida de 4 a 6 semanas feito para a sua rotina.
            </p>
            <p className="landing-hero__apoio landing-reveal landing-reveal--delay-2">
              <span>Sem planilhas genéricas.</span><span>Sem treinos fora da sua rotina.</span>
            </p>
            <div className="landing-reveal landing-reveal--delay-3"><Cta>QUERO MEU PLANO</Cta></div>
          </div>
          <div className="landing-hero__visual landing-reveal landing-reveal--delay-2">
            <div className="landing-orbita landing-orbita--um" aria-hidden="true" />
            <div className="landing-orbita landing-orbita--dois" aria-hidden="true" />
            <PreviaSemana />
            <span className="landing-hero__nota">Somente nos dias que você escolher</span>
          </div>
        </section>

        <section className="landing-frase" aria-label="Mensagem de motivação">
          <span aria-hidden="true">ENDURAX RUN ·</span>
          <p>Todo grande resultado começa com um plano.</p>
          <span aria-hidden="true">· 4–6 SEMANAS</span>
        </section>

        <section className="landing-section" id="como-funciona" aria-labelledby="como-title">
          <div className="landing-section__cabecalho">
            <span className="landing-eyebrow">COMO FUNCIONA</span>
            <h2 id="como-title">Seu plano pronto<br />em três passos.</h2>
          </div>
          <div className="passos-grid">
            {[
              ["01", "Conte seu objetivo", "Mostre onde você está e aonde quer chegar."],
              ["02", "Escolha seus dias", "Seu ciclo respeita a disponibilidade da sua semana."],
              ["03", "Receba seu plano", "Veja cada sessão organizada pelas próximas semanas."],
            ].map(([numero, titulo, texto]) => (
              <article className="passo-card" key={numero}>
                <span>{numero}</span><h3>{titulo}</h3><p>{texto}</p>
              </article>
            ))}
          </div>
          <div className="landing-cta-faixa"><div><span className="landing-eyebrow">O PRÓXIMO PASSO É SEU</span><h3>Pronto para começar?</h3></div><Cta /></div>
        </section>

        <section className="landing-section landing-section--contraste" id="para-quem" aria-labelledby="para-quem-title">
          <div className="landing-section__cabecalho landing-section__cabecalho--largo">
            <span className="landing-eyebrow">PARA QUEM É</span>
            <h2 id="para-quem-title">Não importa onde você está.<br /><em>O importante é para onde você quer correr.</em></h2>
          </div>
          <div className="objetivos-grid">
            <article><span>01</span><div><h3>Quero evoluir em uma distância.</h3><p>Receba um ciclo estruturado para avançar no seu objetivo.</p></div><IconeSeta /></article>
            <article><span>02</span><div><h3>Quero evoluir na corrida.</h3><p>Transforme consistência em progresso com um ciclo bem definido.</p></div><IconeSeta /></article>
          </div>
        </section>

        <section className="landing-section beneficios-section" aria-labelledby="beneficios-title">
          <div className="landing-section__cabecalho"><span className="landing-eyebrow">O ESSENCIAL, BEM FEITO</span><h2 id="beneficios-title">Treinar ficou muito mais simples.</h2></div>
          <ul className="beneficios-lista">
            {beneficios.map((beneficio, indice) => <li key={beneficio}><span>0{indice + 1}</span>{beneficio}<b aria-hidden="true">✓</b></li>)}
          </ul>
        </section>

        <section className="landing-section previa-section" id="previa" aria-labelledby="previa-title">
          <div className="previa-section__texto"><span className="landing-eyebrow">UMA SEMANA DE CADA VEZ</span><h2 id="previa-title">Veja o que<br />você recebe.</h2><p>Treinos claros, organizados por semana e apenas nos dias que fazem sentido para você.</p></div>
          <div className="previa-section__mockup"><PreviaSemana completa /></div>
          <div className="landing-cta-faixa landing-cta-faixa--previa"><div><span className="landing-eyebrow">SEM SURPRESAS</span><h3>É exatamente isso que você vai receber.</h3></div><Cta /></div>
        </section>

        <section className="landing-impacto" aria-labelledby="impacto-title">
          <div className="landing-impacto__marca" aria-hidden="true">RUN</div>
          <div><span className="landing-eyebrow">DIREÇÃO MUDA TUDO</span><h2 id="impacto-title">Quem corre com um plano <em>evolui diferente.</em></h2><p>Transforme seus dias disponíveis em um ciclo organizado para alcançar seu próximo objetivo.</p></div>
        </section>

        <section className="landing-final" aria-labelledby="final-title">
          <span className="landing-eyebrow">COMECE AGORA</span>
          <h2 id="final-title">Seu próximo objetivo merece<br /><em>mais do que improviso.</em></h2>
          <p><span>Escolha seus dias.</span><span>Defina seu objetivo.</span><span>Comece a correr com um plano feito para você.</span></p>
          <Cta destaque />
        </section>
      </main>

      <footer className="landing-footer">
        <img src={logoEndurax} alt="Endurax Run" />
        <p>Direção para cada quilômetro.</p>
        <span>© {new Date().getFullYear()} Endurax Run</span>
      </footer>
    </div>
  );
}

export default LandingPage;
