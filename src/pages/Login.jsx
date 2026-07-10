import { useState } from "react";
import { criarUsuario, login } from "../services/api";
import { useNavigate } from "react-router-dom";

function Login({ atualizarToken }) {
  const [modo, setModo] = useState("login");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [form, setForm] = useState({
    email: "",
    senha: ""
  });

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [cadastrando, setCadastrando] = useState(false);
  const [cadastro, setCadastro] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: ""
  });

  const navigate = useNavigate();

  function alterarCampo(event) {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  }

  function alterarCadastro(event) {
    const { name, value } = event.target;
    setCadastro((atual) => ({ ...atual, [name]: value }));
  }

  function trocarModo(novoModo) {
    setModo(novoModo);
    setErro("");
    setSucesso("");
    setMostrarSenha(false);
  }

  async function fazerLogin(event) {
    event.preventDefault();

    try {
      const dados = await login(form);

      localStorage.setItem("token", dados.token);
      localStorage.setItem("userId", dados.userId);
      localStorage.setItem("nome", dados.nome);
      localStorage.setItem("role", dados.role);

      atualizarToken();
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer login", error);
      setErro("E-mail ou senha inválidos.");
    }
  }

  async function fazerCadastro(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (cadastro.senha !== cadastro.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCadastrando(true);
    try {
      await criarUsuario({
        nome: cadastro.nome,
        email: cadastro.email,
        senha: cadastro.senha,
        role: "USER"
      });

      setForm({ email: cadastro.email, senha: "" });
      setCadastro({ nome: "", email: "", senha: "", confirmarSenha: "" });
      setModo("login");
      setSucesso("Conta criada com sucesso. Agora você já pode entrar.");
      setMostrarSenha(false);
    } catch (error) {
      const resposta = error.response?.data;
      setErro(
        resposta?.erro ||
        (resposta && Object.values(resposta)[0]) ||
        "Não foi possível criar sua conta. Verifique os dados e tente novamente."
      );
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <section className="login-container">
      <div className="login-decoracao login-decoracao-superior" aria-hidden="true" />
      <div className="login-decoracao login-decoracao-inferior" aria-hidden="true" />
      <svg
        className="login-topografia"
        viewBox="0 0 720 720"
        fill="none"
        aria-hidden="true"
      >
        <path d="M-40 118C86 30 209 40 300 121s188 109 310 35 224-24 248 55" />
        <path d="M-57 172C69 84 194 93 286 176s191 109 314 33 218-26 250 46" />
        <path d="M-69 228C61 140 186 148 279 230s193 107 316 30 210-30 249 35" />
        <path d="M-76 287C50 202 174 208 270 287s197 101 319 23 202-34 246 23" />
        <path d="M-79 349C42 269 168 270 263 349s198 96 320 18 196-38 248 13" />
      </svg>

      <div className="login-layout">
        <div className="login-marca">
          <div className="login-logo-textual" aria-label="Endurax Run">
            <span>ENDURAX</span>
            <strong>RUN</strong>
          </div>

          <div className="login-marca-texto">
            <span className="login-eyebrow">SEU RITMO. SUA EVOLUÇÃO.</span>
            <h1>Endurax Run</h1>
            <p className="login-slogan">Seu ritmo. Sua evolução. Seu melhor.</p>
          </div>

          <ul className="login-beneficios">
            <li>
              <span aria-hidden="true">✓</span>
              Planos de treino personalizados
            </li>
            <li>
              <span aria-hidden="true">✓</span>
              Acompanhe sua evolução
            </li>
            <li>
              <span aria-hidden="true">✓</span>
              Organize sua rotina de corrida
            </li>
          </ul>

          <div className="login-estatisticas" aria-label="Estatísticas do Endurax Run">
            <div>
              <strong>15+</strong>
              <span>Tipos de treino</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Progresso acompanhado</span>
            </div>
            <div>
              <strong>24h</strong>
              <span>Acesso ao histórico</span>
            </div>
          </div>
        </div>

        <div className="login-card-area">
          <div className="login-card">
            <div className="login-modos" role="tablist" aria-label="Acesso à conta">
              <button
                className={modo === "login" ? "login-modo-ativo" : ""}
                type="button"
                role="tab"
                aria-selected={modo === "login"}
                onClick={() => trocarModo("login")}
              >
                Entrar
              </button>
              <button
                className={modo === "cadastro" ? "login-modo-ativo" : ""}
                type="button"
                role="tab"
                aria-selected={modo === "cadastro"}
                onClick={() => trocarModo("cadastro")}
              >
                Criar conta
              </button>
            </div>

            <div className="login-card-cabecalho">
              <span className="login-card-etiqueta">
                {modo === "login" ? "ÁREA DO ATLETA" : "NOVO ATLETA"}
              </span>
              <h2>{modo === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h2>
              <p>
                {modo === "login"
                  ? "Acesse sua conta e continue avançando."
                  : "Comece agora a organizar sua evolução."}
              </p>
            </div>

            {sucesso && <p className="login-mensagem-sucesso">{sucesso}</p>}
            {erro && <p className="login-mensagem-erro">{erro}</p>}

            {modo === "login" ? (
              <form className="login-form" onSubmit={fazerLogin}>
                <div className="login-campo">
                  <label htmlFor="login-email">E-mail</label>
                  <div className="login-input-wrapper">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
                    </svg>
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      placeholder="seu@email.com"
                      value={form.email}
                      onChange={alterarCampo}
                      required
                    />
                  </div>
                </div>

                <div className="login-campo">
                  <label htmlFor="login-senha">Senha</label>
                  <div className="login-input-wrapper">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                    <input
                      id="login-senha"
                      type={mostrarSenha ? "text" : "password"}
                      name="senha"
                      placeholder="Digite sua senha"
                      value={form.senha}
                      onChange={alterarCampo}
                      required
                    />
                  </div>
                </div>

                <button
                  className="login-mostrar-senha"
                  type="button"
                  aria-pressed={mostrarSenha}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  <span className="login-toggle" aria-hidden="true">
                    <span />
                  </span>
                  {mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                </button>

                <button className="login-botao-principal" type="submit">
                  Entrar no Endurax Run
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={fazerCadastro}>
                <div className="login-campo">
                  <label htmlFor="cadastro-nome">Nome</label>
                  <div className="login-input-wrapper">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 20a7 7 0 0 1 14 0" />
                    </svg>
                    <input
                      id="cadastro-nome"
                      type="text"
                      name="nome"
                      placeholder="Seu nome"
                      value={cadastro.nome}
                      onChange={alterarCadastro}
                      required
                    />
                  </div>
                </div>

                <div className="login-campo">
                  <label htmlFor="cadastro-email">E-mail</label>
                  <div className="login-input-wrapper">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
                    </svg>
                    <input
                      id="cadastro-email"
                      type="email"
                      name="email"
                      placeholder="seu@email.com"
                      value={cadastro.email}
                      onChange={alterarCadastro}
                      required
                    />
                  </div>
                </div>

                <div className="login-campo">
                  <label htmlFor="cadastro-senha">Senha</label>
                  <div className="login-input-wrapper">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                    <input
                      id="cadastro-senha"
                      type={mostrarSenha ? "text" : "password"}
                      name="senha"
                      placeholder="Crie uma senha"
                      value={cadastro.senha}
                      onChange={alterarCadastro}
                      required
                    />
                  </div>
                </div>

                <div className="login-campo">
                  <label htmlFor="cadastro-confirmar-senha">Confirmar senha</label>
                  <div className="login-input-wrapper">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                    <input
                      id="cadastro-confirmar-senha"
                      type={mostrarSenha ? "text" : "password"}
                      name="confirmarSenha"
                      placeholder="Digite a senha novamente"
                      value={cadastro.confirmarSenha}
                      onChange={alterarCadastro}
                      required
                    />
                  </div>
                </div>

                <button
                  className="login-mostrar-senha"
                  type="button"
                  aria-pressed={mostrarSenha}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  <span className="login-toggle" aria-hidden="true">
                    <span />
                  </span>
                  {mostrarSenha ? "Ocultar senhas" : "Mostrar senhas"}
                </button>

                <button
                  className="login-botao-principal"
                  type="submit"
                  disabled={cadastrando}
                >
                  {cadastrando ? "Criando sua conta..." : "Criar minha conta"}
                  {!cadastrando && <span aria-hidden="true">→</span>}
                </button>
              </form>
            )}

            <p className="login-card-rodape">
              {modo === "login"
                ? "Consistência transforma esforço em resultado."
                : "Seu próximo ritmo começa aqui."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
