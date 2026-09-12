import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoEndurax from "../assets/brand/endurax-run-logo.svg";
import { buscarConfigPublica } from "../services/api";
import { formatarPrecoPlano } from "../utils/precoPlano";
import { enviarSugestaoFormspree, LIMITE_SUGESTAO } from "../utils/sugestao";
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
  const [sugestao, setSugestao] = useState("");
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [feedbackSugestao, setFeedbackSugestao] = useState(null);
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

  async function enviarSugestao(event) {
    event.preventDefault();
    if (enviandoSugestao || !sugestao.trim()) return;

    setEnviandoSugestao(true);
    setFeedbackSugestao(null);
    try {
      await enviarSugestaoFormspree(sugestao);
      setSugestao("");
      setFeedbackSugestao({ tipo: "sucesso", texto: "Mensagem enviada. Obrigado!" });
    } catch {
      setFeedbackSugestao({ tipo: "erro", texto: "Não foi possível enviar. Tente novamente." });
    } finally {
      setEnviandoSugestao(false);
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link className="landing-logo" to="/" aria-label="Endurax Run — início">
          <img src={logoEndurax} alt="Endurax Run" />
        </Link>
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
            {precoPlano && (
              <p className="landing-hero__preco landing-reveal landing-reveal--delay-3">
                Preço de lançamento: {precoPlano}
              </p>
            )}
            <div className="landing-reveal landing-reveal--delay-3"><Cta>QUERO MEU PLANO</Cta></div>
          </div>
          <div className="landing-hero__visual landing-reveal landing-reveal--delay-2">
            <div className="landing-orbita landing-orbita--um" aria-hidden="true" />
            <div className="landing-orbita landing-orbita--dois" aria-hidden="true" />
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

        <section className="landing-sugestao" aria-labelledby="sugestao-title">
          <div>
            <span className="landing-eyebrow">SUA OPINIÃO IMPORTA</span>
            <h2 id="sugestao-title">Sugestão ou problema?</h2>
            <p>Envie uma sugestão ou relate algum problema. Se for sobre um plano, informe também seu código de atendimento.</p>
          </div>
          <form onSubmit={enviarSugestao}>
            <label htmlFor="sugestao">Mensagem</label>
            <textarea
              id="sugestao"
              name="message"
              value={sugestao}
              onChange={(event) => {
                setSugestao(event.target.value.slice(0, LIMITE_SUGESTAO));
                setFeedbackSugestao(null);
              }}
              maxLength={LIMITE_SUGESTAO}
              placeholder="Conte sua sugestão ou problema. Se necessário, informe o código END-XXXXXX."
              required
            />
            <div className="landing-sugestao__rodape">
              <span>{sugestao.length}/{LIMITE_SUGESTAO}</span>
              <button type="submit" disabled={enviandoSugestao || !sugestao.trim()}>
                {enviandoSugestao ? "Enviando..." : "Enviar"}
              </button>
            </div>
            {feedbackSugestao && (
              <p
                className={`landing-sugestao__feedback landing-sugestao__feedback--${feedbackSugestao.tipo}`}
                role="status"
              >
                {feedbackSugestao.texto}
              </p>
            )}
          </form>
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
