import { useState } from "react";

const CHAVE_GUIA_DISPENSADO = "endurax_guia_intervals_icu_dispensado";

function guiaFoiDispensado() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(CHAVE_GUIA_DISPENSADO) === "true";
  } catch {
    return false;
  }
}

export default function GuiaIntervalsIcu() {
  const [dispensado, setDispensado] = useState(guiaFoiDispensado);

  if (dispensado) return null;

  function dispensar() {
    try {
      window.localStorage.setItem(CHAVE_GUIA_DISPENSADO, "true");
    } catch {
      // O guia ainda pode ser dispensado nesta visita se o armazenamento estiver indisponível.
    }
    setDispensado(true);
  }

  return (
    <section className="guia-intervals" aria-labelledby="guia-intervals-titulo">
      <div className="guia-intervals__cabecalho">
        <div>
          <span>COMO USAR SEU PLANO NO RELÓGIO</span>
          <h3 id="guia-intervals-titulo">Prepare seus treinos em 3 etapas</h3>
        </div>
        <button type="button" onClick={dispensar}>Entendi</button>
      </div>
      <ol className="guia-intervals__etapas">
        <li>
          <span className="guia-intervals__numero">01</span>
          <div>
            <h4>Configure o Intervals.icu</h4>
            <ul>
              <li>Abra o Intervals.icu e crie sua conta, caso ainda não tenha.</li>
              <li>Verifique se sua conta está conectada ao Endurax.</li>
            </ul>
          </div>
        </li>
        <li>
          <span className="guia-intervals__numero">02</span>
          <div>
            <h4>Conecte seu relógio e configure os ritmos</h4>
            <ul>
              <li>No Intervals.icu, acesse Configurações → Conexões e autorize o aplicativo do seu relógio.</li>
              <li>Em Configurações de ritmo, informe seu pace de limiar para configurar os ritmos dos treinos.</li>
            </ul>
          </div>
        </li>
        <li>
          <span className="guia-intervals__numero">03</span>
          <div>
            <h4>Envie seus treinos pelo Endurax</h4>
            <ul>
              <li>Ao final de cada treino, clique em 'Enviar ao Intervals.icu'.</li>
              <li>O treino será adicionado ao calendário do Intervals.icu.</li>
              <li>Após a sincronização com seu relógio, os treinos programados estarão disponíveis para execução.</li>
            </ul>
          </div>
        </li>
      </ol>
    </section>
  );
}
