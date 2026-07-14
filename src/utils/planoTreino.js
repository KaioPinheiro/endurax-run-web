import { FORM_INICIAL_PLANO } from "../constants/planoTreino";

const SEM_VALOR = "—";

const NOMENCLATURAS_TREINO = {
  "corrida continua": "Corrida contínua",
  "corida continua": "Corrida contínua",
  "corrrida continua": "Corrida contínua",
  "corria continua": "Corrida contínua",
  rodagem: "Corrida contínua",
  "corrida leve": "Corrida contínua",
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
  "treino de resistencia": "Treino de resistência",
  resistencia: "Treino de resistência",
  "corrida de resistencia": "Treino de resistência",
  intervalado: "Intervalado",
  interbalado: "Intervalado",
  intervalada: "Intervalado",
  fartlek: "Fartlek",
  "recuperacao ativa": "Recuperação ativa",
  recuperacao: "Recuperação ativa",
  mobilidade: "Mobilidade",
  mobilidadee: "Mobilidade",
  fortalecimento: "Fortalecimento",
  fortalescimento: "Fortalecimento",
  "fortalecimento leve": "Fortalecimento",
  descanso: "Descanso",
  regenerativo: "Regenerativo"
};

export function criarEstadoInicialPlano() {
  return {
    ...FORM_INICIAL_PLANO,
    diasDisponiveis: []
  };
}

export function normalizarCampoPlano(formulario, campo) {
  const { name, value, type, checked } = campo;

  return {
    ...formulario,
    [name]: type === "checkbox" ? checked : value,
    ...(name === "objetivo" && value !== "Outro"
      ? { objetivoPersonalizado: "" }
      : {}),
    ...(name === "possuiLesao" && !checked ? { descricaoLesao: "" } : {}),
    ...(name === "distanciaAlvo" && value !== "Outro"
      ? { outraDistanciaAlvo: "" }
      : {}),
    ...(name === "possuiProva" && value !== "sim"
      ? limparCamposProva()
      : {}),
    ...(name === "distanciaProva" && value !== "Outra"
      ? { outraDistanciaProva: "" }
      : {}),
    ...(name === "objetivoProva" && value !== "Buscar um tempo específico"
      ? { tempoDesejadoProva: "" }
      : {})
  };
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
  return {
    ...formulario,
    diasDisponiveis: formulario.diasDisponiveis.includes(dia)
      ? formulario.diasDisponiveis.filter((item) => item !== dia)
      : [...formulario.diasDisponiveis, dia]
  };
}

export function validarFormularioPlano(formulario) {
  const idadeNumero = Number(formulario.idade);

  if (
    !Number.isInteger(idadeNumero) ||
    idadeNumero < 18 ||
    idadeNumero > 100
  ) {
    return "Informe uma idade inteira entre 18 e 100 anos.";
  }

  if (formulario.diasDisponiveis.length === 0) {
    return "Selecione pelo menos um dia disponível para treinar.";
  }

  if (
    formulario.objetivo === "Outro" &&
    !formulario.objetivoPersonalizado.trim()
  ) {
    return "Informe o objetivo personalizado.";
  }

  if (
    formulario.distanciaAlvo === "Outro" &&
    !formulario.outraDistanciaAlvo.trim()
  ) {
    return "Informe a distância alvo desejada.";
  }

  return null;
}

export function montarPayloadPlanoSemanal(formulario) {
  const {
    idade,
    objetivoPersonalizado,
    outraDistanciaAlvo,
    observacoes,
    ...dadosPlano
  } = formulario;
  const idadeNumero = Number(idade);
  const perfilAtleta = `Idade: ${idade} anos.`;

  return {
    ...dadosPlano,
    objetivo: formulario.objetivo === "Outro"
      ? objetivoPersonalizado.trim()
      : formulario.objetivo,
    idade: idadeNumero,
    distanciaAlvo: formulario.distanciaAlvo === "Outro"
      ? outraDistanciaAlvo.trim()
      : formulario.distanciaAlvo,
    possuiProva: formulario.possuiProva === "sim",
    intensidadeDesejada: "adequada ao perfil informado",
    observacoes: observacoes.trim()
      ? `${perfilAtleta} Observações adicionais: ${observacoes.trim()}`
      : perfilAtleta
  };
}

export function textoNormalizado(valor) {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function normalizarNomenclaturaTreino(valor) {
  const chave = textoNormalizado(valor);

  return NOMENCLATURAS_TREINO[chave] ?? valor;
}

function ehValorSemMetrica(valor) {
  const texto = textoNormalizado(valor);

  return (
    !texto ||
    texto === "-" ||
    texto === "—" ||
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
  const horas = normalizado.match(/(\d+)\s*(?:h|hora|horas)/);
  const minutos = normalizado.match(/(\d+)\s*(?:min|minuto|minutos)/);

  if (horas || minutos) {
    if (!horas && minutos) {
      return `${Number(minutos[1])} min`;
    }

    if (horas) {
      const horasFormatadas = `${Number(horas[1])}h`;

      if (minutos && Number(minutos[1]) > 0) {
        return `${horasFormatadas} ${Number(minutos[1])}min`;
      }

      return horasFormatadas;
    }
  }

  const apenasNumero = normalizado.match(/^(\d+)$/);
  if (apenasNumero) {
    return `${Number(apenasNumero[1])} min`;
  }

  return texto;
}

export function formatarPace(valor) {
  if (ehValorSemMetrica(valor)) {
    return SEM_VALOR;
  }

  const texto = String(valor)
    .trim()
    .replace(/\s*-\s*/g, "–")
    .replace(/\s*–\s*/g, "–");

  if (/^\d+:\d{2}(?:–\d+:\d{2})?$/.test(texto)) {
    return `${texto} min/km`;
  }

  return texto;
}
