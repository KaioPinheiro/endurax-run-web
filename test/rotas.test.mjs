import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("rota inexistente exibe página 404 com retorno ao início", async () => {
  const [app, pagina404] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/NotFound.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /<Route\s+path="\*"\s+element=\{<NotFound \/>\}/);
  assert.match(pagina404, /Página não encontrada\./);
  assert.match(pagina404, /<Link to="\/">Voltar para o início<\/Link>/);
});
