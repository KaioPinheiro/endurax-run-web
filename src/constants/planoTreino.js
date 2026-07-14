import { DIAS_SEMANA } from "./diasSemana";

export { DIAS_SEMANA };

export const FORM_INICIAL_PLANO = {
  objetivo: "",
  objetivoPersonalizado: "",
  idade: "",
  experienciaCorrida: "",
  volumeSemanalAtual: "",
  ritmoConfortavel: "",
  distanciaAlvo: "",
  outraDistanciaAlvo: "",
  diasDisponiveis: [],
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
  "Analisando sua rotina...",
  "Distribuindo os estímulos...",
  "Montando sua semana...",
  "Finalizando seu plano..."
];

export const OBJETIVOS_PLANO = [
  "Emagrecer",
  "Melhorar condicionamento",
  "Melhorar pace",
  "Primeiros 5 km",
  "Primeiros 10 km",
  "Primeira meia maratona",
  "Primeira maratona",
  "Sub 20 nos 5 km",
  "Sub 40 nos 10 km",
  "RP na meia",
  "RP na maratona",
  "Outro"
];

export const EXPERIENCIAS_CORRIDA = [
  "Nunca corri",
  "Menos de 6 meses",
  "6 meses a 1 ano",
  "1 a 3 anos",
  "Mais de 3 anos"
];

export const VOLUMES_SEMANAIS = [
  "Não sei informar",
  "Ainda não corro",
  "Menos de 10 km",
  "10–20 km",
  "20–40 km",
  "40–60 km",
  "60–80 km",
  "80+ km"
];

export const RITMOS_CONFORTAVEIS = [
  "Ainda não sei informar",
  "Caminhada / trote leve",
  "Acima de 7:00 min/km",
  "6:30–7:00 min/km",
  "6:00–6:30 min/km",
  "5:30–6:00 min/km",
  "5:00–5:30 min/km",
  "4:30–5:00 min/km",
  "4:00–4:30 min/km",
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
