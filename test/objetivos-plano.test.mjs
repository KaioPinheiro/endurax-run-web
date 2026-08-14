import assert from "node:assert/strict";
import test from "node:test";
import { FORM_INICIAL_PLANO, OBJETIVOS_PLANO } from "../src/constants/planoTreino.js";
import {
  montarPayloadMeuPlano,
  normalizarCampoPlano,
  validarFormularioPlano
} from "../src/utils/planoTreino.js";

const objetivos = [
  "Começar a correr", "Melhorar condicionamento", "Emagrecer",
  "Primeiros 5 km", "Primeiros 10 km", "Primeira Meia Maratona", "Primeira Maratona",
  "Melhorar tempo nos 5 km", "Melhorar tempo nos 10 km",
  "Melhorar tempo na Meia Maratona", "Melhorar tempo na Maratona"
];

function formularioPerformance() {
  return {
    ...FORM_INICIAL_PLANO, idade: "30", objetivo: "Melhorar tempo nos 5 km",
    tempoAtual: "31:20", tempoDesejado: "29:30", experienciaCorrida: "1 a 3 anos",
    ritmoConfortavel: "6:00-6:30 min/km", diasDisponiveis: ["segunda-feira"],
    possuiProva: "nao", corre5KmSemCaminhar: "nao", observacoes: ""
  };
}

test("expõe exatamente os novos objetivos", () => {
  assert.deepEqual(OBJETIVOS_PLANO, objetivos);
  assert.ok(!OBJETIVOS_PLANO.includes("Outro"));
  assert.ok(!OBJETIVOS_PLANO.includes("Sub 30 nos 5 km"));
});

test("performance exige tempos válidos e melhora", () => {
  assert.match(validarFormularioPlano({ ...formularioPerformance(), tempoAtual: "" }), /tempos válidos/);
  assert.match(validarFormularioPlano({ ...formularioPerformance(), tempoDesejado: "31:20" }), /deve ser melhor/);
  assert.equal(validarFormularioPlano(formularioPerformance()), null);
});

test("troca para objetivo geral limpa tempos e payload não os envia", () => {
  const form = normalizarCampoPlano(formularioPerformance(), {
    name: "objetivo", value: "Emagrecer", type: "select-one"
  });
  assert.equal(form.tempoAtual, "");
  assert.equal(form.tempoDesejado, "");
  const payload = montarPayloadMeuPlano(form);
  assert.equal(payload.tempoAtual, null);
  assert.equal(payload.tempoDesejado, null);
});

test("payload envia tempos estruturados para performance", () => {
  const payload = montarPayloadMeuPlano(formularioPerformance());
  assert.equal(payload.tempoAtual, "31:20");
  assert.equal(payload.tempoDesejado, "29:30");
});
