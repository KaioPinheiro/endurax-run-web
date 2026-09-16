import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  analyticsHabilitado,
  observarCamposAlcancados,
  rastrearEventoUmami
} from "../src/utils/analytics.js";

test("analytics fica restrito a producao nos dominios oficiais", () => {
  assert.equal(analyticsHabilitado({ producao: true, hostname: "enduraxrun.com.br" }), true);
  assert.equal(analyticsHabilitado({ producao: true, hostname: "www.enduraxrun.com.br" }), true);
  assert.equal(analyticsHabilitado({ producao: false, hostname: "enduraxrun.com.br" }), false);
  assert.equal(analyticsHabilitado({ producao: true, hostname: "localhost" }), false);
  assert.equal(analyticsHabilitado({ producao: true, hostname: "preview.example.com" }), false);
});

test("ausencia ou falha do Umami nao interrompe o produto", () => {
  const windowAnterior = globalThis.window;
  globalThis.window = { location: { hostname: "enduraxrun.com.br" } };
  try {
    assert.equal(rastrearEventoUmami("evento", {
      producao: true, hostname: "enduraxrun.com.br"
    }), false);
    globalThis.window.umami = { track: () => { throw new Error("indisponivel"); } };
    assert.equal(rastrearEventoUmami("evento", {
      producao: true, hostname: "enduraxrun.com.br"
    }), false);
  } finally {
    globalThis.window = windowAnterior;
  }
});

test("campo exige visibilidade, permanencia e dispara uma unica vez sem valores", () => {
  const campo = { dataset: { analyticsField: "email" }, isConnected: true };
  const eventos = [];
  const tarefas = [];
  let instancia;
  class ObserverFake {
    constructor(callback, opcoes) {
      this.callback = callback;
      this.opcoes = opcoes;
      this.observados = [];
      instancia = this;
    }
    observe(elemento) { this.observados.push(elemento); }
    unobserve(elemento) { this.observados = this.observados.filter((item) => item !== elemento); }
    disconnect() { this.observados = []; }
  }
  const raiz = { querySelectorAll: () => [campo] };
  const registrados = new Set();
  const limpar = observarCamposAlcancados({
    raiz,
    registrados,
    rastrear: (evento) => eventos.push(evento),
    ObserverClass: ObserverFake,
    agendar: (callback, atraso) => { tarefas.push({ callback, atraso }); return tarefas.length; },
    cancelar: () => {}
  });

  assert.deepEqual(eventos, []);
  assert.equal(instancia.opcoes.threshold, 0.4);
  instancia.callback([{ target: campo, isIntersecting: true, intersectionRatio: 0.4 }]);
  assert.deepEqual(eventos, []);
  assert.equal(tarefas[0].atraso, 300);
  tarefas[0].callback();
  instancia.callback([{ target: campo, isIntersecting: true, intersectionRatio: 1 }]);

  assert.deepEqual(eventos, ["field_email_reached"]);
  assert.deepEqual([...registrados], ["email"]);
  assert.equal(JSON.stringify(eventos).includes("@"), false);
  limpar();
});

test("campo condicional passa a ser observado quando aparece", () => {
  const registrados = new Set(["email"]);
  const condicional = { dataset: { analyticsField: "tempo_desejado" }, isConnected: true };
  let observados = [];
  class ObserverFake {
    constructor() {}
    observe(elemento) { observados.push(elemento.dataset.analyticsField); }
    unobserve() {}
    disconnect() {}
  }

  observarCamposAlcancados({
    raiz: { querySelectorAll: () => [{ dataset: { analyticsField: "email" } }] },
    registrados,
    ObserverClass: ObserverFake
  });
  observarCamposAlcancados({
    raiz: { querySelectorAll: () => [condicional] },
    registrados,
    ObserverClass: ObserverFake
  });

  assert.deepEqual(observados, ["tempo_desejado"]);
});

test("todos os campos usam somente identificadores tecnicos fixos", async () => {
  const formulario = await readFile(
    new URL("../src/components/plano/FormularioPlanoSemanal.jsx", import.meta.url),
    "utf8"
  );
  const campos = [...formulario.matchAll(/data-analytics-field="([^"]+)"/g)]
    .map((resultado) => resultado[1]);

  assert.deepEqual(campos, [
    "email", "idade", "experiencia", "objetivo", "tempo_atual", "tempo_desejado",
    "ritmo_confortavel", "corre_5km", "tempo_5km", "maior_distancia",
    "volume_semanal", "dias_disponiveis", "dia_longao", "duracao_plano",
    "lesao_limitacao", "descricao_lesao", "observacoes"
  ]);
  assert.doesNotMatch(formulario, /rastrearEventoUmami\([^)]*,/);
});

test("form_submitted ocorre somente depois de criar uma solicitacao nova", async () => {
  const pagina = await readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8");
  const inicio = pagina.indexOf("if (!solicitacaoPlanoId)");
  const criacao = pagina.indexOf("await criarSolicitacaoPlano", inicio);
  const evento = pagina.indexOf('rastrearEventoUmami("form_submitted")', inicio);
  const fim = pagina.indexOf("const cobranca = await criarPagamentoPix", inicio);

  assert.ok(inicio >= 0 && criacao > inicio && evento > criacao && evento < fim);
});

test("pix_viewed exige Pix disponivel e possui deduplicacao por montagem", async () => {
  const componente = await readFile(
    new URL("../src/components/plano/PagamentoPix.jsx", import.meta.url),
    "utf8"
  );

  assert.match(componente, /estado === "PENDING"/);
  assert.match(componente, /qrCodeBase64 \|\| copiaCola \|\| \(sincronizado && ticketUrl\)/);
  assert.match(componente, /if \(!pixDisponivel \|\| pixVisualizado\.current\) return/);
  assert.match(componente, /pixVisualizado\.current = true;\s*rastrearEventoUmami\("pix_viewed"\)/);
});
