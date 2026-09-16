import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import MeusTreinos from "./pages/MeusTreinos";
import Calendario from "./pages/Calendario";
import GerarTreinoIA from "./pages/GerarTreinoIA";
import MeuPlano from "./pages/MeuPlano";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import { carregarUmami } from "./utils/analytics";

import "./App.css";

function AppRoutes() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const location = useLocation();

  function atualizarToken() {
    setToken(localStorage.getItem("token"));
  }

  return (
    <div className={location.pathname === "/" ? "landing-root" : "container"}>
        {location.pathname !== "/" && <Navbar atualizarToken={atualizarToken} />}

        <Routes>
          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route
            path="/meu-plano"
            element={<MeuPlano />}
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
            element={<Navigate to="/meu-plano" replace />}
          />

          <Route
            path="/login"
            element={<Login atualizarToken={atualizarToken} />}
          />
        </Routes>
    </div>
  );
}

function App() {
  useEffect(() => {
    carregarUmami();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
