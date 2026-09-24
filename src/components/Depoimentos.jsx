import { useLayoutEffect, useRef, useState } from "react";
import { indiceCarrossel, indiceCircular, posicaoCentralCarrossel, posicoesCarrossel } from "../utils/carrossel";
import "./Depoimentos.css";

const depoimentos = [
  { nome: "Lucia", perfil: "Objetivo: Primeiros 5 km", texto: "Gosto muito do site, comecei a correr de verdade, graças ao plano. Estava fazendo tudo da minha cabeça e não conseguia ver evolução, já emagreci 3 kg." },
  { nome: "Fernanda", perfil: "Objetivo: Melhorar tempo nos 5 km", texto: "Finalmenteeee consegui fazer 5km em menos de 30 min. Aleluiaaa irmãos kkkk Obrigada endurax. O plano que ele me deu encaixou muito bem, sem firulas. Em breve vou começar meu plano para fazer minha primeira meia <3" },
  { nome: "Matheus", perfil: "Objetivo: Melhorar tempo na Meia Maratona", texto: "Deixei de pagar assessoria e fiquei só no endurax, estava pagando mais de 200 reais e os treinos daqui ainda são melhores." },
  { nome: "João", perfil: "Objetivo: Primeira Maratona", texto: "Olha eu me surpreendi com o plano, paguei só pra ver como era, e foi uma surpresa boa. Vale muito a pena e dá um direcionamento legal. O plano é objetivo e bem dividido. Parabéns aos idealizadores." },
  { nome: "Carla", perfil: "Objetivo: Primeiros 10 km", texto: "Já estou no meu terceiro plano, em breve vou estar fazendo 10 km. Estou seguindo direitinho e estou evoluindo muitooooo." },
  { nome: "André", perfil: "Objetivo: Melhorar tempo nos 10 km", texto: "Já tinha procurado vários treinos prontos na internet, mas sempre precisava adaptar alguma coisa. Gostei de receber um plano considerando meu nível, meu objetivo e os dias que posso correr." },
  { nome: "Camilla", perfil: "Objetivo: Primeira Meia Maratona", texto: "Achei muito prático. Respondi algumas perguntas, coloquei os dias que tenho disponíveis e recebi meu plano organizado para as próximas semanas." },
];

const ciclos = [0, 1, 2];

export default function Depoimentos() {
  const trilhaRef = useRef(null);
  const posicoesRef = useRef([0]);
  const [navegacao, setNavegacao] = useState({ indice: 0, total: depoimentos.length });

  useLayoutEffect(() => {
    const trilha = trilhaRef.current;
    let timer;
    let arrastando = false;
    let indiceAtual = 0;
    let larguraMedida = 0;

    function reposicionar() {
      clearTimeout(timer);
      if (arrastando) return;
      const indice = indiceCarrossel(posicoesRef.current, trilha.scrollLeft);
      const central = posicaoCentralCarrossel(indice, depoimentos.length);
      if (indice !== central) {
        trilha.scrollTo({ left: posicoesRef.current[central], behavior: "instant" });
      }
    }

    function atualizarIndice() {
      if (trilha.clientWidth !== larguraMedida) return;
      const fisico = indiceCarrossel(posicoesRef.current, trilha.scrollLeft);
      const indice = indiceCircular(fisico - depoimentos.length, depoimentos.length);
      indiceAtual = indice;
      setNavegacao((anterior) => anterior.indice === indice
        ? anterior : { indice, total: depoimentos.length });
      clearTimeout(timer);
      // Fallback para navegadores sem scrollend; nunca movimenta sem rolagem prévia.
      if (!("onscrollend" in trilha)) timer = setTimeout(reposicionar, 180);
    }
    function medir() {
      clearTimeout(timer);
      const central = depoimentos.length + indiceAtual;
      const cards = Array.from(trilha.children);
      const origem = cards[0].offsetLeft;
      posicoesRef.current = posicoesCarrossel(
        cards.map((card) => card.offsetLeft - origem), trilha.scrollWidth, trilha.clientWidth
      );
      larguraMedida = trilha.clientWidth;
      trilha.scrollTo({ left: posicoesRef.current[central], behavior: "instant" });
      atualizarIndice();
    }
    function iniciarArraste() { arrastando = true; }
    function terminarArraste() {
      arrastando = false;
      clearTimeout(timer);
      if (!("onscrollend" in trilha)) timer = setTimeout(reposicionar, 180);
    }
    medir();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    observer?.observe(trilha);
    window.addEventListener("resize", medir);
    trilha.addEventListener("scroll", atualizarIndice, { passive: true });
    trilha.addEventListener("scrollend", reposicionar);
    trilha.addEventListener("pointerdown", iniciarArraste, { passive: true });
    window.addEventListener("pointerup", terminarArraste);
    window.addEventListener("pointercancel", terminarArraste);
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener("resize", medir);
      trilha.removeEventListener("scroll", atualizarIndice);
      trilha.removeEventListener("scrollend", reposicionar);
      trilha.removeEventListener("pointerdown", iniciarArraste);
      window.removeEventListener("pointerup", terminarArraste);
      window.removeEventListener("pointercancel", terminarArraste);
    };
  }, []);

  function navegar(indice, absoluto = false) {
    const posicoes = posicoesRef.current;
    let atual = indiceCarrossel(posicoes, trilhaRef.current.scrollLeft);
    let destino;
    if (absoluto) {
      destino = ciclos.map((ciclo) => ciclo * depoimentos.length + indice)
        .filter((posicao) => posicao < posicoes.length)
        .reduce((melhor, posicao) => Math.abs(posicao - atual) < Math.abs(melhor - atual) ? posicao : melhor);
    } else {
      if (atual + indice < 0 || atual + indice >= posicoes.length) {
        atual = posicaoCentralCarrossel(atual, depoimentos.length);
        trilhaRef.current.scrollTo({ left: posicoes[atual], behavior: "instant" });
      }
      destino = atual + indice;
    }
    trilhaRef.current.scrollTo({
      left: posicoesRef.current[destino],
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <section className="landing-depoimentos" aria-labelledby="depoimentos-title" aria-roledescription="carrossel">
      <div className="landing-depoimentos__cabecalho">
        <span className="landing-eyebrow">RELATOS DE QUEM JÁ USOU</span>
        <h2 id="depoimentos-title">Feito para diferentes corredores.</h2>
        <p>Conheça quem escolheu o Endurax para dar os próximos passos na corrida.</p>
      </div>
      <div
        id="depoimentos-trilha"
        className="landing-depoimentos__trilha"
        ref={trilhaRef}
        tabIndex={0}
        role="group"
        aria-label="Depoimentos de corredores"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            navegar(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        {ciclos.flatMap((ciclo) => depoimentos.map(({ nome, perfil, texto }, indice) => (
          <article className="landing-depoimentos__card" key={`${ciclo}-${nome}`} aria-hidden={ciclo !== 1 ? true : undefined} aria-label={`Depoimento ${indice + 1} de ${depoimentos.length}`}>
            <blockquote>{texto}</blockquote>
            <div><strong>{nome}</strong><span>{perfil}</span></div>
          </article>
        )))}
      </div>
      <div className="landing-depoimentos__controles">
        <button type="button" aria-label="Depoimentos anteriores" aria-controls="depoimentos-trilha" onClick={() => navegar(-1)}>←</button>
        <div className="landing-depoimentos__indicadores">
          {Array.from({ length: navegacao.total }, (_, indice) => (
            <button
              type="button"
              key={indice}
              aria-label={`Mostrar depoimentos a partir de ${depoimentos[indice].nome}`}
              aria-controls="depoimentos-trilha"
              aria-current={navegacao.indice === indice ? "true" : undefined}
              onClick={() => navegar(indice, true)}
            ><span /></button>
          ))}
        </div>
        <button type="button" aria-label="Próximos depoimentos" aria-controls="depoimentos-trilha" onClick={() => navegar(1)}>→</button>
      </div>
    </section>
  );
}
