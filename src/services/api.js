import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("TOKEN ENVIADO:", token);

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

export async function gerarPlanoSemanalComIA(dadosPlano) {
  const response = await api.post("/api/ai/gerar-plano-semanal", dadosPlano);
  return response.data;
}

export default api;
