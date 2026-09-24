import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { indiceCarrossel, indiceCircular, posicaoCentralCarrossel, posicoesCarrossel } from "../src/utils/carrossel.js";

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

test("ciclo retorna do último ao primeiro e do primeiro ao último sem mudar conteúdo visível", () => {
  assert.equal(indiceCircular(6, 6), 0);
  assert.equal(indiceCircular(-1, 6), 5);
  assert.equal(posicaoCentralCarrossel(12, 6), 6);
  assert.equal(posicaoCentralCarrossel(5, 6), 11);
  for (const visiveis of [1, 2, 3]) {
    const posicoes = posicoesCarrossel(Array.from({ length: 18 }, (_, i) => i * 320), 18 * 320 - 20, visiveis * 320 - 20);
    for (let fisico = 0; fisico < posicoes.length; fisico++) {
      const central = posicaoCentralCarrossel(fisico, 6);
      assert.ok(central < posicoes.length);
      for (let card = 0; card < visiveis; card++) {
        assert.equal(indiceCircular(fisico + card, 6), indiceCircular(central + card, 6));
      }
    }
  }
});

test("renderiza sete depoimentos informativos e controles acessíveis sem CTA nos cards", async () => {
  const { createServer } = await import("vite");
  const servidor = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  try {
    const { default: Depoimentos } = await servidor.ssrLoadModule("/src/components/Depoimentos.jsx");
    const html = renderToStaticMarkup(React.createElement(Depoimentos));
    assert.match(html, /RELATOS DE QUEM JÁ USOU/);
    assert.match(html, /Feito para diferentes corredores\./);
    assert.match(html, /Conheça quem escolheu o Endurax para dar os próximos passos na corrida\./);
    const todos = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)];
    const cards = todos.filter((card) => !card[0].includes('aria-hidden="true"'));
    assert.equal(todos.length, 21);
    assert.equal(cards.length, 7);
    for (const [indice, nome] of ["Lucia", "Fernanda", "Matheus", "João", "Carla", "André", "Camilla"].entries()) {
      assert.ok(cards[indice][1].includes(`<strong>${nome}</strong>`));
      assert.match(cards[indice][1], /<blockquote>.+<\/blockquote>/);
      assert.doesNotMatch(cards[indice][1], /<a\b|<button\b|<img\b/);
    }
    assert.match(html, /aria-label="Depoimentos anteriores"/);
    assert.match(html, /aria-label="Próximos depoimentos"/);
    assert.match(html, /aria-current="true"/);
    assert.doesNotMatch(html, /disabled/);
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
  assert.doesNotMatch(componente, /setInterval|autoplay/i);
  assert.match(componente, /addEventListener\("scrollend", reposicionar\)/);
  assert.match(componente, /clearTimeout\(timer\)/);
  assert.match(css, /scroll-snap-type:x mandatory/);
  assert.match(css, /overflow-x:auto/);
  assert.match(css, /@media \(max-width:700px\)[\s\S]*grid-auto-columns:100%/);
});
