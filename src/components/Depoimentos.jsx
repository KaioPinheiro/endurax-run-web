import { useLayoutEffect, useRef, useState } from "react";
import { indiceCarrossel, indiceCircular, posicaoCentralCarrossel, posicoesCarrossel } from "../utils/carrossel";
import "./Depoimentos.css";

const depoimentos = [
  { nome: "Lucas", perfil: "Corredor iniciante", texto: "Eu queria começar a correr, mas não sabia como montar os treinos sem exagerar. O plano me deu uma direção e ficou fácil entender o que fazer em cada dia." },
  { nome: "Mariana", perfil: "Corredora amadora", texto: "O que mais gostei foi poder escolher os dias que consigo treinar. O plano se encaixou na minha semana, em vez de eu ter que adaptar toda a minha rotina aos treinos." },
  { nome: "Bruno", perfil: "Corredor amador", texto: "Eu já corria há um tempo, mas treinava muito no improviso. Ter os treinos organizados para cada semana fez bastante diferença para manter uma sequência." },
  { nome: "Rafael", perfil: "Foco nos 10 km", texto: "Queria evoluir nos 10 km, mas não sabia como distribuir os treinos durante a semana. Agora tenho um plano claro e sei o propósito de cada treino." },
  { nome: "Camila", perfil: "Corredora iniciante", texto: "Achei muito prático. Respondi algumas perguntas, coloquei os dias que tenho disponíveis e recebi meu plano organizado para as próximas semanas." },
  { nome: "André", perfil: "Corredor amador", texto: "Já tinha procurado vários treinos prontos na internet, mas sempre precisava adaptar alguma coisa. Gostei de receber um plano considerando meu nível, meu objetivo e os dias que posso correr." },
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
