import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  enviarSugestaoFormspree,
  FORMSPREE_SUGESTAO_URL,
  LIMITE_SUGESTAO
} from "../src/utils/sugestao.js";

test("envia a sugestão por POST JSON ao Formspree", async () => {
  let chamada;
  await enviarSugestaoFormspree("  Minha sugestão  ", async (...args) => {
    chamada = args;
    return { ok: true };
  });

  assert.equal(chamada[0], FORMSPREE_SUGESTAO_URL);
  assert.equal(chamada[1].method, "POST");
  assert.equal(chamada[1].headers.Accept, "application/json");
  assert.equal(chamada[1].headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(chamada[1].body), { suggestion: "Minha sugestão" });
});

test("não envia conteúdo vazio ou acima do limite", async () => {
  let chamadas = 0;
  const fetchImpl = async () => {
    chamadas += 1;
    return { ok: true };
  };

  await assert.rejects(enviarSugestaoFormspree("   ", fetchImpl));
  await assert.rejects(enviarSugestaoFormspree("x".repeat(LIMITE_SUGESTAO + 1), fetchImpl));
  assert.equal(chamadas, 0);
});

test("propaga falha do Formspree para o formulário tratar", async () => {
  await assert.rejects(
    enviarSugestaoFormspree("Mensagem preservada", async () => ({ ok: false }))
  );
});

test("landing exibe limite, estados e feedbacks da caixa de sugestões", async () => {
  const landing = await readFile(new URL("../src/pages/LandingPage.jsx", import.meta.url), "utf8");

  assert.match(landing, /<textarea[\s\S]*maxLength=\{LIMITE_SUGESTAO\}[\s\S]*required/);
  assert.match(landing, /sugestao\.length\}\/\{LIMITE_SUGESTAO/);
  assert.match(landing, /enviandoSugestao \? "Enviando\.\.\." : "Enviar"/);
  assert.match(landing, /await enviarSugestaoFormspree\(sugestao\)/);
  assert.match(landing, /setSugestao\(""\)/);
  assert.match(landing, /Sugestão enviada\. Obrigado!/);
  assert.match(landing, /Não foi possível enviar\. Tente novamente\./);
  assert.doesNotMatch(landing, /catch \{[\s\S]*setSugestao\(""\)/);
  assert.ok(landing.indexOf('id="como-funciona"') < landing.indexOf('className="landing-sugestao"'));
  assert.ok(landing.indexOf('className="landing-sugestao"') < landing.indexOf('id="para-quem"'));
});
