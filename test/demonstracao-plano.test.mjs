import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("exibe uma unica demonstracao estatica somente junto ao formulario", async () => {
  const [pagina, demonstracao] = await Promise.all([
    readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/plano/DemonstracaoPlano.jsx", import.meta.url), "utf8")
  ]);
  const etapaFormulario = pagina.match(
    /\{!pagamento && !plano && !solicitacaoSemPagamento && \(([\s\S]*?)\n      \)\}/
  )?.[1] || "";

  assert.match(etapaFormulario, /<FormularioPlanoSemanal/);
  assert.match(etapaFormulario, /<DemonstracaoPlano \/>/);
  assert.ok(
    etapaFormulario.indexOf("<FormularioPlanoSemanal") <
      etapaFormulario.indexOf("<DemonstracaoPlano />")
  );
  assert.equal((pagina.match(/<DemonstracaoPlano \/>/g) || []).length, 1);
  assert.match(demonstracao, /Veja como seu plano será apresentado/);
  assert.match(demonstracao, /<h3>Intervalado<\/h3>/);
  assert.doesNotMatch(demonstracao, /Corrida leve/);
  assert.match(demonstracao, /Aquecimento/);
  assert.match(demonstracao, /Parte principal/);
  assert.match(demonstracao, /Desaquecimento/);
  assert.match(demonstracao, /Ritmos, distâncias, duração e progressão serão personalizados no seu plano\./);
  assert.match(demonstracao, /Seu plano será gerado de acordo com suas respostas após a confirmação do pagamento\./);
  assert.doesNotMatch(demonstracao, /Se houver algum problema|atendimento para suporte|<small>/);
  assert.doesNotMatch(demonstracao, /\b\d+(?:[.,:]\d+)*\b/);
  assert.doesNotMatch(demonstracao, /\b(form|objetivo|experienciaCorrida|volumeSemanalAtual)\b/);
});
