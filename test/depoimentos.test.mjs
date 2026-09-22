import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { indiceCarrossel, posicoesCarrossel } from "../src/utils/carrossel.js";

test("carrossel possui somente posições alcançáveis com um, dois ou três cards visíveis", () => {
  assert.deepEqual(posicoesCarrossel([0, 320, 640, 960, 1280, 1600], 1900, 300), [0, 320, 640, 960, 1280, 1600]);
  assert.deepEqual(posicoesCarrossel([0, 320, 640, 960, 1280, 1600], 1900, 620), [0, 320, 640, 960, 1280]);
  assert.deepEqual(posicoesCarrossel([0, 320, 640, 960, 1280, 1600], 1900, 940), [0, 320, 640, 960]);
  assert.deepEqual(posicoesCarrossel([0, 320], 620, 620), [0]);
});

test("indicador acompanha swipe, retorno, limites e resize", () => {
  const mobile = [0, 320, 640, 960, 1280, 1600];
  for (let indice = 0; indice < mobile.length; indice++) {
    assert.equal(indiceCarrossel(mobile, mobile[indice]), indice);
  }
  assert.equal(indiceCarrossel(mobile, 610), 2);
  assert.equal(indiceCarrossel(mobile, 330), 1);
  assert.equal(indiceCarrossel(mobile, -20), 0);
  const desktop = posicoesCarrossel(mobile, 1900, 940);
  assert.equal(indiceCarrossel(desktop, 1600), 3);
  assert.equal(indiceCarrossel([0], 0), 0);
});

test("renderiza seis depoimentos informativos e controles acessíveis sem CTA nos cards", async () => {
  const { createServer } = await import("vite");
  const servidor = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  try {
    const { default: Depoimentos } = await servidor.ssrLoadModule("/src/components/Depoimentos.jsx");
    const html = renderToStaticMarkup(React.createElement(Depoimentos));
    assert.match(html, /QUEM JÁ USOU/);
    assert.match(html, /Feito para diferentes corredores\./);
    assert.match(html, /Do primeiro treino a novos objetivos, cada plano começa pela realidade de quem vai correr\./);
    const cards = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)];
    assert.equal(cards.length, 6);
    for (const [indice, nome] of ["Lucas", "Mariana", "Bruno", "Rafael", "Camila", "André"].entries()) {
      assert.ok(cards[indice][1].includes(`<strong>${nome}</strong>`));
      assert.match(cards[indice][1], /<blockquote>.+<\/blockquote>/);
      assert.doesNotMatch(cards[indice][1], /<a\b|<button\b|<img\b/);
    }
    assert.match(html, /aria-label="Depoimentos anteriores"/);
    assert.match(html, /aria-label="Próximos depoimentos"/);
    assert.match(html, /aria-current="true"/);
    assert.doesNotMatch(html, /CRIAR MEU PLANO/);
  } finally {
    await servidor.close();
  }
});

test("integra somente entre como funciona e conversão e usa scroll nativo responsivo", async () => {
  const [landing, componente, css] = await Promise.all([
    readFile(new URL("../src/pages/LandingPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Depoimentos.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Depoimentos.css", import.meta.url), "utf8"),
  ]);
  assert.equal((landing.match(/<Depoimentos \/>/g) || []).length, 1);
  assert.ok(landing.indexOf('id="como-funciona"') < landing.indexOf("<Depoimentos />"));
  assert.ok(landing.indexOf("<Depoimentos />") < landing.indexOf('className="landing-conversao"'));
  assert.match(componente, /addEventListener\("scroll", atualizarIndice/);
  assert.match(componente, /new ResizeObserver\(medir\)/);
  assert.match(componente, /observer\?\.disconnect\(\)/);
  assert.match(componente, /prefers-reduced-motion/);
  assert.doesNotMatch(componente, /setInterval|setTimeout|autoplay/i);
  assert.match(css, /scroll-snap-type:x mandatory/);
  assert.match(css, /overflow-x:auto/);
  assert.match(css, /@media \(max-width:700px\)[\s\S]*grid-auto-columns:100%/);
});
