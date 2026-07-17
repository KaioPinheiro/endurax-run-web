import { DIAS_SEMANA } from "./diasSemana";

export { DIAS_SEMANA };

export const FORM_INICIAL_PLANO = {
  idade: "",
  objetivo: "",
  objetivoPersonalizado: "",
  experienciaCorrida: "",
  volumeSemanalAtual: "",
  ritmoConfortavel: "",
  distanciaAlvo: "",
  outraDistanciaAlvo: "",
  duracaoSemanas: "4",
  diasDisponiveis: [],
  diaLongao: "",
  possuiLesao: false,
  descricaoLesao: "",
  possuiProva: "",
  dataProva: "",
  distanciaProva: "",
  outraDistanciaProva: "",
  objetivoProva: "",
  tempoDesejadoProva: "",
  importanciaProva: "",
  observacoes: ""
};

export const MENSAGENS_LOADING_PLANO = [
  "Analisando seu objetivo...",
  "Organizando sua progressão...",
  "Distribuindo os treinos...",
  "Estruturando suas semanas...",
  "Finalizando seu plano..."
];

export const DURACOES_PLANO = [
  { valor: "4", label: "4 semanas" },
  { valor: "5", label: "5 semanas" },
  { valor: "6", label: "6 semanas" }
];

export const OBJETIVOS_PLANO = [
  "Melhorar condicionamento",
  "Emagrecer",
  "Primeiros 5 km",
  "Primeiros 10 km",
  "Primeira Meia Maratona",
  "Primeira Maratona",
  "Sub 30 nos 5 km",
  "Outro"
];

export const EXPERIENCIA_SEM_CORRIDA = "Nunca corri";
export const EXPERIENCIA_PARADO = "Estou parado(a)";
export const EXPERIENCIA_MENOS_6_MESES = "Menos de 6 meses";
export const EXPERIENCIA_6_MESES_A_1_ANO = "6 meses a 1 ano";

export const EXPERIENCIAS_INICIANTES = [
  EXPERIENCIA_SEM_CORRIDA,
  EXPERIENCIA_PARADO
];

export const OBJETIVOS_PLANO_SEM_EXPERIENCIA = [
  "Emagrecer",
  "Melhorar condicionamento",
  "Primeiros 5 km",
  "Primeiros 10 km"
];

export const OBJETIVOS_PLANO_MENOS_6_MESES = [
  "Melhorar condicionamento",
  "Emagrecer",
  "Primeiros 5 km",
  "Primeiros 10 km",
  "Sub 30 nos 5 km"
];

export const OBJETIVOS_PLANO_6_MESES_A_1_ANO = OBJETIVOS_PLANO.filter(
  (objetivo) => objetivo !== "Primeira Maratona"
);

export const VOLUME_SEMANAL_MARATONA = "40-60 km";
export const VOLUMES_SEMANAIS_MARATONA = [
  VOLUME_SEMANAL_MARATONA,
  "60-80 km",
  "80+ km"
];

export const EXPERIENCIAS_CORRIDA = [
  EXPERIENCIA_SEM_CORRIDA,
  EXPERIENCIA_PARADO,
  EXPERIENCIA_MENOS_6_MESES,
  EXPERIENCIA_6_MESES_A_1_ANO,
  "1 a 3 anos",
  "Mais de 3 anos"
];

export const VOLUMES_SEMANAIS = [
  "Não sei informar",
  "Menos de 10 km",
  "10-20 km",
  "20-40 km",
  VOLUME_SEMANAL_MARATONA,
  "60-80 km",
  "80+ km"
];

export const RITMOS_CONFORTAVEIS = [
  "Ainda não sei informar",
  "Caminhada / trote leve",
  "Acima de 7:00 min/km",
  "6:30-7:00 min/km",
  "6:00-6:30 min/km",
  "5:30-6:00 min/km",
  "5:00-5:30 min/km",
  "4:30-5:00 min/km",
  "4:00-4:30 min/km",
  "Abaixo de 4:00 min/km"
];

export const DISTANCIAS_ALVO = [
  "5 km",
  "10 km",
  "15 km",
  "21 km",
  "42 km",
  "Ultra",
  "Outro"
];

export const DISTANCIAS_PROVA = [
  "5 km",
  "10 km",
  "15 km",
  "21 km (Meia Maratona)",
  "42 km (Maratona)",
  "Ultramaratona",
  "Outra"
];

export const OBJETIVOS_PROVA = [
  "Completar a prova",
  "Bater meu recorde pessoal",
  "Buscar um tempo específico"
];

export const IMPORTANCIAS_PROVA = [
  "Apenas participar",
  "Prova importante",
  "Prova principal da temporada"
];
