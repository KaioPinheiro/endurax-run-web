import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("seção Garmin mostra o conteúdo e o fluxo sem ações extras", async () => {
  const { createServer } = await import("vite");
  const servidor = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  try {
    const { default: IntegracaoGarmin } = await servidor.ssrLoadModule("/src/components/IntegracaoGarmin.jsx");
    const html = renderToStaticMarkup(React.createElement(IntegracaoGarmin));
    assert.match(html, /SEU TREINO NO RELÓGIO/);
    assert.match(html, /Do seu plano direto para o seu Garmin\./);
    assert.match(html, /Envie seus treinos pelo Intervals\.icu e acompanhe etapas e metas de ritmo no relógio durante a corrida\./);
    assert.match(html, /Integração via Intervals\.icu\. Requer contas conectadas e dispositivo compatível\./);
    assert.deepEqual([...html.matchAll(/<strong>(.*?)<\/strong>/g)].map((match) => match[1]), ["Endurax", "Intervals.icu", "Garmin"]);
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
