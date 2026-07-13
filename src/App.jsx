import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import MeusTreinos from "./pages/MeusTreinos";
import Calendario from "./pages/Calendario";
import GerarTreinoIA from "./pages/GerarTreinoIA";
import PlanoSemanalIA from "./pages/PlanoSemanalIA";
import Login from "./pages/Login";

import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  function atualizarToken() {
    setToken(localStorage.getItem("token"));
  }

  return (
    <BrowserRouter>
      <main className="container">
        {token && <Navbar atualizarToken={atualizarToken} />}

        <Routes>
          <Route
            path="/"
            element={
              token
                ? <PlanoSemanalIA />
                : <Login atualizarToken={atualizarToken} />
            }
          />

          <Route
            path="/meus-treinos"
            element={
              token
                ? <MeusTreinos />
                : <Login atualizarToken={atualizarToken} />
            }
          />

          <Route
            path="/dashboard"
            element={
              token
                ? <Dashboard />
                : <Login atualizarToken={atualizarToken} />
            }
          />

          <Route
            path="/historico"
            element={
              token
                ? <Historico />
                : <Login atualizarToken={atualizarToken} />
            }
          />

          <Route
            path="/calendario"
            element={
              token
                ? <Calendario />
                : <Login atualizarToken={atualizarToken} />
            }
          />

          <Route
            path="/coach-ia"
            element={
              token
                ? <GerarTreinoIA />
                : <Login atualizarToken={atualizarToken} />
            }
          />

          <Route
            path="/plano-semanal-ia"
            element={
              token
                ? <PlanoSemanalIA />
                : <Login atualizarToken={atualizarToken} />
            }
          />

          <Route
            path="/login"
            element={
              token
                ? <PlanoSemanalIA />
                : <Login atualizarToken={atualizarToken} />
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
