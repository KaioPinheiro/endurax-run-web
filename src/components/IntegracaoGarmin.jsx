import iconeEndurax from "../assets/brand/endurax-run-icon.svg";
import "./IntegracaoGarmin.css";

function IconeIntervals() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="9" y="12" width="46" height="42" rx="9" stroke="currentColor" strokeWidth="2.5" />
      <path d="M9 24h46M21 8v9M43 8v9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 43h7l5-10 6 14 5-9h5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeGarmin() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M24 10V5h16v5M24 54v5h16v-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="15" y="10" width="34" height="44" rx="11" stroke="currentColor" strokeWidth="2.5" />
      <rect x="21" y="18" width="22" height="28" rx="5" stroke="currentColor" strokeWidth="2" />
      <path d="m27 34 4 4 7-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function IntegracaoGarmin() {
  return (
    <section className="landing-garmin" aria-labelledby="landing-garmin-title">
      <div className="landing-garmin__cabecalho">
        <span className="landing-eyebrow">SEU TREINO NO RELÓGIO</span>
        <h2 id="landing-garmin-title">Do seu plano direto para o seu Garmin.</h2>
        <p>Envie seus treinos pelo Intervals.icu e acompanhe etapas e metas de ritmo no relógio durante a corrida.</p>
      </div>

      <ol className="landing-garmin__fluxo" aria-label="Fluxo do treino até o relógio">
        <li className="landing-garmin__card">
          <span className="landing-garmin__icone landing-garmin__icone--endurax" aria-hidden="true">
            <img src={iconeEndurax} alt="" />
          </span>
          <strong>Endurax</strong>
        </li>
        <li className="landing-garmin__card">
          <span className="landing-garmin__icone" aria-hidden="true"><IconeIntervals /></span>
          <strong>Intervals.icu</strong>
        </li>
        <li className="landing-garmin__card">
          <span className="landing-garmin__icone" aria-hidden="true"><IconeGarmin /></span>
          <strong>Garmin</strong>
        </li>
      </ol>

      <p className="landing-garmin__rodape">Integração via Intervals.icu. Requer contas conectadas e dispositivo compatível.</p>
    </section>
  );
}
