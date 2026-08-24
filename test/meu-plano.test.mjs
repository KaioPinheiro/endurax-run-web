import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { criarRecuperacaoCompra, estadoDoResultado } from "../src/utils/fluxoMeuPlano.js";

test("recupera pagamento pendente depois do reload", () => {
  const recuperacao = criarRecuperacaoCompra({ pagamentoId: "10", payload: {} });
  assert.deepEqual(recuperacao.pagamento, { pagamentoId: "10" });
  assert.equal(recuperacao.estadoPagamento, "PENDING");
});

test("recupera solicitação quando a criação do Pix não retornou", () => {
  const recuperacao = criarRecuperacaoCompra({ solicitacaoPlanoId: "7", payload: { objetivo: "5 km" } });
  assert.equal(recuperacao.solicitacaoSemPagamento, true);
});

test("recupera plano concluído depois do reload", () => {
  const recuperacao = criarRecuperacaoCompra({ pagamentoId: "10", planoId: "20", payload: {} });
  assert.equal(recuperacao.estadoPagamento, "COMPLETED");
});

test("mapeia os estados de pagamento e geração suportados", () => {
  assert.equal(estadoDoResultado({ pagamentoStatus: "PENDING", geracaoStatus: "PENDING" }), "PENDING");
  assert.equal(estadoDoResultado({ pagamentoStatus: "APPROVED", geracaoStatus: "PROCESSING" }), "PROCESSING");
  assert.equal(estadoDoResultado({ pagamentoStatus: "APPROVED", geracaoStatus: "COMPLETED" }), "COMPLETED");
  assert.equal(estadoDoResultado({ pagamentoStatus: "APPROVED", geracaoStatus: "FAILED" }), "FAILED");
  assert.equal(estadoDoResultado({ pagamentoStatus: "EXPIRED", geracaoStatus: "PENDING" }), "EXPIRED");
});

test("mantém travas do submit, envia diaLongao e não usa preço literal", async () => {
  const [pagina, payload, pix] = await Promise.all([
    readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/utils/planoTreino.js", import.meta.url), "utf8"),
    readFile(new URL("../src/components/plano/PagamentoPix.jsx", import.meta.url), "utf8")
  ]);

  assert.match(pagina, /envioEmAndamento\.current \|\| carregando \|\| pagamento/);
  const limpeza = pagina.match(/function limparCompraPersistida\(\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.doesNotMatch(limpeza, /removeItem\(PLANO_ID_KEY\)/);
  assert.match(pagina, /ignorarRecuperacaoPlano\.current = true/);
  assert.match(pagina, /ignorarRecuperacaoPlano\.current/);
  assert.match(payload, /diaLongao: formulario\.diaLongao \|\| null/);
  assert.doesNotMatch(pix, /R\$ 12,90/);
  assert.match(pix, /pagamento\?\.valor/);
});
