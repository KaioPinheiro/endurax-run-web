import { useEffect, useRef, useState } from "react";
import { indiceCarrossel, posicoesCarrossel } from "../utils/carrossel";
import "./Depoimentos.css";

const depoimentos = [
  { nome: "Lucas", perfil: "Corredor iniciante", texto: "Eu queria começar a correr, mas não sabia como montar os treinos sem exagerar. O plano me deu uma direção e ficou fácil entender o que fazer em cada dia." },
  { nome: "Mariana", perfil: "Corredora amadora", texto: "O que mais gostei foi poder escolher os dias que consigo treinar. O plano se encaixou na minha semana, em vez de eu ter que adaptar toda a minha rotina aos treinos." },
  { nome: "Bruno", perfil: "Corredor amador", texto: "Eu já corria há um tempo, mas treinava muito no improviso. Ter os treinos organizados para cada semana fez bastante diferença para manter uma sequência." },
  { nome: "Rafael", perfil: "Foco nos 10 km", texto: "Queria evoluir nos 10 km, mas não sabia como distribuir os treinos durante a semana. Agora tenho um plano claro e sei o propósito de cada treino." },
  { nome: "Camila", perfil: "Corredora iniciante", texto: "Achei muito prático. Respondi algumas perguntas, coloquei os dias que tenho disponíveis e recebi meu plano organizado para as próximas semanas." },
  { nome: "André", perfil: "Corredor amador", texto: "Já tinha procurado vários treinos prontos na internet, mas sempre precisava adaptar alguma coisa. Gostei de receber um plano considerando meu nível, meu objetivo e os dias que posso correr." },
];

export default function Depoimentos() {
  const trilhaRef = useRef(null);
  const posicoesRef = useRef([0]);
  const [navegacao, setNavegacao] = useState({ indice: 0, total: 1 });

  useEffect(() => {
    const trilha = trilhaRef.current;
    function atualizarIndice() {
      const indice = indiceCarrossel(posicoesRef.current, trilha.scrollLeft);
      const total = posicoesRef.current.length;
      setNavegacao((anterior) => anterior.indice === indice && anterior.total === total
        ? anterior : { indice, total });
    }
    function medir() {
      const cards = Array.from(trilha.children);
      const origem = cards[0].offsetLeft;
      posicoesRef.current = posicoesCarrossel(
        cards.map((card) => card.offsetLeft - origem), trilha.scrollWidth, trilha.clientWidth
      );
      atualizarIndice();
    }
    medir();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    observer?.observe(trilha);
    window.addEventListener("resize", medir);
    trilha.addEventListener("scroll", atualizarIndice, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", medir);
      trilha.removeEventListener("scroll", atualizarIndice);
    };
  }, []);

  function navegar(indice) {
    const destino = Math.max(0, Math.min(indice, posicoesRef.current.length - 1));
    trilhaRef.current.scrollTo({
      left: posicoesRef.current[destino],
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <section className="landing-depoimentos" aria-labelledby="depoimentos-title" aria-roledescription="carrossel">
      <div className="landing-depoimentos__cabecalho">
        <span className="landing-eyebrow">QUEM JÁ USOU</span>
        <h2 id="depoimentos-title">Feito para diferentes corredores.</h2>
        <p>Do primeiro treino a novos objetivos, cada plano começa pela realidade de quem vai correr.</p>
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
            navegar(navegacao.indice + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        {depoimentos.map(({ nome, perfil, texto }, indice) => (
          <article className="landing-depoimentos__card" key={nome} aria-label={`Depoimento ${indice + 1} de ${depoimentos.length}`}>
            <blockquote>{texto}</blockquote>
            <div><strong>{nome}</strong><span>{perfil}</span></div>
          </article>
        ))}
      </div>
      <div className="landing-depoimentos__controles">
        <button type="button" aria-label="Depoimentos anteriores" aria-controls="depoimentos-trilha" disabled={navegacao.indice === 0} onClick={() => navegar(navegacao.indice - 1)}>←</button>
        <div className="landing-depoimentos__indicadores">
          {Array.from({ length: navegacao.total }, (_, indice) => (
            <button
              type="button"
              key={indice}
              aria-label={`Mostrar depoimentos a partir de ${depoimentos[indice].nome}`}
              aria-controls="depoimentos-trilha"
              aria-current={navegacao.indice === indice ? "true" : undefined}
              onClick={() => navegar(indice)}
            ><span /></button>
          ))}
        </div>
        <button type="button" aria-label="Próximos depoimentos" aria-controls="depoimentos-trilha" disabled={navegacao.indice === navegacao.total - 1} onClick={() => navegar(navegacao.indice + 1)}>→</button>
      </div>
    </section>
  );
}
