import { useState } from "react";
import { enviarSugestaoFormspree, LIMITE_SUGESTAO } from "../utils/sugestao";
import "../pages/LandingPage.css";

export default function SugestaoProblema({ codigoAtendimento }) {
  const [sugestao, setSugestao] = useState("");
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [feedbackSugestao, setFeedbackSugestao] = useState(null);

  async function enviarSugestao(event) {
    event.preventDefault();
    if (enviandoSugestao || !sugestao.trim()) return;

    setEnviandoSugestao(true);
    setFeedbackSugestao(null);
    try {
      await enviarSugestaoFormspree(sugestao, codigoAtendimento);
      setSugestao("");
      setFeedbackSugestao({ tipo: "sucesso", texto: "Mensagem enviada. Obrigado!" });
    } catch {
      setFeedbackSugestao({ tipo: "erro", texto: "Não foi possível enviar. Tente novamente." });
    } finally {
      setEnviandoSugestao(false);
    }
  }

  return (
        <section className="landing-sugestao sugestao-problema--pagamento" aria-labelledby="sugestao-title">
          <div>
            <span className="landing-eyebrow">SUA OPINIÃO IMPORTA</span>
            <h2 id="sugestao-title">Sugestão ou suporte?</h2>
            <p>Envie sua sugestão ou fale com a gente caso precise de suporte.</p>
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
              placeholder="Descreva como podemos ajudar."
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
  );
}
