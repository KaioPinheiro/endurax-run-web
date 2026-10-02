import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

test("landing publica imagem Open Graph absoluta e acessível pelo build", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const imagem = await stat(
    new URL("../public/og-endurax-run.png", import.meta.url)
  );

  assert.match(
    html,
    /property="og:image" content="https:\/\/enduraxrun\.com\.br\/og-endurax-run\.png"/
  );
  assert.match(html, /property="og:image:secure_url" content="https:/);
  assert.match(html, /property="og:image:type" content="image\/png"/);
  assert.match(html, /property="og:image:width" content="1254"/);
  assert.match(html, /property="og:image:height" content="1254"/);
  assert.match(
    html,
    /name="twitter:image" content="https:\/\/enduraxrun\.com\.br\/og-endurax-run\.png"/
  );
  assert.ok(imagem.isFile());
  assert.ok(imagem.size > 0);
});
