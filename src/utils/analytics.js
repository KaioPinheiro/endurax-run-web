const UMAMI_SCRIPT_ID = "umami-script";
const UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = "8d7eb924-1916-4db8-b428-26217c2d2937";
const DOMINIOS_OFICIAIS = new Set(["enduraxrun.com.br", "www.enduraxrun.com.br"]);

export function analyticsHabilitado({ producao, hostname }) {
  return Boolean(producao && DOMINIOS_OFICIAIS.has(hostname));
}

function ambienteAtual() {
  return {
    producao: import.meta.env.PROD,
    hostname: typeof window === "undefined" ? "" : window.location.hostname
  };
}

export function carregarUmami(ambiente = ambienteAtual()) {
  if (typeof document === "undefined" || !analyticsHabilitado(ambiente)) return false;
  if (document.getElementById(UMAMI_SCRIPT_ID)) return true;

  const script = document.createElement("script");
  script.id = UMAMI_SCRIPT_ID;
  script.defer = true;
  script.src = UMAMI_SCRIPT_URL;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.dataset.domains = [...DOMINIOS_OFICIAIS].join(",");
  document.head.appendChild(script);
  return true;
}

export function rastrearEventoUmami(nome, ambiente = ambienteAtual()) {
  if (!analyticsHabilitado(ambiente) || typeof window === "undefined") return false;

  try {
    if (typeof window.umami?.track !== "function") return false;
    window.umami.track(nome);
    return true;
  } catch {
    return false;
  }
}

export function observarCamposAlcancados({
  raiz,
  registrados,
  rastrear = rastrearEventoUmami,
  ObserverClass = globalThis.IntersectionObserver,
  agendar = globalThis.setTimeout,
  cancelar = globalThis.clearTimeout
}) {
  if (!raiz || typeof ObserverClass !== "function") return () => {};

  const temporizadores = new Map();
  const observador = new ObserverClass((entradas) => {
    entradas.forEach((entrada) => {
      const campo = entrada.target.dataset.analyticsField;
      if (!campo || registrados.has(campo)) return;

      if (entrada.isIntersecting && entrada.intersectionRatio >= 0.4) {
        if (temporizadores.has(entrada.target)) return;
        const temporizador = agendar(() => {
          temporizadores.delete(entrada.target);
          if (!entrada.target.isConnected || registrados.has(campo)) return;
          registrados.add(campo);
          observador.unobserve(entrada.target);
          rastrear(`field_${campo}_reached`);
        }, 300);
        temporizadores.set(entrada.target, temporizador);
      } else {
        cancelar(temporizadores.get(entrada.target));
        temporizadores.delete(entrada.target);
      }
    });
  }, { threshold: 0.4 });

  raiz.querySelectorAll("[data-analytics-field]").forEach((campo) => {
    if (!registrados.has(campo.dataset.analyticsField)) observador.observe(campo);
  });

  return () => {
    temporizadores.forEach((temporizador) => cancelar(temporizador));
    observador.disconnect();
  };
}
