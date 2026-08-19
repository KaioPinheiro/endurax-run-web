import assert from "node:assert/strict";
import test from "node:test";
import { FORM_INICIAL_PLANO, OBJETIVOS_PLANO } from "../src/constants/planoTreino.js";
import {
  montarPayloadMeuPlano,
  mascararTempoObjetivo,
  normalizarCampoPlano,
  normalizarMaiorDistancia,
  objetivoExibePergunta5Km,
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

test("aplica máscara MM:SS durante digitação, edição e backspace", () => {
  const objetivo = "Melhorar tempo nos 5 km";
  assert.equal(mascararTempoObjetivo("4230", objetivo), "42:30");
  assert.equal(mascararTempoObjetivo("2959", objetivo), "29:59");
  assert.equal(mascararTempoObjetivo("42:3", objetivo), "42:3");
  assert.equal(mascararTempoObjetivo("4a2b30", objetivo), "42:30");
});

test("aplica máscara H:MM:SS para Maratona", () => {
  const objetivo = "Melhorar tempo na Maratona";
  assert.equal(mascararTempoObjetivo("31530", objetivo), "3:15:30");
  assert.equal(mascararTempoObjetivo("25959", objetivo), "2:59:59");
  assert.equal(mascararTempoObjetivo("3:15:3", objetivo), "3:15:3");
  assert.equal(mascararTempoObjetivo("3153099", objetivo), "3:15:30");
});

test("pergunta sobre 5 km aparece somente nos quatro objetivos permitidos", () => {
  const permitidos = [
    "Começar a correr", "Melhorar condicionamento", "Emagrecer", "Primeiros 5 km"
  ];
  for (const objetivo of OBJETIVOS_PLANO) {
    assert.equal(objetivoExibePergunta5Km(objetivo), permitidos.includes(objetivo));
  }
});

test("troca de objetivo limpa resposta de 5 km e remove valor residual do payload", () => {
  const respondido = {
    ...formularioPerformance(),
    objetivo: "Primeiros 5 km",
    corre5KmSemCaminhar: "sim",
    tempo5Km: "28:00"
  };
  const form = normalizarCampoPlano(respondido, {
    name: "objetivo", value: "Primeiros 10 km", type: "select-one"
  });

  assert.equal(form.corre5KmSemCaminhar, "");
  assert.equal(form.tempo5Km, "");
  assert.equal(montarPayloadMeuPlano(form).corre5KmSemCaminhar, null);
  assert.equal(montarPayloadMeuPlano(form).tempo5Km, null);

  const aoVoltar = normalizarCampoPlano(form, {
    name: "objetivo", value: "Emagrecer", type: "select-one"
  });
  assert.equal(aoVoltar.corre5KmSemCaminhar, "");
});

test("maior distância aceita somente inteiro de até dois dígitos", () => {
  assert.equal(normalizarMaiorDistancia("42"), "42");
  assert.equal(normalizarMaiorDistancia("9.5 km"), "95");
  assert.equal(normalizarMaiorDistancia("-120"), "12");
  assert.equal(normalizarMaiorDistancia("abc"), "");
});

test("validação rejeita maior distância acima de 99", () => {
  const form = {
    ...formularioPerformance(),
    objetivo: "Primeira Meia Maratona",
    tempoAtual: "",
    tempoDesejado: "",
    maiorDistanciaCorrida: "100"
  };
  assert.match(validarFormularioPlano(form), /entre 0 e 99 km/);
});
