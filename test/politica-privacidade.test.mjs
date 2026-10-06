import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("expõe a Política de Privacidade em uma rota pública", async () => {
  const [app, pagina] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/PoliticaPrivacidade.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /path="\/politica-de-privacidade"/);
  assert.match(pagina, /Política de Privacidade/);
  assert.match(pagina, /05 de outubro de 2026/);
  assert.match(pagina, /Não vendemos seus dados pessoais/);
  assert.match(pagina, /enduraxrun@hotmail\.com/);
  assert.match(pagina, /<Link className="politica-voltar" to="\/">/);
});
