import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function login(dadosLogin) {
  const response = await api.post("/auth/login", dadosLogin);
  return response.data;
}

export async function criarUsuario(dadosUsuario) {
  const response = await api.post("/users", dadosUsuario);
  return response.data;
}

export async function buscarTreinos() {
  const response = await api.get("/treinos");
  return response.data;
}

export async function excluirTreino(id) {
  const response = await api.delete(`/treinos/${id}`);
  return response.data;
}

export async function editarTreino(id, dadosTreino) {
  const response = await api.put(`/treinos/${id}`, dadosTreino);
  return response.data;
}

export async function buscarWorkoutsDoUsuario() {
  const response = await api.get("/workouts/pendentes");
  return response.data;
}

export async function concluirWorkout(id) {
  const response = await api.post(`/workouts/${id}/concluir`);
  return response.data;
}

export async function cancelarWorkout(id) {
  const response = await api.delete(`/workouts/${id}`);
  return response.data;
}

export async function criarWorkout(dadosWorkout) {
  const response = await api.post("/workouts", dadosWorkout);
  return response.data;
}

export async function editarWorkout(id, dadosWorkout) {
  const response = await api.put(`/workouts/${id}`, dadosWorkout);
  return response.data;
}

export async function buscarWorkoutsPendentes() {
  return buscarWorkoutsDoUsuario();
}

export async function gerarTreinoComIA(dadosTreino) {
  const response = await api.post("/api/ai/gerar-treino", dadosTreino);
  return response.data;
}

export async function gerarPlanoComIA(dadosPlano) {
  const response = await api.post("/api/ai/gerar-plano", dadosPlano);
  return response.data;
}

export async function buscarConfigPublica() {
  const response = await api.get("/api/config/publica");
  return response.data;
}

export async function criarSolicitacaoPlano(email, formulario) {
  const response = await api.post("/api/solicitacoes-plano", { email, formulario });
  return response.data;
}

export async function criarPagamentoPix(email, solicitacaoPlanoId) {
  const response = await api.post("/api/pagamentos/pix", { email, solicitacaoPlanoId });
  return response.data;
}

export async function buscarResultadoPagamento(acessoToken) {
  const response = await api.get(`/api/pagamentos/public/${acessoToken}/resultado`);
  return response.data;
}

// Reconciliação explícita com o Mercado Pago. Fica fora do polling de progresso:
// uma indisponibilidade do provedor não pode impedir a leitura do estado já persistido.
// Quando detecta aprovação, quem inicia a geração é o backend, não esta chamada.
export async function reconciliarPagamento(acessoToken) {
  await api.get(`/api/pagamentos/public/${acessoToken}/status`);
}

export async function tentarGeracaoNovamente(acessoToken) {
  await api.post(`/api/pagamentos/public/${acessoToken}/geracao/tentar-novamente`);
}

export async function buscarPlanoGerado(planoToken) {
  const response = await api.get(`/training-plans/public/${planoToken}`);
  const planoPersistido = response.data;

  if (typeof planoPersistido?.descricao !== "string") {
    if (!planoPersistido?.descricao) {
      throw new Error("O plano foi encontrado, mas está sem conteúdo. Tente novamente.");
    }
    return planoPersistido.descricao;
  }

  try {
    const descricao = JSON.parse(planoPersistido.descricao);
    if (!descricao || typeof descricao !== "object") {
      throw new Error("O plano foi encontrado, mas seu conteúdo está inválido. Tente novamente.");
    }
    return descricao;
  } catch {
    throw new Error("O plano foi encontrado, mas seu conteúdo está inválido. Tente novamente.");
  }
}

export default api;
