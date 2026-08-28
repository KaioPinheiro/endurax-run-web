import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  EXPERIENCIA_PARADO,
  EXPERIENCIA_SEM_CORRIDA,
  EXPERIENCIA_MENOS_6_MESES,
  DURACOES_PLANO,
  FORM_INICIAL_PLANO,
  OBJETIVOS_PLANO,
  OBJETIVOS_PLANO_MENOS_6_MESES
} from "../src/constants/planoTreino.js";
import {
  alternarDiaDisponivel,
  estimarDistanciaBloco,
  extrairDistanciaExplicitaBloco,
  extrairDuracaoExplicitaBloco,
  montarPayloadMeuPlano,
  mascararTempoObjetivo,
  normalizarCampoPlano,
  normalizarFormularioPlanoRestaurado,
  normalizarMaiorDistancia,
  objetivoExibePergunta5Km,
  objetivosDisponiveisPorExperiencia,
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
    diaLongao: "segunda-feira",
    possuiProva: "nao", corre5KmSemCaminhar: "nao", observacoes: ""
  };
}

test("limita objetivos para quem nunca correu ou está parado", () => {
  const objetivosIniciais = objetivos.slice(0, 4);

  assert.deepEqual(
    objetivosDisponiveisPorExperiencia(EXPERIENCIA_SEM_CORRIDA),
    objetivosIniciais
  );
  assert.deepEqual(
    objetivosDisponiveisPorExperiencia(EXPERIENCIA_PARADO),
    objetivosIniciais
  );
  assert.deepEqual(objetivosDisponiveisPorExperiencia("1 a 3 anos"), objetivos);
});

test("menos de 6 meses mantém somente objetivos de até 10 km", () => {
  const permitidos = [
    "Começar a correr",
    "Melhorar condicionamento",
    "Emagrecer",
    "Primeiros 5 km",
    "Primeiros 10 km",
    "Melhorar tempo nos 5 km",
    "Melhorar tempo nos 10 km"
  ];

  assert.deepEqual(OBJETIVOS_PLANO_MENOS_6_MESES, permitidos);
  assert.deepEqual(
    objetivosDisponiveisPorExperiencia(EXPERIENCIA_MENOS_6_MESES),
    permitidos
  );
  assert.equal(permitidos.some((objetivo) => objetivo.includes("Meia Maratona")), false);
  assert.equal(permitidos.some((objetivo) => objetivo.includes("Maratona")), false);
  assert.deepEqual(objetivosDisponiveisPorExperiencia("1 a 3 anos"), objetivos);
});

test("menos de 6 meses limpa objetivo avançado e campos dependentes", () => {
  const atualizado = normalizarCampoPlano({
    ...formularioPerformance(),
    objetivo: "Melhorar tempo na Meia Maratona",
    tempoAtual: "1:40:00",
    tempoDesejado: "1:35:00",
    maiorDistanciaCorrida: "18"
  }, {
    name: "experienciaCorrida",
    value: EXPERIENCIA_MENOS_6_MESES,
    type: "select-one"
  });

  assert.equal(atualizado.objetivo, "");
  assert.equal(atualizado.tempoAtual, "");
  assert.equal(atualizado.tempoDesejado, "");
  assert.equal(atualizado.maiorDistanciaCorrida, "");
});

test("estado restaurado incompatível é normalizado e não passa na validação", () => {
  const restaurado = normalizarFormularioPlanoRestaurado({
    ...formularioPerformance(),
    experienciaCorrida: EXPERIENCIA_MENOS_6_MESES,
    objetivo: "Primeira Maratona",
    maiorDistanciaCorrida: "20"
  });

  assert.equal(restaurado.objetivo, "");
  assert.equal(restaurado.maiorDistanciaCorrida, "");
  assert.notEqual(validarFormularioPlano(restaurado), null);
});

test("submissão bloqueia combinação manipulada antes de montar o payload", () => {
  const formulario = {
    ...formularioPerformance(),
    experienciaCorrida: EXPERIENCIA_MENOS_6_MESES,
    objetivo: "Primeira Meia Maratona"
  };
  assert.match(validarFormularioPlano(formulario), /objetivo compatível/);

  const pagina = readFileSync(
    new URL("../src/pages/MeuPlano.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(
    pagina.indexOf("validarFormularioMeuPlano(form)") <
      pagina.indexOf("montarPayloadMeuPlano(form)")
  );
});

test("limpa objetivo incompatível ao mudar para perfil sem corrida", () => {
  const atualizado = normalizarCampoPlano(formularioPerformance(), {
    name: "experienciaCorrida",
    value: EXPERIENCIA_SEM_CORRIDA,
    type: "select-one"
  });

  assert.equal(atualizado.objetivo, "");
  assert.equal(atualizado.tempoAtual, "");
  assert.equal(atualizado.tempoDesejado, "");
});

test("bloqueia envio com objetivo incompatível preservado no estado", () => {
  const formulario = {
    ...formularioPerformance(),
    experienciaCorrida: EXPERIENCIA_SEM_CORRIDA
  };

  assert.match(validarFormularioPlano(formulario), /objetivo compatível/);
});

test("formulário V1 não exibe prova e oferece 4, 5 e 6 semanas", () => {
  const componente = readFileSync(
    new URL("../src/components/plano/FormularioPlanoSemanal.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(componente, /Possui uma prova marcada/);
  assert.doesNotMatch(componente, /Data da prova/);
  assert.match(componente, /DURACOES_PLANO\.map/);
  assert.deepEqual(DURACOES_PLANO.map(({ valor }) => valor), ["4", "5", "6"]);
  assert.deepEqual(FORM_INICIAL_PLANO.possuiProva, "nao");
});

test("payload V1 neutraliza dados residuais de prova e preserva duração", () => {
  for (const duracao of ["4", "5", "6"]) {
    const payload = montarPayloadMeuPlano({
      ...formularioPerformance(),
      possuiProva: "sim",
      dataProva: "2030-10-20",
      distanciaProva: "42 km",
      objetivoProva: "Completar a prova",
      importanciaProva: "Prova principal da temporada",
      duracaoSemanas: duracao
    });

    assert.equal(payload.possuiProva, false);
    assert.equal(payload.dataProva, null);
    assert.equal(payload.distanciaProva, null);
    assert.equal(payload.objetivoProva, null);
    assert.equal(payload.importanciaProva, null);
    assert.equal(payload.duracaoSemanas, Number(duracao));
  }
});

test("landing não promete planejamento para prova marcada", () => {
  const landing = readFileSync(
    new URL("../src/pages/LandingPage.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(landing, /Plano para prova|Tenho uma prova marcada|data em mente/);
  assert.match(landing, /Plano para seu objetivo/);
  assert.match(landing, /Quero evoluir em uma distância/);
});

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

test("exige longão em um dos dias disponíveis", () => {
  const formulario = formularioPerformance();

  assert.match(
    validarFormularioPlano({ ...formulario, diaLongao: "" }),
    /dia do longão entre os dias disponíveis/
  );
  assert.match(
    validarFormularioPlano({ ...formulario, diaLongao: "sábado" }),
    /dia do longão entre os dias disponíveis/
  );
  assert.equal(validarFormularioPlano(formulario), null);
});

test("extrai a duração explícita dos blocos sem confundir pace", () => {
  assert.equal(extrairDuracaoExplicitaBloco("800 m em 3:30 min de esforço"), "3:30 min");
  assert.equal(extrairDuracaoExplicitaBloco("2 km de aquecimento em 12 min"), "12 min");
  assert.equal(extrairDuracaoExplicitaBloco("pace 4:25-4:35 min/km"), "");
});

test("prioriza somente distância explícita como métrica do bloco", () => {
  assert.equal(extrairDistanciaExplicitaBloco("1000 m em 4:00 a 4:10 min/km"), "1000 m");
  assert.equal(extrairDistanciaExplicitaBloco("800 m em 3:30 min"), "800 m");
  assert.equal(extrairDistanciaExplicitaBloco("12 min de trote leve"), "");
  assert.equal(extrairDistanciaExplicitaBloco("2 min de recuperação"), "");
});

test("estima distância somente com duração e pace válidos", () => {
  assert.equal(estimarDistanciaBloco("12 min", "5:00-5:20 min/km"), "~2,3 km");
  assert.equal(estimarDistanciaBloco("30 min", "5:30 min/km"), "~5,5 km");
  assert.equal(estimarDistanciaBloco("12 min", ""), "");
  assert.equal(estimarDistanciaBloco("12 min", "pace livre"), "");
  assert.equal(estimarDistanciaBloco("3:30 min", "5:00 min/km"), "");
  assert.equal(estimarDistanciaBloco("12 min", "3:30 min"), "");
});

test("limpa o longão quando o dia deixa de estar disponível", () => {
  const formulario = formularioPerformance();
  const atualizado = alternarDiaDisponivel(formulario, "segunda-feira");

  assert.deepEqual(atualizado.diasDisponiveis, []);
  assert.equal(atualizado.diaLongao, "");
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
