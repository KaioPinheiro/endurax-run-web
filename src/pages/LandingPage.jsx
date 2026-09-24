import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoEndurax from "../assets/brand/endurax-run-logo.svg";
import { buscarConfigPublica } from "../services/api";
import { formatarPrecoPlano } from "../utils/precoPlano";
import Depoimentos from "../components/Depoimentos";
import PrecoPlanoLanding from "../components/PrecoPlanoLanding";
import SugestaoProblema from "../components/SugestaoProblema";
import "./LandingPage.css";

const treinosSemana = [
  { dia: "Terça", tipo: "Corrida leve", detalhe: "42 min · 6:10–6:30 min/km", tom: "leve" },
  { dia: "Quinta", tipo: "Intervalado", detalhe: "6 × 800 m · pausa de 2 min", tom: "ritmo" },
  { dia: "Sábado", tipo: "Longão", detalhe: "14 km · ritmo confortável", tom: "longao" },
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
      <div className="plano-preview__progresso" />
      <div className="plano-preview__lista">
        {treinosSemana.map((treino, indice) => (
          <article className={`treino-mini treino-mini--${treino.tom}`} key={treino.dia}>
            <span className="treino-mini__numero">0{indice + 1}</span>
            <div>
              <span className="treino-mini__dia">{treino.dia}</span>
              <strong>{treino.tipo}</strong>
              {completa && <small>{treino.detalhe}</small>}
            </div>
            <span className="treino-mini__seta" aria-hidden="true" />
          </article>
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const [precoPlano, setPrecoPlano] = useState(null);

  useEffect(() => {
    let ativo = true;

    buscarConfigPublica()
      .then((config) => {
        if (ativo) setPrecoPlano(formatarPrecoPlano(config?.valorPlano));
      })
      .catch(() => {
        if (ativo) setPrecoPlano(null);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function irParaSuporte(event) {
    event.preventDefault();
    document.getElementById("sugestao-suporte")?.scrollIntoView({ behavior: "smooth" });
  }


  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link className="landing-logo" to="/" aria-label="Endurax Run — início">
          <img src={logoEndurax} alt="Endurax Run" />
        </Link>
        <nav className="landing-header__acoes" aria-label="Ações principais">
          <a className="landing-header__acao" href="#sugestao-suporte" onClick={irParaSuporte}>
            FALE CONOSCO
          </a>
          <Link className="landing-header__acao" to="/meu-plano">CRIAR MEU PLANO <IconeSeta /></Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero__conteudo">
            <h1 id="hero-title" className="landing-reveal landing-reveal--delay-1">
              Seu plano de corrida.<br /><em>Feito para você.</em>
            </h1>
            <p className="landing-hero__subtitulo landing-reveal landing-reveal--delay-2">
              Você dá o primeiro passo. O Endurax mostra os próximos.
            </p>
            <p className="landing-hero__apoio landing-reveal landing-reveal--delay-2">
              <span>Sem planilhas genéricas.</span><span>Treinos que cabem na sua rotina.</span>
            </p>
            <PrecoPlanoLanding preco={precoPlano} className="landing-reveal landing-reveal--delay-3" />
            <div className="landing-reveal landing-reveal--delay-3"><Cta>CRIAR MEU PLANO</Cta></div>
          </div>
          <div className="landing-hero__visual landing-reveal landing-reveal--delay-2">
            <div className="landing-orbita landing-orbita--um" aria-hidden="true" />
            <div className="landing-orbita landing-orbita--dois" aria-hidden="true" />
            <div className="landing-hero__exemplo">
              <span className="landing-eyebrow">VEJA NA PRÁTICA</span>
              <h2>Um plano que se adapta a você.</h2>
              <p className="landing-hero__tags">
                <span>SEU NÍVEL</span>
                <span>SEU OBJETIVO</span>
                <span>SUA ROTINA</span>
              </p>
            </div>
            <PreviaSemana />
            <span className="landing-hero__nota">Somente nos dias que você escolher</span>
          </div>
        </section>

        <section className="landing-section" id="como-funciona" aria-labelledby="como-title">
          <div className="landing-section__cabecalho">
            <span className="landing-eyebrow">COMO FUNCIONA</span>
            <h2 id="como-title">Seu plano pronto<br />em três passos.</h2>
          </div>
          <div className="passos-grid">
            {[
              ["01", "Conte onde você está", "Responda algumas perguntas rápidas sobre sua corrida."],
              ["02", "Escolha seus dias", "Defina quais dias você pode treinar."],
              ["03", "Receba seu plano", "Tenha seus treinos organizados para as próximas semanas."],
            ].map(([numero, titulo, texto]) => (
              <article className="passo-card" key={numero}>
                <span>{numero}</span><h3>{titulo}</h3><p>{texto}</p>
              </article>
            ))}
          </div>
        </section>

        <Depoimentos />

        <section className="landing-conversao" aria-labelledby="conversao-title">
          <span className="landing-eyebrow">PRONTO PARA COMEÇAR?</span>
          <h2 id="conversao-title">Seu próximo plano começa aqui.</h2>
          <p>Dê o próximo passo na sua corrida. O Endurax mostra o caminho.</p>
          <PrecoPlanoLanding preco={precoPlano} />
          <Cta>CRIAR MEU PLANO</Cta>
        </section>

        <SugestaoProblema id="sugestao-suporte" />

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
