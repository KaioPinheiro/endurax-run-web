import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("guia apresenta as três etapas e pode ser reaberto após a dispensa salva", async () => {
  const { createServer } = await import("vite");
  const servidor = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  const janelaOriginal = globalThis.window;
  try {
    const { default: GuiaIntervalsIcu } = await servidor.ssrLoadModule("/src/components/plano/GuiaIntervalsIcu.jsx");
    const armazenamento = new Map();
    globalThis.window = { localStorage: { getItem: (chave) => armazenamento.get(chave) ?? null } };

    const html = renderToStaticMarkup(React.createElement(GuiaIntervalsIcu));
    assert.deepEqual([...html.matchAll(/<h4>(.*?)<\/h4>/g)].map((match) => match[1]), [
      "Configure o Intervals.icu",
      "Conecte seu relógio e configure os ritmos",
      "Envie seus treinos pelo Endurax"
    ]);
    assert.match(html, /Configurações → Conexões/);
    assert.match(html, /pace de limiar/);
    assert.match(html, /Enviar ao Intervals\.icu/);
    assert.match(html, /<button type="button">Entendi<\/button>/);

    armazenamento.set("endurax_guia_intervals_icu_dispensado", "true");
    const recolhido = renderToStaticMarkup(React.createElement(GuiaIntervalsIcu));
    assert.match(recolhido, /Como integrar meu relógio\?/);
    assert.doesNotMatch(recolhido, /Configure o Intervals\.icu|Entendi/);

    armazenamento.set("endurax_guia_intervals_icu_dispensado", "false");
    assert.match(renderToStaticMarkup(React.createElement(GuiaIntervalsIcu)), /Configure o Intervals\.icu/);
  } finally {
    if (janelaOriginal === undefined) delete globalThis.window;
    else globalThis.window = janelaOriginal;
    await servidor.close();
  }
});

test("guia aparece somente no plano persistido, antes da conexão", async () => {
  const [resultado, guia] = await Promise.all([
    readFile(new URL("../src/components/plano/ResultadoMeuPlano.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/plano/GuiaIntervalsIcu.jsx", import.meta.url), "utf8")
  ]);
  assert.ok(resultado.indexOf("{planoToken && <GuiaIntervalsIcu />}") < resultado.indexOf('className="intervals-conexao"'));
  assert.match(guia, /localStorage\.setItem\(CHAVE_GUIA_DISPENSADO, "true"\)/);
  assert.match(guia, /localStorage\.setItem\(CHAVE_GUIA_DISPENSADO, "false"\)/);
});
