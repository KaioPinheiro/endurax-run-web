import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  criarRecuperacaoCompra,
  estadoDoResultado,
  limparFluxoComercialMeuPlano
} from "../src/utils/fluxoMeuPlano.js";

test("recupera pagamento pendente depois do reload", () => {
  const recuperacao = criarRecuperacaoCompra({ pagamentoToken: "token-pagamento", payload: {} });
  assert.deepEqual(recuperacao.pagamento, { acessoToken: "token-pagamento" });
  assert.equal(recuperacao.estadoPagamento, "PENDING");
});

test("recupera solicitação quando a criação do Pix não retornou", () => {
  const recuperacao = criarRecuperacaoCompra({ solicitacaoPlanoId: "7", payload: { objetivo: "5 km" } });
  assert.equal(recuperacao.solicitacaoSemPagamento, true);
});

test("recupera plano concluído depois do reload", () => {
  const recuperacao = criarRecuperacaoCompra({
    pagamentoToken: "token-compra",
    planoToken: "token-compra",
    payload: {}
  });
  assert.equal(recuperacao.estadoPagamento, "COMPLETED");
});

test("reinicia somente o estado comercial e preserva outras chaves", () => {
  const dados = new Map([
    ["pagamentoToken", "pagamento-antigo"],
    ["planoToken", "plano-antigo"],
    ["solicitacaoPlanoId", "7"],
    ["payloadMeuPlano", "{}"],
    ["formularioMeuPlano", "{}"],
    ["preferenciaVisual", "compacta"],
    ["email", "cliente@example.com"]
  ]);
  const storage = { removeItem: (chave) => dados.delete(chave) };

  limparFluxoComercialMeuPlano(storage);

  assert.equal(dados.has("pagamentoToken"), false);
  assert.equal(dados.has("planoToken"), false);
  assert.equal(dados.has("solicitacaoPlanoId"), false);
  assert.equal(dados.has("payloadMeuPlano"), false);
  assert.equal(dados.has("formularioMeuPlano"), false);
  assert.equal(dados.get("preferenciaVisual"), "compacta");
  assert.equal(dados.get("email"), "cliente@example.com");
});

test("editar usa cancelamento real e o cancelamento manual não é exibido", async () => {
  const [pagina, pix, api] = await Promise.all([
    readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/plano/PagamentoPix.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/services/api.js", import.meta.url), "utf8")
  ]);
  const edicao = pagina.match(/async function editarDados\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";

  assert.match(api, /post\(`\/api\/pagamentos\/public\/\$\{acessoToken\}\/cancelar`\)/);
  assert.match(edicao, /await cancelarPagamentoPix\(pagamento\.acessoToken\)/);
  assert.ok(
    edicao.indexOf("await cancelarPagamentoPix") <
      edicao.indexOf("limparFluxoComercialMeuPlano")
  );
  assert.match(edicao, /lerFormularioPersistido\(\) \|\| form/);
  assert.match(edicao, /error\?\.response\?\.status === 409/);
  assert.match(edicao, /await consultarPagamento\(pagamento\.acessoToken\)/);
  assert.doesNotMatch(pagina, /pagamentoOculto|Pagamento ocultado|Retomar pagamento/);
  assert.match(pix, />\s*Editar dados\s*</);
  assert.doesNotMatch(pix, />\s*Cancelar pagamento\s*</);
  assert.doesNotMatch(pix, /onCancelarPagamento/);
  assert.match(pix, /Este Pix será cancelado e não poderá mais ser pago/);
});

test("Pix exibe o horário local de expiração sem contador regressivo", async () => {
  const pix = await readFile(
    new URL("../src/components/plano/PagamentoPix.jsx", import.meta.url),
    "utf8"
  );

  assert.match(pix, /toLocaleTimeString\("pt-BR",/);
  assert.match(pix, /hour: "2-digit"/);
  assert.match(pix, /minute: "2-digit"/);
  assert.match(pix, /Expira às \{horarioExpiracao\}/);
  assert.doesNotMatch(pix, /setInterval|segundosRestantes|Expira em/);
});

test("submit preserva formulário cru e cancelamento remove solicitação antiga", async () => {
  const pagina = await readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8");
  const envio = pagina.match(/async function enviar\(event\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  const edicao = pagina.match(/async function editarDados\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";

  assert.match(envio, /setItem\(FORMULARIO_PLANO_KEY, JSON\.stringify\(form\)\)/);
  assert.match(edicao, /limparFluxoComercialMeuPlano\(localStorage\)/);
  assert.match(edicao, /setSolicitacaoSemPagamento\(false\)/);
  assert.match(pagina, /let solicitacaoPlanoId = localStorage\.getItem\(SOLICITACAO_ID_KEY\)/);
});

test("editar preserva formulário e ignora polling antigo após cancelar o Pix", async () => {
  const pagina = await readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8");
  const consulta = pagina.match(
    /const consultarPagamento = useCallback\(async \(acessoToken\) => \{([\s\S]*?)\n  \}, \[concluirComPlano\]\)/
  )?.[1] || "";
  const edicao = pagina.match(/async function editarDados\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";

  assert.ok(
    edicao.indexOf("lerFormularioPersistido() || form") <
      edicao.indexOf("await cancelarPagamentoPix")
  );
  assert.ok(
    edicao.indexOf("limparFluxoComercialMeuPlano(localStorage)") <
      edicao.indexOf("setForm(formularioPreservado)")
  );
  assert.match(edicao, /setPagamento\(null\)/);
  assert.match(edicao, /setEstadoPagamento\(null\)/);
  assert.match(edicao, /setMensagemPagamento\(""\)/);
  assert.match(edicao, /setErro\(""\)/);
  assert.match(
    consulta,
    /buscarResultadoPagamento\(acessoToken\)[\s\S]*localStorage\.getItem\(PAGAMENTO_TOKEN_KEY\) !== acessoToken[\s\S]*setPagamento/
  );
  assert.match(
    consulta,
    /catch \(error\)[\s\S]*localStorage\.getItem\(PAGAMENTO_TOKEN_KEY\) !== acessoToken[\s\S]*setErro/
  );
});

test("sem tokens antigos a recuperacao libera um novo formulario", () => {
  const recuperacao = criarRecuperacaoCompra({
    pagamentoToken: null,
    planoToken: null,
    solicitacaoPlanoId: null,
    payload: null
  });

  assert.equal(recuperacao.pagamento, null);
  assert.equal(recuperacao.estadoPagamento, null);
  assert.equal(recuperacao.solicitacaoSemPagamento, false);
});

test("recuperação local descarta payload incompatível antes de reutilizá-lo", async () => {
  const pagina = await readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8");
  const leitura = pagina.match(/function lerPayloadPersistido\(\) \{([\s\S]*?)\n\}/)?.[1] || "";

  assert.match(leitura, /normalizarFormularioPlanoRestaurado/);
  assert.match(leitura, /!normalizado\?\.objetivo/);
  assert.match(leitura, /removeItem\(PAYLOAD_PLANO_KEY\)/);
  assert.match(leitura, /removeItem\(SOLICITACAO_ID_KEY\)/);
  assert.match(leitura, /return null/);
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
  const reinicio = pagina.match(/function iniciarNovoPlano\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  assert.match(reinicio, /limparFluxoComercialMeuPlano\(localStorage\)/);
  assert.match(reinicio, /setForm\(criarEstadoInicialPlano\(\)\)/);
  assert.match(reinicio, /setPagamento\(null\)/);
  assert.match(reinicio, /setEstadoPagamento\(null\)/);
  assert.doesNotMatch(reinicio, /criarPagamentoPix|criarSolicitacaoPlano|reconciliarPagamento/);
  assert.match(pagina, /ignorarRecuperacaoPlano\.current = true/);
  assert.match(pagina, /ignorarRecuperacaoPlano\.current/);
  assert.match(payload, /diaLongao: diaLongaoEhAplicavel\(formulario\.experienciaCorrida\)/);
  assert.doesNotMatch(pix, /R\$ 12,90/);
  assert.match(pix, /pagamento\?\.valor/);
});
