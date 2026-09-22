import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("preço da landing compartilha referência riscada e valor atual dinâmico sem fallback", async () => {
  const { createServer } = await import("vite");
  const servidor = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  try {
    const { default: PrecoPlanoLanding } = await servidor.ssrLoadModule("/src/components/PrecoPlanoLanding.jsx");
    for (const preco of ["R$ 9,90", "R$ 14,90"]) {
      const html = renderToStaticMarkup(React.createElement(PrecoPlanoLanding, { preco }));
      assert.match(html, /<s[^>]*>R\$ 99,90<\/s>/);
      assert.ok(html.includes(`<strong class="landing-preco__linha">${preco} por plano · pagamento único · sem assinatura</strong>`));
      assert.match(html, /pagamento único · sem assinatura/);
      assert.doesNotMatch(html, /<button|<a\b|OFF|%/);
    }
    assert.equal(renderToStaticMarkup(React.createElement(PrecoPlanoLanding, { preco: null })), "");
  } finally {
    await servidor.close();
  }
});
