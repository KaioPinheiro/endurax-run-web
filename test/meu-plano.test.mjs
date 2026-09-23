import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  criarRecuperacaoCompra,
  estadoDoResultado,
  iniciarNovaJornadaMeuPlano,
  ULTIMO_PLANO_TOKEN_KEY,
  ULTIMO_PLANO_LOCAL_KEY,
  lerUltimoPlanoLocal,
  salvarUltimoPlanoLocal,
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

test("nova jornada limpa o estado ativo e preserva a referencia do plano comprado", () => {
  const dados = new Map([
    ["pagamentoToken", "token-compra"],
    ["planoToken", "token-plano"],
    ["solicitacaoPlanoId", "7"],
    ["payloadMeuPlano", "{}"],
    ["formularioMeuPlano", "{}"]
  ]);
  const storage = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
    removeItem: (chave) => dados.delete(chave)
  };

  iniciarNovaJornadaMeuPlano(storage);

  assert.equal(dados.get(ULTIMO_PLANO_TOKEN_KEY), "token-plano");
  assert.equal(dados.has("pagamentoToken"), false);
  assert.equal(dados.has("planoToken"), false);
  assert.equal(dados.has("solicitacaoPlanoId"), false);
  assert.equal(dados.has("payloadMeuPlano"), false);
  assert.equal(dados.has("formularioMeuPlano"), false);
});

test("oferece recuperar somente o ultimo plano preservado pelo fluxo existente", async () => {
  const pagina = await readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8");
  const recuperacao = pagina.match(/async function verUltimoPlano\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";

  assert.match(
    pagina,
    /localStorage\.getItem\(ULTIMO_PLANO_TOKEN_KEY\) \|\| ultimoPlanoLocal\) && \([\s\S]*Ver último plano/
  );
  assert.match(recuperacao, /localStorage\.getItem\(ULTIMO_PLANO_TOKEN_KEY\)/);
  assert.match(recuperacao, /await concluirComPlano\(ultimoPlanoToken\)/);
  assert.doesNotMatch(recuperacao, /buscarPlanoGerado\(/);
  assert.match(pagina, /!pagamento && !plano && !solicitacaoSemPagamento/);
  assert.equal((pagina.match(/Ver último plano/g) || []).length, 1);
  assert.ok(pagina.indexOf("</header>") < pagina.indexOf("Ver último plano"));
  assert.ok(pagina.indexOf("Ver último plano") < pagina.indexOf("<FormularioPlanoSemanal"));
});

test("plano sem Pix permanece recuperável após nova jornada e leitura do armazenamento", () => {
  const dados = new Map();
  const storage = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
    removeItem: (chave) => dados.delete(chave)
  };
  const plano = { titulo: "Plano local", semanas: [] };
  salvarUltimoPlanoLocal(storage, plano);
  iniciarNovaJornadaMeuPlano(storage);
  assert.deepEqual(lerUltimoPlanoLocal(storage), plano);
  assert.equal(dados.has(ULTIMO_PLANO_TOKEN_KEY), false);
  salvarUltimoPlanoLocal(storage, { titulo: "Novo plano local", semanas: [] });
  assert.equal(lerUltimoPlanoLocal(storage).titulo, "Novo plano local");
  dados.set(ULTIMO_PLANO_LOCAL_KEY, "json inválido");
  assert.equal(lerUltimoPlanoLocal(storage), null);
  assert.doesNotThrow(() => salvarUltimoPlanoLocal({ setItem() { throw new Error("Sem espaço"); } }, plano));
});

test("formulário real mostra Ver último plano com cache sem Pix e oculta sem referência", async () => {
  const { createServer } = await import("vite");
  const React = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const servidor = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  const anterior = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const dados = new Map([[ULTIMO_PLANO_LOCAL_KEY, JSON.stringify({ titulo: "Plano local", semanas: [] })]]);
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (chave) => dados.get(chave) ?? null,
    removeItem: (chave) => dados.delete(chave)
  } });
  try {
    const { default: MeuPlano } = await servidor.ssrLoadModule("/src/pages/MeuPlano.jsx");
    const html = renderToStaticMarkup(React.createElement(MeuPlano));
    assert.equal((html.match(/Ver último plano/g) || []).length, 1);
    assert.ok(html.indexOf("Ver último plano") < html.indexOf("Configure seu plano"));
    dados.clear();
    assert.doesNotMatch(renderToStaticMarkup(React.createElement(MeuPlano)), /Ver último plano/);
  } finally {
    if (anterior) Object.defineProperty(globalThis, "localStorage", anterior);
    else delete globalThis.localStorage;
    await servidor.close();
  }
});

test("recuperação local não gera novamente e mantém prioridade do token pago", async () => {
  const pagina = await readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8");
  const recuperacao = pagina.match(/async function verUltimoPlano\(\) \{([\s\S]*?)\n  \}/)[1];
  assert.match(recuperacao, /if \(ultimoPlanoToken\)[\s\S]*await concluirComPlano\(ultimoPlanoToken\)[\s\S]*else[\s\S]*setPlano\(ultimoPlanoLocal\)/);
  assert.doesNotMatch(recuperacao, /gerarPlanoComIA|criarPagamentoPix/);
  assert.match(pagina, /async function concluirPlanoDesenvolvimento[\s\S]*salvarUltimoPlanoLocal\(localStorage, resultado\)/);
});

test("cabeçalho de Meu Plano não exibe badge duplicado", async () => {
  const pagina = await readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(pagina, /<span>MEU PLANO<\/span>/);
  assert.match(pagina, /<header className="coach-ia-hero">\s*<h1>Meu Plano<\/h1>\s*<p>Receba um ciclo de corrida personalizado/);
});

test("e-mail explica finalidade e ausência de marketing sem mudar o input", async () => {
  const formulario = await readFile(new URL("../src/components/plano/FormularioPlanoSemanal.jsx", import.meta.url), "utf8");
  const campo = formulario.match(/<label[^>]*data-analytics-field="email">([\s\S]*?)<\/label>/)[1];
  assert.match(campo, /type="email"[\s\S]*name="email"[\s\S]*onChange=\{onAlterar\}[\s\S]*required/);
  assert.match(campo, /Seu e-mail será usado apenas para identificar seu pagamento e vincular seu plano\.[\s\S]*Sem spam ou mensagens promocionais\./);
  assert.doesNotMatch(campo, /Necessário para processar|Mercado Pago|API/);
  assert.ok(formulario.indexOf('name="observacoes"') < formulario.indexOf('name="email"'));
  assert.ok(formulario.indexOf('name="email"') < formulario.indexOf('type="submit"'));
  assert.equal((formulario.match(/name="email"/g) || []).length, 1);
});

test("card do formulário não repete o subtítulo principal", async () => {
  const formulario = await readFile(
    new URL("../src/components/plano/FormularioPlanoSemanal.jsx", import.meta.url),
    "utf8"
  );

  assert.match(formulario, /<h2>Configure seu plano<\/h2>/);
  assert.doesNotMatch(formulario, /Receba um ciclo de corrida personalizado para o objetivo que deseja alcançar/);
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

test("Pix calcula contagem regressiva pela expiração real e limita em zero", async () => {
  const pix = await readFile(
    new URL("../src/components/plano/PagamentoPix.jsx", import.meta.url),
    "utf8"
  );

  assert.match(pix, /instanteExpiracao - agora/);
  assert.match(pix, /Math\.max\(0,/);
  assert.match(pix, /setInterval\(\(\) => setAgora\(Date\.now\(\)\), 1000\)/);
  assert.match(pix, /Expira em \{formatarTempoRestante\(segundosAteExpirar\)\}/);
  assert.doesNotMatch(pix, /toLocaleTimeString|Expira às/);
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
  assert.match(reinicio, /iniciarNovaJornadaMeuPlano\(localStorage\)/);
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

test("exibe discretamente o código de atendimento quando fornecido pelo pagamento", async () => {
  const pix = await readFile(
    new URL("../src/components/plano/PagamentoPix.jsx", import.meta.url),
    "utf8"
  );

  assert.match(pix, /pagamento\?\.codigoAtendimento/);
  assert.match(pix, /Código de atendimento:/);
  assert.match(pix, /pagamento\.codigoAtendimento/);
  assert.match(pix, /Use este código como referência caso precise de suporte\./);
});

test("exibe suporte abaixo do Pix e repassa o código de atendimento existente", async () => {
  const [pagina, suporte] = await Promise.all([
    readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/SugestaoProblema.jsx", import.meta.url), "utf8")
  ]);

  assert.match(
    pagina,
    /<PagamentoPix[\s\S]*<SugestaoProblema codigoAtendimento=\{pagamento\.codigoAtendimento\}/
  );
  assert.match(suporte, /enviarSugestaoFormspree\(sugestao, codigoAtendimento\)/);
  assert.match(suporte, /SUA OPINIÃO IMPORTA/);
  assert.match(suporte, /Sugestão ou suporte\?/);
});

test("mantém somente o botão principal para copiar o código Pix", async () => {
  const pix = await readFile(
    new URL("../src/components/plano/PagamentoPix.jsx", import.meta.url),
    "utf8"
  );

  assert.equal((pix.match(/onClick=\{copiar\}/g) || []).length, 1);
  assert.match(pix, /"Copiar código Pix"/);
  assert.match(pix, /navigator\.clipboard\.writeText\(copiaCola\)/);
  assert.match(pix, /copiado \? "Copiado!" : "Copiar código Pix"/);
});
