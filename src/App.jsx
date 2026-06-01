import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function App() {
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [treinos, setTreinos] = useState([]);
  const [treinoEditandoId, setTreinoEditandoId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("");

  const [form, setForm] = useState({
    dataTreino: "",
    tipo: "",
    distanciaKm: "",
    tempoMinutos: "",
    paceMedio: "",
    observacoes: ""
  });

  useEffect(() => {
    buscarTreinos();
  }, []);

  async function buscarTreinos() {
    try {
      const response = await axios.get("http://localhost:8080/treinos");
      setTreinos(response.data);
    } catch (error) {
      console.error("Erro ao buscar treinos", error);
    }
  }

  function alterarCampo(event) {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  }

  function mostrarMensagem(texto, tipo) {

    setMensagem(texto);
     setTipoMensagem(tipo);

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  }

  async function salvarTreino(event) {
    event.preventDefault();

    const dados = {
      ...form,
      distanciaKm: Number(form.distanciaKm),
      tempoMinutos: Number(form.tempoMinutos)
    };

    try {
      if (treinoEditandoId) {
        await axios.put(
          `http://localhost:8080/treinos/${treinoEditandoId}`,
          dados
        );

        mostrarMensagem(
          "Treino atualizado com sucesso!",
          "sucesso"
        );
      } else {
        await axios.post("http://localhost:8080/treinos", dados);

        mostrarMensagem(
          "Treino cadastrado com sucesso!",
          "sucesso"
          );
      }

      limparFormulario();
      buscarTreinos();
    } catch (error) {
      console.error("Erro ao salvar treino", error);
      mostrarMensagem(
        "Erro ao salvar treino",
        "erro"
      ); 
    }
  }

  function editarTreino(treino) {
    setTreinoEditandoId(treino.id);

    setForm({
      dataTreino: treino.dataTreino,
      tipo: treino.tipo,
      distanciaKm: treino.distanciaKm,
      tempoMinutos: treino.tempoMinutos,
      paceMedio: treino.paceMedio,
      observacoes: treino.observacoes
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deletarTreino(id) {
    const confirmar = window.confirm("Tem certeza que deseja deletar este treino?");

    if (!confirmar) {
    return;
  }
    try {
      await axios.delete(`http://localhost:8080/treinos/${id}`);

      mostrarMensagem(
        "Treino deletado com sucesso!",
        "sucesso"
      );

      buscarTreinos();
    } catch (error) {
      console.error("Erro ao deletar treino", error);
      mostrarMensagem(
        "Erro ao deletar treino",
        "erro"
      );
    }
  }

  function limparFormulario() {
    setTreinoEditandoId(null);

    setForm({
      dataTreino: "",
      tipo: "",
      distanciaKm: "",
      tempoMinutos: "",
      paceMedio: "",
      observacoes: ""
    });
  }

  const totalTreinos = treinos.length;

const totalKm = treinos.reduce(
  (total, treino) => total + treino.distanciaKm,
  0
);

const totalTempo = treinos.reduce(
  (total, treino) => total + treino.tempoMinutos,
  0
);

const treinosFiltrados = treinos.filter((treino) => {
  if (!filtroTipo) return true;

  return treino.tipo.toLowerCase()
    .includes(filtroTipo.toLowerCase());
});

const dadosGrafico = treinos.map((treino) => ({
  nome: treino.tipo,
  distancia: treino.distanciaKm
}));

  return (
    <main className="container">
      <section className="header">
        <h1>🏃 RunPace</h1>
        {/* <p>Gerencie seus treinos de corrida de forma simples e organizada.</p> */}
      </section>

      {mensagem && (
        <div 
          className={
            tipoMensagem === "erro"
            ? "mensagem-erro"
            : "mensagem-sucesso"
          }
        > 
          {mensagem}
        </div>
      )}

      <section className="dashboard">

      <div className="dashboard-card">
        <h3>🏃 Treinos</h3>
        <p>{totalTreinos}</p>
      </div>

      <div className="dashboard-card">
        <h3>📏 Quilometragem</h3>
        <p>{totalKm.toFixed(1)}</p>
      </div>

      <div className="dashboard-card">
        <h3>⏱️ Tempo Total</h3>
        <p>{totalTempo} min</p>
      </div>
      </section>

      <section className="grafico-container">
         <h2>📈 Quilometragem por Tipo de Treino</h2>

         <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={dadosGrafico}
            barCategoryGap="25%"
            >
            <CartesianGrid 
            strokeDasharray="3 3"
            stroke="#334155" 
            />
            <XAxis dataKey="nome"
            stroke="#334155"
             />
            <YAxis
            stroke="#cbd5e1"
            />
            <Tooltip cursor={false}/>

            <Bar 
              dataKey="distancia"
              fill="#38bdf8"
              radius={[8, 8, 0, 0]}
              label={{ position: "top", fill: "#ffffff" }}  
             /> 
          </BarChart>
         </ResponsiveContainer>
      </section>

      <section className="filtro-container">  
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os treinos</option>
          <option value="Rodagem">Rodagem</option>
          <option value="Tiro">Tiro</option>
          <option value="Longão">Longão</option>
          <option value="Regenerativo">Regenerativo</option>
        </select>
      </section>

      <form className="form-treino" onSubmit={salvarTreino}>
        <input
          type="date"
          name="dataTreino"
          value={form.dataTreino}
          onChange={alterarCampo}
        />

        <input
          type="text"
          name="tipo"
          placeholder="Tipo do treino"
          value={form.tipo}
          onChange={alterarCampo}
        />

        <input
          type="number"
          step="0.01"
          name="distanciaKm"
          placeholder="Distância em km"
          value={form.distanciaKm}
          onChange={alterarCampo}
        />

        <input
          type="number"
          name="tempoMinutos"
          placeholder="Tempo em minutos"
          value={form.tempoMinutos}
          onChange={alterarCampo}
        />

        <input
          type="text"
          name="paceMedio"
          placeholder="Pace médio"
          value={form.paceMedio}
          onChange={alterarCampo}
        />

        <textarea
          name="observacoes"
          placeholder="Observações"
          value={form.observacoes}
          onChange={alterarCampo}
        />

        <button type="submit">
          {treinoEditandoId ? "Atualizar treino" : "Cadastrar treino"}
        </button>

        {treinoEditandoId && (
          <button
            type="button"
            className="btn-cancelar"
            onClick={limparFormulario}
          >
            Cancelar edição
          </button>
        )}
      </form>

      <section className="grid-treinos">
        {treinosFiltrados.map((treino) => (
          <article className="card-treino" key={treino.id}>
            <div className="card-topo">
              <h2>{treino.tipo}</h2>
              <span>#{treino.id}</span>
            </div>

            <div className="info-grid">
              <p>
                <strong>📅 Data</strong>
                {new Date(treino.dataTreino).toLocaleDateString("pt-BR")}
              </p>

              <p>
                <strong>📏 Distância</strong>
                {treino.distanciaKm} km
              </p>

              <p>
                <strong>⏱️ Tempo</strong>
                {treino.tempoMinutos} min
              </p>

              <p>
                <strong>⚡ Pace</strong>
                {treino.paceMedio} min/km
              </p>
            </div>

            <p className="observacao">
              📝 {treino.observacoes || "Sem observações"}</p>

            <div className="card-acoes">
              <button
                className="btn-editar"
                onClick={() => editarTreino(treino)}
              >
                Editar
              </button>

              <button
                className="btn-deletar"
                onClick={() => deletarTreino(treino.id)}
              >
                Deletar
              </button>
            </div>
          </article>
        ))}
      </section>
      <footer className="footer">
        <p>
          RunPace © 2026 • Desenvolvido por Kaio Pinheiro
        </p>
      </footer>
    </main>
  );
}

export default App;