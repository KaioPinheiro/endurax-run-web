import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("seção de relógios mostra o conteúdo e o fluxo sem promessas ou ações extras", async () => {
  const { createServer } = await import("vite");
  const servidor = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  try {
    const { default: IntegracaoGarmin } = await servidor.ssrLoadModule("/src/components/IntegracaoGarmin.jsx");
    const html = renderToStaticMarkup(React.createElement(IntegracaoGarmin));
    assert.match(html, /SEU TREINO NO RELÓGIO/);
    assert.match(html, /Do seu plano direto para o seu relógio\./);
    assert.match(html, /Envie seus treinos pelo Intervals\.icu e acompanhe cada etapa diretamente no seu relógio\./);
    assert.match(html, /A sincronização de treinos depende da integração e da compatibilidade do dispositivo\./);
    assert.deepEqual([...html.matchAll(/<strong>(.*?)<\/strong>/g)].map((match) => match[1]), ["Endurax", "Intervals.icu", "Seu relógio"]);
    for (const marca of ["Garmin", "COROS", "Suunto", "Amazfit"]) assert.ok(html.includes(`<span>${marca}</span>`));
    assert.equal((html.match(/<li\b/g) || []).length, 3);
    assert.doesNotMatch(html, /<button\b|<a\b/);
  } finally {
    await servidor.close();
  }
});

test("seção Garmin fica após a prévia e antes dos depoimentos", async () => {
  const landing = await readFile(new URL("../src/pages/LandingPage.jsx", import.meta.url), "utf8");
  assert.ok(landing.indexOf("<PreviaSemana />") < landing.indexOf("<IntegracaoGarmin />"));
  assert.ok(landing.indexOf("<IntegracaoGarmin />") < landing.indexOf("<Depoimentos />"));
});
