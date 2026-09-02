import {
  EXPERIENCIA_6_MESES_A_1_ANO,
  EXPERIENCIA_MENOS_6_MESES,
  EXPERIENCIA_PARADO,
  EXPERIENCIAS_PERGUNTA_5_KM,
  EXPERIENCIAS_INICIANTES,
  FORM_INICIAL_PLANO,
  OBJETIVOS_PLANO_6_MESES_A_1_ANO,
  OBJETIVOS_PLANO_MENOS_6_MESES,
  OBJETIVOS_PLANO_SEM_EXPERIENCIA,
  VOLUMES_SEMANAIS,
  VOLUMES_SEMANAIS_MARATONA
} from "../constants/planoTreino.js";

const SEM_VALOR = "—";

const NOMENCLATURAS_TREINO = {
  "corrida continua": "Corrida continua",
  "corida continua": "Corrida continua",
  "corrrida continua": "Corrida continua",
  "corria continua": "Corrida continua",
  rodagem: "Corrida continua",
  "corrida leve": "Corrida continua",
  "corrida longa": "Corrida longa",
  "corida longa": "Corrida longa",
  "corrrida longa": "Corrida longa",
  "corria longa": "Corrida longa",
  longao: "Corrida longa",
  "treino longo": "Corrida longa",
  "treino de velocidade": "Treino de velocidade",
  velocidade: "Treino de velocidade",
  velocidadee: "Treino de velocidade",
  tiro: "Treino de velocidade",
  tiros: "Treino de velocidade",
  "treino de resistencia": "Treino de resistencia",
  resistencia: "Treino de resistencia",
  "corrida de resistencia": "Treino de resistencia",
  intervalado: "Intervalado",
  interbalado: "Intervalado",
  intervalada: "Intervalado",
  fartlek: "Fartlek",
  "recuperacao ativa": "Recuperacao ativa",
  recuperacao: "Recuperacao ativa",
  mobilidade: "Mobilidade",
  mobilidadee: "Mobilidade",
  fortalecimento: "Fortalecimento",
  fortalescimento: "Fortalecimento",
  "fortalecimento leve": "Fortalecimento",
  descanso: "Descanso",
  regenerativo: "Regenerativo"
};

const TIPOS_SEM_CORRIDA = [
  "descanso",
  "fortalecimento",
  "mobilidade",
  "alongamento",
  "recuperacao sem corrida",
  "caminhada"
];

const INDICADORES_CORRIDA = [
  "corrida",
  "rodagem",
  "longao",
  "interval",
  "fartlek",
  "ritmo",
  "tempo",
  "velocidade",
  "resistencia",
  "regenerativo",
  "tiro"
];

export function criarEstadoInicialPlano() {
  return {
    ...FORM_INICIAL_PLANO,
    email: localStorage.getItem("email") || "",
    diasDisponiveis: []
  };
}

export function normalizarCampoPlano(formulario, campo) {
  const { name, value, type, checked } = campo;
  const valorNormalizado = name === "idade"
    ? normalizarIdade(value)
    : name === "maiorDistanciaCorrida"
      ? normalizarMaiorDistancia(value)
    : value;
  const objetivosPermitidos = name === "experienciaCorrida"
    ? objetivosDisponiveisPorExperiencia(valorNormalizado)
    : null;
  const objetivoIncompativelComExperiencia =
    name === "experienciaCorrida" &&
    formulario.objetivo &&
    !objetivosPermitidos.includes(formulario.objetivo);

  const proximoFormulario = {
    ...formulario,
    [name]: type === "checkbox" ? checked : valorNormalizado,
    ...(objetivoIncompativelComExperiencia
      ? { objetivo: "", tempoAtual: "", tempoDesejado: "" }
      : {}),
    ...(name === "experienciaCorrida" &&
      EXPERIENCIAS_INICIANTES.includes(valorNormalizado)
      ? { volumeSemanalAtual: "" }
      : {}),
    ...(name === "experienciaCorrida" && !diaLongaoEhAplicavel(valorNormalizado)
      ? { diaLongao: "" }
      : {}),
    ...(name === "objetivo" && !ehObjetivoPerformance(valorNormalizado)
      ? { tempoAtual: "", tempoDesejado: "" }
      : {}),
    ...(name === "corre5KmSemCaminhar" && valorNormalizado !== "sim"
      ? { tempo5Km: "" }
      : {}),
    ...(name === "possuiLesao" && !checked ? { descricaoLesao: "" } : {}),
    ...(name === "possuiProva" && valorNormalizado !== "sim"
      ? limparCamposProva()
      : {}),
    ...(name === "distanciaProva" && valorNormalizado !== "Outra"
      ? { outraDistanciaProva: "" }
      : {}),
    ...(name === "objetivoProva" && value !== "Buscar um tempo específico"
      ? { tempoDesejadoProva: "" }
      : {})
  };

  const formularioComVolumeNormalizado =
    proximoFormulario.volumeSemanalAtual &&
    !volumesDisponiveisPorObjetivo(proximoFormulario.objetivo)
      .includes(proximoFormulario.volumeSemanalAtual)
      ? { ...proximoFormulario, volumeSemanalAtual: "" }
      : proximoFormulario;
  const formularioComCapacidadeNormalizada = corre5KmSemCaminharEhAplicavel(
    formularioComVolumeNormalizado.experienciaCorrida,
    formularioComVolumeNormalizado.objetivo
  )
    ? formularioComVolumeNormalizado
    : { ...formularioComVolumeNormalizado, corre5KmSemCaminhar: "", tempo5Km: "" };

  if (
    ehPlanoMaratona(formularioComCapacidadeNormalizada) &&
    formularioComCapacidadeNormalizada.volumeSemanalAtual &&
    !volumeMaratonaPermitido(formularioComCapacidadeNormalizada.volumeSemanalAtual)
  ) {
    return {
      ...formularioComCapacidadeNormalizada,
      volumeSemanalAtual: ""
    };
  }

  return planoIndicaMeiaOuMaratona(formularioComCapacidadeNormalizada)
    ? formularioComCapacidadeNormalizada
    : { ...formularioComCapacidadeNormalizada, maiorDistanciaCorrida: "" };
}

export function normalizarIdade(valor) {
  const apenasNumeros = String(valor).replace(/\D/g, "");

  if (!apenasNumeros) {
    return "";
  }

  const idade = Number(apenasNumeros);

  if (idade > 80) {
    return "80";
  }

  return apenasNumeros;
}

export function normalizarFormularioPlanoRestaurado(formulario) {
  if (!formulario || typeof formulario !== "object") {
    return formulario;
  }

  const normalizado = normalizarCampoPlano(formulario, {
    name: "experienciaCorrida",
    value: formulario.experienciaCorrida || "",
    type: "select-one"
  });
  return corre5KmSemCaminharEhAplicavel(
    normalizado.experienciaCorrida,
    normalizado.objetivo
  )
    ? normalizado
    : { ...normalizado, corre5KmSemCaminhar: null, tempo5Km: null };
}

export function normalizarMaiorDistancia(valor) {
  return String(valor ?? "").replace(/\D/g, "").slice(0, 2);
}

export function normalizarEntradaTempo(valor) {
  let quantidadeDigitos = 0;
  return [...String(valor ?? "").replace(/[^\d:]/g, "")]
    .filter((caractere) => {
      if (caractere === ":") {
        return true;
      }
      quantidadeDigitos += 1;
      return quantidadeDigitos <= 5;
    })
    .join("")
    .slice(0, 7);
}

export function completarEntradaTempo(valor) {
  const texto = normalizarEntradaTempo(valor);
  if (!texto || texto.includes(":")) {
    return texto;
  }

  if (texto.length <= 2) {
    return `${texto.padStart(2, "0")}:00`;
  }
  if (texto.length === 3) {
    return `${texto[0]}:${texto.slice(1)}:00`;
  }
  if (texto.length === 4) {
    return `${texto.slice(0, 2)}:${texto.slice(2)}`;
  }
  if (texto.length === 5) {
    return `${texto[0]}:${texto.slice(1, 3)}:${texto.slice(3)}`;
  }
  return texto;
}

export const normalizarTempo5Km = normalizarEntradaTempo;
export const completarTempo5Km = completarEntradaTempo;

export function validarTempo5Km(valor) {
  const texto = String(valor ?? "").trim();
  const partes = texto.split(":");
  const formatoValido = partes.length === 2
    ? /^\d{1,2}:[0-5]\d$/.test(texto)
    : partes.length === 3 && /^\d{1,2}:[0-5]\d:[0-5]\d$/.test(texto);
  if (!formatoValido) {
    return { valido: false, acimaDoLimite: false };
  }

  const numeros = partes.map(Number);
  const totalSegundos = partes.length === 2
    ? numeros[0] * 60 + numeros[1]
    : numeros[0] * 3600 + numeros[1] * 60 + numeros[2];
  return {
    valido: totalSegundos > 0 && totalSegundos <= 2 * 3600,
    acimaDoLimite: totalSegundos > 2 * 3600
  };
}

export function objetivosDisponiveisPorExperiencia(experienciaCorrida) {
  if (EXPERIENCIAS_INICIANTES.includes(experienciaCorrida)) {
    return OBJETIVOS_PLANO_SEM_EXPERIENCIA;
  }

  if (experienciaCorrida === EXPERIENCIA_MENOS_6_MESES) {
    return OBJETIVOS_PLANO_MENOS_6_MESES;
  }

  if (experienciaCorrida === EXPERIENCIA_6_MESES_A_1_ANO) {
    return OBJETIVOS_PLANO_6_MESES_A_1_ANO;
  }

  return OBJETIVOS_PLANO_6_MESES_A_1_ANO;
}

export function rotuloObjetivoPorExperiencia(objetivo, experienciaCorrida) {
  return objetivo === "Começar a correr" && experienciaCorrida === EXPERIENCIA_PARADO
    ? "Voltar a correr"
    : objetivo;
}

export function diaLongaoEhAplicavel(experienciaCorrida) {
  const experiencia = String(experienciaCorrida ?? "").trim();
  return !EXPERIENCIAS_INICIANTES.includes(experiencia) &&
    experiencia !== "Estou parado";
}

export function volumesDisponiveisPorObjetivo(objetivo) {
  if (objetivo === "Melhorar tempo nos 5 km") {
    return VOLUMES_SEMANAIS.slice(1, 3);
  }

  if (objetivo === "Melhorar tempo nos 10 km") {
    return VOLUMES_SEMANAIS.slice(2, 4);
  }

  if (objetivo === "Primeiros 10 km") {
    return VOLUMES_SEMANAIS.slice(1, 4);
  }

  return VOLUMES_SEMANAIS;
}

export function limparCamposProva() {
  return {
    dataProva: "",
    distanciaProva: "",
    outraDistanciaProva: "",
    objetivoProva: "",
    tempoDesejadoProva: "",
    importanciaProva: ""
  };
}

export function alternarDiaDisponivel(formulario, dia) {
  const diasDisponiveis = formulario.diasDisponiveis.includes(dia)
    ? formulario.diasDisponiveis.filter((item) => item !== dia)
    : [...formulario.diasDisponiveis, dia];

  return {
    ...formulario,
    diasDisponiveis,
    diaLongao: diasDisponiveis.includes(formulario.diaLongao)
      ? formulario.diaLongao
      : ""
  };
}

export function validarFormularioPlano(formulario) {
  const idade = Number(formulario.idade);

  if (
    !Number.isInteger(idade) ||
    idade < 16 ||
    idade > 80
  ) {
    return "Informe uma idade inteira entre 16 e 80 anos.";
  }

  if (!formulario.objetivo) {
    return "Escolha um objetivo compatível com sua experiência na corrida.";
  }

  if (
    formulario.objetivo &&
    !objetivosDisponiveisPorExperiencia(formulario.experienciaCorrida)
      .includes(formulario.objetivo)
  ) {
    return "Escolha um objetivo compatível com sua experiência na corrida.";
  }

  if (formulario.diasDisponiveis.length === 0) {
    return "Selecione pelo menos um dia disponível para treinar.";
  }

  if (
    corre5KmSemCaminharEhAplicavel(
      formulario.experienciaCorrida,
      formulario.objetivo
    ) &&
    !["sim", "nao"].includes(formulario.corre5KmSemCaminhar)
  ) {
    return "Informe se você já corre 5 km direto sem caminhar.";
  }

  if (
    corre5KmSemCaminharEhAplicavel(
      formulario.experienciaCorrida,
      formulario.objetivo
    ) &&
    formulario.corre5KmSemCaminhar === "sim" &&
    !formulario.tempo5Km.trim()
  ) {
    return "Informe em quanto tempo você corre 5 km.";
  }

  if (
    corre5KmSemCaminharEhAplicavel(
      formulario.experienciaCorrida,
      formulario.objetivo
    ) &&
    formulario.corre5KmSemCaminhar === "sim"
  ) {
    const tempo5Km = validarTempo5Km(formulario.tempo5Km);
    if (tempo5Km.acimaDoLimite) {
      return "O tempo dos 5 km deve ser de no máximo 2:00:00.";
    }
    if (!tempo5Km.valido) {
      return "Informe um tempo válido no formato MM:SS ou HH:MM:SS.";
    }
  }

  if (
    planoIndicaMeiaOuMaratona(formulario) &&
    !formulario.maiorDistanciaCorrida.trim()
  ) {
    return "Informe a maior distância que você já correu.";
  }


  if (
    planoIndicaMeiaOuMaratona(formulario) &&
    (!/^\d{1,2}$/.test(formulario.maiorDistanciaCorrida) ||
      Number(formulario.maiorDistanciaCorrida) > 99)
  ) {
    return "Informe a maior distância com um número inteiro entre 0 e 99 km.";
  }

  if (
    diaLongaoEhAplicavel(formulario.experienciaCorrida) &&
    (!formulario.diaLongao ||
      !formulario.diasDisponiveis.includes(formulario.diaLongao))
  ) {
    return "Escolha o dia do longão entre os dias disponíveis para treinar.";
  }

  if (ehObjetivoPerformance(formulario.objetivo)) {
    const atual = tempoEmSegundos(formulario.tempoAtual, formulario.objetivo);
    const desejado = tempoEmSegundos(formulario.tempoDesejado, formulario.objetivo);

    if (atual === null || desejado === null) {
      return `Informe tempos válidos no formato ${formatoTempoObjetivo(formulario.objetivo)}.`;
    }
    if (desejado >= atual) {
      return "O tempo desejado deve ser melhor que o tempo atual.";
    }
  }

  return null;
}

export function validarFormularioMeuPlano(formulario) {
  const erroBase = validarFormularioPlano(formulario);
  if (erroBase) {
    return erroBase;
  }

  const erroMaratona = validarBloqueiosMaratona(formulario);
  if (erroMaratona) {
    return erroMaratona;
  }

  if (
    !["4", "5", "6"].includes(String(formulario.duracaoSemanas))
  ) {
    return "Escolha uma duração de 4, 5 ou 6 semanas.";
  }

  return null;
}

export function validarBloqueiosMaratona(formulario) {
  if (!ehPlanoMaratona(formulario)) {
    return null;
  }

  if (Number(formulario.idade) < 18) {
    return "Para plano de maratona, a idade mínima é 18 anos.";
  }

  if (formulario.diasDisponiveis.length < 4) {
    return "Para plano de maratona, selecione pelo menos 4 dias disponíveis para treinar.";
  }

  if (
    formulario.volumeSemanalAtual &&
    !volumeMaratonaPermitido(formulario.volumeSemanalAtual)
  ) {
    return "Para plano de maratona, o volume semanal atual deve ser 40-60 km, 60-80 km ou 80+ km.";
  }

  if (
    formulario.experienciaCorrida &&
    !experienciaMaratonaPermitida(formulario.experienciaCorrida)
  ) {
    return "Para plano de maratona, a experiência na corrida deve ser a partir de 1 a 3 anos.";
  }

  return null;
}

export function planoIndicaMaratona(formulario) {
  return ehPlanoMaratona(formulario);
}

export function planoIndicaMeiaOuMaratona(formulario) {
  const objetivo = formulario.objetivo;
  const texto = textoNormalizado([
    objetivo,
    formulario.distanciaAlvo
  ].filter(Boolean).join(" "));

  return texto.includes("meia maratona") ||
    texto.includes("21 km") ||
    texto.includes("21k") ||
    campoIndicaMaratona(texto);
}

export function montarPayloadMeuPlano(formulario) {
  const objetivo = formulario.objetivo;
  const objetivoPerformance = ehObjetivoPerformance(objetivo);
  const distanciaAlvo = inferirDistanciaAlvo(formulario);
  const observacoes = montarObservacoesComLongao(formulario);

  return {
    idade: Number(formulario.idade),
    objetivo,
    tempoAtual: objetivoPerformance ? formulario.tempoAtual.trim() : null,
    tempoDesejado: objetivoPerformance ? formulario.tempoDesejado.trim() : null,
    corre5KmSemCaminhar:
      corre5KmSemCaminharEhAplicavel(
        formulario.experienciaCorrida,
        formulario.objetivo
      ) &&
      ["sim", "nao"].includes(formulario.corre5KmSemCaminhar)
      ? formulario.corre5KmSemCaminhar === "sim"
      : null,
    tempo5Km:
      corre5KmSemCaminharEhAplicavel(
        formulario.experienciaCorrida,
        formulario.objetivo
      ) &&
      formulario.corre5KmSemCaminhar === "sim"
      ? formulario.tempo5Km.trim()
      : null,
    maiorDistanciaCorrida: planoIndicaMeiaOuMaratona(formulario)
      ? formulario.maiorDistanciaCorrida.trim()
      : null,
    experienciaCorrida: formulario.experienciaCorrida,
    volumeSemanalAtual: EXPERIENCIAS_INICIANTES.includes(formulario.experienciaCorrida)
      ? null
      : formulario.volumeSemanalAtual,
    ritmoConfortavel: formulario.ritmoConfortavel,
    distanciaAlvo,
    diasDisponiveis: formulario.diasDisponiveis,
    diaLongao: diaLongaoEhAplicavel(formulario.experienciaCorrida)
      ? formulario.diaLongao || null
      : null,
    possuiProva: false,
    dataProva: null,
    distanciaProva: null,
    objetivoProva: null,
    importanciaProva: null,
    possuiLesao: formulario.possuiLesao,
    observacoes,
    duracaoSemanas: Number(formulario.duracaoSemanas)
  };
}

function inferirDistanciaAlvo(formulario) {
  if (formulario.distanciaAlvo === "Outro" && formulario.outraDistanciaAlvo.trim()) {
    return formulario.outraDistanciaAlvo.trim();
  }

  if (formulario.distanciaAlvo) {
    return formulario.distanciaAlvo;
  }

  const objetivo = formulario.objetivo;
  const textoObjetivo = textoNormalizado(objetivo);

  if (textoObjetivo.includes("5 km")) {
    return "5 km";
  }

  if (textoObjetivo.includes("10 km")) {
    return "10 km";
  }

  if (textoObjetivo.includes("meia maratona")) {
    return "21 km";
  }

  if (textoObjetivo.includes("maratona")) {
    return "42 km";
  }

  return "Sem distância alvo definida";
}

function ehPlanoMaratona(formulario) {
  const objetivo = formulario.objetivo;
  const distanciaAlvo = inferirDistanciaAlvo(formulario);
  return campoIndicaMaratona(objetivo) ||
    campoIndicaMaratona(distanciaAlvo);
}

function campoIndicaMaratona(valor) {
  const texto = textoNormalizado(valor);

  if (/\b42\s*(km|k|quilometros?)\b/.test(texto)) {
    return true;
  }

  return texto.includes("maratona") &&
    !texto.includes("meia maratona") &&
    !texto.includes("21 km") &&
    !texto.includes("21k");
}

function experienciaMaratonaPermitida(valor) {
  const texto = textoNormalizado(valor);

  return texto.includes("1 a 3 anos") ||
    texto.includes("1-3 anos") ||
    texto.includes("mais de 3 anos") ||
    texto.includes("mais que 3 anos") ||
    texto.includes("acima de 3 anos");
}

function volumeMaratonaPermitido(valor) {
  const texto = textoNormalizado(valor)
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, "");

  return VOLUMES_SEMANAIS_MARATONA.some((volume) =>
    texto === textoNormalizado(volume).replace(/\s+/g, "")
  );
}

function montarObservacoesComLongao(formulario) {
  const observacoes = [];

  if (formulario.observacoes.trim()) {
    observacoes.push(formulario.observacoes.trim());
  }

  if (formulario.possuiLesao && formulario.descricaoLesao.trim()) {
    observacoes.push(`Lesão ou limitação: ${formulario.descricaoLesao.trim()}`);
  }

  if (formulario.diaLongao) {
    observacoes.push(`Dia preferido para o longão: ${formulario.diaLongao}.`);
  }

  return observacoes.join(" ");
}

export function textoNormalizado(valor) {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function ehObjetivoPerformance(objetivo) {
  return textoNormalizado(objetivo).startsWith("melhorar tempo ");
}

export function objetivoExibePergunta5Km(objetivo) {
  return [
    "Começar a correr",
    "Melhorar condicionamento",
    "Emagrecer",
    "Primeiros 5 km"
  ].includes(objetivo);
}

export function corre5KmSemCaminharEhAplicavel(experienciaCorrida, objetivo) {
  return EXPERIENCIAS_PERGUNTA_5_KM.includes(experienciaCorrida) &&
    objetivoExibePergunta5Km(objetivo);
}

export function distanciaObjetivoPerformance(objetivo) {
  const texto = textoNormalizado(objetivo);
  if (texto.includes("5 km")) return "5 km";
  if (texto.includes("10 km")) return "10 km";
  if (texto.includes("meia maratona")) return "Meia Maratona";
  if (texto.includes("maratona")) return "Maratona";
  return "distância";
}

export function formatoTempoObjetivo(objetivo) {
  return distanciaObjetivoPerformance(objetivo) === "Maratona" ? "H:MM:SS" : "MM:SS";
}

function tempoEmSegundos(valor, objetivo) {
  const partes = String(valor ?? "").trim().split(":");
  const esperaHoras = formatoTempoObjetivo(objetivo) === "H:MM:SS";
  if ((esperaHoras && partes.length !== 3) || (!esperaHoras && partes.length !== 2)) return null;
  if (!partes.every((parte) => /^\d+$/.test(parte))) return null;
  const numeros = partes.map(Number);
  if (numeros.some((numero) => numero < 0) || numeros.slice(1).some((numero) => numero > 59)) return null;
  if (numeros[0] <= 0) return null;
  return esperaHoras
    ? numeros[0] * 3600 + numeros[1] * 60 + numeros[2]
    : numeros[0] * 60 + numeros[1];
}

export function normalizarNomenclaturaTreino(valor) {
  const chave = textoNormalizado(valor);

  return NOMENCLATURAS_TREINO[chave] ?? valor;
}

export function ehTreinoCorrida(treino) {
  const categoria = textoNormalizado([
    treino?.tipo,
    treino?.titulo
  ].filter(Boolean).join(" "));
  const textoTreino = textoNormalizado([
    treino?.tipo,
    treino?.titulo,
    treino?.descricao
  ].filter(Boolean).join(" "));

  if (!textoTreino) {
    return false;
  }

  const categoriaSemCorrida = TIPOS_SEM_CORRIDA
    .filter((tipo) => tipo !== "caminhada")
    .some((tipo) => categoria.includes(tipo));
  const caminhadaSemCorridaOuTrote = categoria.includes("caminhada") &&
    !categoria.includes("corrida") &&
    !categoria.includes("trote");

  if (categoriaSemCorrida || caminhadaSemCorridaOuTrote) {
    return false;
  }

  return (
    temDistanciaValida(treino?.distanciaKm) ||
    textoTreino.includes("trote") ||
    INDICADORES_CORRIDA.some((tipo) => textoTreino.includes(tipo))
  );
}

function temDistanciaValida(valor) {
  if (ehValorSemMetrica(valor)) {
    return false;
  }

  const texto = String(valor).trim();
  const distancia = texto.match(/^(\d+(?:[,.]\d+)?)\s*(?:km)?$/i);

  return Boolean(distancia && Number(distancia[1].replace(",", ".")) > 0);
}

function ehValorSemMetrica(valor) {
  const texto = textoNormalizado(valor);

  return (
    !texto ||
    texto === "-" ||
    texto === "â€”" ||
    texto === "0" ||
    texto === "0 km" ||
    texto === "nao se aplica"
  );
}

export function formatarDistancia(valor) {
  if (ehValorSemMetrica(valor)) {
    return SEM_VALOR;
  }

  const texto = String(valor).trim();
  const distancia = texto.match(/^(\d+(?:[,.]\d+)?)\s*(?:km)?$/i);

  if (!distancia) {
    return texto;
  }

  return `${distancia[1]} km`;
}

export function formatarDuracao(valor) {
  if (ehValorSemMetrica(valor)) {
    return SEM_VALOR;
  }

  const texto = String(valor).trim();
  const normalizado = textoNormalizado(texto);
  const tempoComHoras = normalizado.match(/^(\d+):(\d{2}):(\d{2})$/);
  const tempoComMinutos = normalizado.match(/^(\d+):(\d{2})$/);

  if (tempoComHoras) {
    const [, horas, minutos, segundos] = tempoComHoras;
    const totalMinutos =
      Number(horas) * 60 + Number(minutos) + Number(segundos) / 60;

    return formatarMinutos(totalMinutos);
  }

  if (tempoComMinutos) {
    const [, primeiraParte, segundaParte] = tempoComMinutos;
    const primeiroNumero = Number(primeiraParte);
    const segundoNumero = Number(segundaParte);

    if (primeiroNumero > 0 && primeiroNumero <= 6 && segundoNumero < 60) {
      return formatarHorasMinutos(primeiroNumero, segundoNumero);
    }

    const totalMinutos = primeiroNumero + segundoNumero / 60;

    return formatarMinutos(totalMinutos);
  }

  const horas = normalizado.match(/(\d+)\s*(?:h|hora|horas)/);
  const minutos = normalizado.match(/(\d+)\s*(?:min|minuto|minutos)/);

  if (horas || minutos) {
    if (!horas && minutos) {
      return formatarMinutos(Number(minutos[1]));
    }

    if (horas) {
      const horasFormatadas = `${Number(horas[1])}h`;

      if (minutos && Number(minutos[1]) > 0) {
        return `${horasFormatadas} ${formatarMinutos(Number(minutos[1]))}`;
      }

      return horasFormatadas;
    }
  }

  const apenasNumero = normalizado.match(/^(\d+)$/);
  if (apenasNumero) {
    return formatarMinutos(Number(apenasNumero[1]));
  }

  return texto;
}

function formatarMinutos(valor) {
  const minutos = Number(valor);
  const texto = Number.isInteger(minutos)
    ? String(minutos)
    : String(Number(minutos.toFixed(1))).replace(".", ",");

  return `${texto} minutos`;
}

function formatarHorasMinutos(horas, minutos) {
  if (minutos > 0) {
    return `${horas}h ${minutos} minutos`;
  }

  return `${horas}h`;
}

export function formatarPace(valor) {
  if (ehValorSemMetrica(valor)) {
    return SEM_VALOR;
  }

  const texto = String(valor)
    .trim()
    .replace(/\s*(?:-|–|—|â€“|â€”)+\s*/g, "-");

  if (/^\d+:\d{2}(?:-\d+:\d{2})?$/.test(texto)) {
    return `${texto} min/km`;
  }

  return texto;
}

export function extrairDuracaoExplicitaBloco(valor) {
  const texto = String(valor ?? "");
  const minutosESegundos = texto.match(
    /\b(\d+:\d{2})\s*min(?:uto)?s?\b(?!\s*\/\s*km)/i
  );
  if (minutosESegundos) {
    return `${minutosESegundos[1]} min`;
  }

  const minutos = texto.match(
    /\b(\d+)\s*min(?:uto)?s?\b(?!\s*\/\s*km)/i
  );
  return minutos ? `${minutos[1]} min` : "";
}

export function extrairDistanciaExplicitaBloco(valor) {
  const distancia = String(valor ?? "").match(
    /\b(\d+(?:[,.]\d+)?)\s*(km|m)\b/i
  );

  return distancia ? `${distancia[1]} ${distancia[2].toLowerCase()}` : "";
}

export function estimarDistanciaBloco(duracao, pace) {
  const duracaoValida = String(duracao ?? "").trim().match(
    /^(\d+)\s*min(?:uto)?s?$/i
  );
  const paceValido = String(pace ?? "").trim().match(
    /^(\d+):(\d{2})(?:\s*-\s*(\d+):(\d{2}))?\s*min\/km$/i
  );

  if (!duracaoValida || !paceValido) {
    return "";
  }

  const duracaoSegundos = Number(duracaoValida[1]) * 60;
  const primeiroPace = Number(paceValido[1]) * 60 + Number(paceValido[2]);
  const segundoPace = paceValido[3] === undefined
    ? primeiroPace
    : Number(paceValido[3]) * 60 + Number(paceValido[4]);

  if (
    duracaoSegundos <= 0 ||
    primeiroPace <= 0 ||
    segundoPace <= 0 ||
    Number(paceValido[2]) >= 60 ||
    Number(paceValido[4] ?? 0) >= 60
  ) {
    return "";
  }

  const paceMedioSegundos = (primeiroPace + segundoPace) / 2;
  const distanciaKm = duracaoSegundos / paceMedioSegundos;

  return `~${distanciaKm.toFixed(1).replace(".", ",")} km`;
}
