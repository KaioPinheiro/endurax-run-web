import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  enviarSugestaoFormspree,
  FORMSPREE_SUGESTAO_URL,
  LIMITE_SUGESTAO
} from "../src/utils/sugestao.js";
import { formatarPrecoPlano } from "../src/utils/precoPlano.js";

test("envia a sugestão por POST JSON ao Formspree", async () => {
  let chamada;
  await enviarSugestaoFormspree("  Minha sugestão  ", async (...args) => {
    chamada = args;
    return { ok: true };
  });

  assert.equal(FORMSPREE_SUGESTAO_URL, "https://formspree.io/f/xkjnyjzj");
  assert.equal(chamada[0], FORMSPREE_SUGESTAO_URL);
  assert.equal(chamada[1].method, "POST");
  assert.equal(chamada[1].headers.Accept, "application/json");
  assert.equal(chamada[1].headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(chamada[1].body), { message: "Minha sugestão" });
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

test("associa automaticamente o código de atendimento ao envio", async () => {
  let chamada;
  await enviarSugestaoFormspree("Problema no pagamento", "END-ABC123", async (...args) => {
    chamada = args;
    return { ok: true };
  });

  assert.equal(chamada[0], FORMSPREE_SUGESTAO_URL);
  assert.deepEqual(JSON.parse(chamada[1].body), {
    message: "Problema no pagamento",
    codigoAtendimento: "END-ABC123"
  });
});

test("componente preserva limite, estados e feedbacks da caixa de sugestões", async () => {
  const landing = await readFile(new URL("../src/components/SugestaoProblema.jsx", import.meta.url), "utf8");

  assert.match(landing, /<textarea[\s\S]*maxLength=\{LIMITE_SUGESTAO\}[\s\S]*required/);
  assert.match(landing, /sugestao\.length\}\/\{LIMITE_SUGESTAO/);
  assert.match(landing, /enviandoSugestao \? "Enviando\.\.\." : "Enviar"/);
  assert.match(landing, /await enviarSugestaoFormspree\(sugestao, codigoAtendimento\)/);
  assert.match(landing, /setSugestao\(""\)/);
  assert.match(landing, /Mensagem enviada\. Obrigado!/);
  assert.match(landing, /Não foi possível enviar\. Tente novamente\./);
  assert.doesNotMatch(landing, /catch \{[\s\S]*setSugestao\(""\)/);
});

test("componente preserva o formulário como canal de sugestão ou problema", async () => {
  const landing = await readFile(new URL("../src/components/SugestaoProblema.jsx", import.meta.url), "utf8");

  assert.match(landing, /Sugestão ou suporte\?/);
  assert.match(landing, /Estamos aqui para ouvir você e ajudar no que for preciso\./);
  assert.match(landing, /<label htmlFor="sugestao">Mensagem<\/label>/);
  assert.match(landing, /name="message"/);
  assert.match(landing, /placeholder="Descreva como podemos ajudar\."/);
  assert.match(landing, /maxLength=\{LIMITE_SUGESTAO\}/);
});

test("landing termina com conversão e rodapé sem formulário de suporte", async () => {
  const landing = await readFile(new URL("../src/pages/LandingPage.jsx", import.meta.url), "utf8");

  assert.match(landing, /className="landing-hero"/);
  assert.match(landing, /id="como-funciona"/);
  assert.doesNotMatch(landing, /Sugestão ou problema|SUA OPINIÃO IMPORTA|<form|<textarea|enviarSugestao/);
  assert.match(landing, /PRONTO PARA COMEÇAR\?[\s\S]*Seu próximo plano começa aqui\.[\s\S]*Dê o próximo passo na sua corrida\. O Endurax mostra o caminho\./);
  assert.match(landing, /<PrecoPlanoLanding preco=\{precoPlano\} \/>/);
  assert.match(landing, /<Cta>CRIAR MEU PLANO<\/Cta>\s*<\/section>\s*<\/main>\s*<footer/);
  assert.equal((landing.match(/<section\b/g) || []).length, 3);
  assert.doesNotMatch(landing, /Para quem é|PARA QUEM É|Treinar ficou muito mais simples/);
  assert.doesNotMatch(landing, /Veja o que|DIREÇÃO MUDA TUDO|COMECE AGORA/);
  assert.doesNotMatch(landing, /href="#como-funciona"|href="#para-quem"|href="#previa"/);
  assert.match(landing, /className="landing-logo"[\s\S]*alt="Endurax Run"/);
  assert.match(landing, /className="landing-footer"[\s\S]*Direção para cada quilômetro\.[\s\S]*© \{new Date\(\)\.getFullYear\(\)\} Endurax Run/);
  assert.match(landing, /<Cta>CRIAR MEU PLANO<\/Cta>/);
});

test("landing exibe o valor público do plano formatado junto ao CTA", async () => {
  const landing = await readFile(new URL("../src/pages/LandingPage.jsx", import.meta.url), "utf8");

  assert.equal(formatarPrecoPlano(9.90), "R$ 9,90");
  assert.equal(formatarPrecoPlano(14.90), "R$ 14,90");
  assert.equal(formatarPrecoPlano(undefined), null);
  assert.match(landing, /buscarConfigPublica\(\)/);
  assert.match(landing, /formatarPrecoPlano\(config\?\.valorPlano\)/);
  assert.equal((landing.match(/<PrecoPlanoLanding preco=\{precoPlano\}/g) || []).length, 2);
  assert.doesNotMatch(landing, /R\$ 9,90|9\.90/);
  assert.match(landing, /<Cta>CRIAR MEU PLANO<\/Cta>/);
});

test("como funciona termina após os três passos sem CTA redundante", async () => {
  const landing = await readFile(new URL("../src/pages/LandingPage.jsx", import.meta.url), "utf8");
  const secao = landing.slice(landing.indexOf('id="como-funciona"'), landing.indexOf('className="landing-conversao"'));
  assert.ok(secao.includes('["01", "Conte onde você está", "Responda algumas perguntas rápidas sobre sua corrida."]'));
  assert.ok(secao.includes('["02", "Escolha seus dias", "Defina quais dias você pode treinar."]'));
  assert.ok(secao.includes('["03", "Receba seu plano", "Tenha seus treinos organizados para as próximas semanas."]'));
  assert.match(secao, /Seu plano pronto<br \/>em três passos\./);
  assert.doesNotMatch(secao, /O PRÓXIMO PASSO É SEU|Pronto para começar\?|<Cta|landing-cta-faixa/);
  const css = await readFile(new URL("../src/pages/LandingPage.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /landing-cta-faixa/);
  assert.doesNotMatch(landing, /passo-card__frase|passo-card__quebra/);
  assert.doesNotMatch(css, /passo-card__frase|passo-card__quebra|\.passo-card:nth-child\(2\) p/);
});

test("hero apresenta personalização e exemplo preservando CTA e card", async () => {
  const landing = await readFile(new URL("../src/pages/LandingPage.jsx", import.meta.url), "utf8");
  assert.match(landing, /PLANO DE CORRIDA PERSONALIZADO/);
  assert.match(landing, /Seu plano de corrida\.<br \/><em>Feito para você\.<\/em>/);
  assert.match(landing, /Você dá o primeiro passo\. O Endurax mostra os próximos\./);
  assert.match(landing, /Treinos que cabem na sua rotina\./);
  assert.match(landing, /to="\/meu-plano">CRIAR MEU PLANO <IconeSeta \/>/);
  assert.match(landing, /VEJA NA PRÁTICA[\s\S]*Um plano que se adapta a você\.[\s\S]*className="landing-hero__tags"[\s\S]*<PreviaSemana \/>/);
  const tags = landing.match(/<p className="landing-hero__tags">([\s\S]*?)<\/p>/)[1];
  assert.deepEqual([...tags.matchAll(/<span>(.*?)<\/span>/g)].map((match) => match[1]), ["SEU NÍVEL", "SEU OBJETIVO", "SUA ROTINA"]);
  assert.doesNotMatch(tags, /<button|<a\b|onClick|tabIndex/);
  assert.doesNotMatch(landing, /Seu nível, objetivo e rotina definem como serão seus treinos/);
  assert.match(landing, /<span className="treino-mini__seta" aria-hidden="true" \/>/);
  assert.doesNotMatch(landing, /className="treino-mini__seta"[^>]*>→/);
  assert.equal(landing.match(/<PreviaSemana \/>/g).length, 1);
  assert.match(landing, /<div className="plano-preview__progresso" \/>/);
  assert.match(landing, /Somente nos dias que você escolher/);
});
