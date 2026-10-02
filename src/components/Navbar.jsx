import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

function Navbar({ atualizarToken }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const nomeUsuario = localStorage.getItem("nome");
  const usuarioAutenticado = Boolean(token && nomeUsuario);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function fecharMenuAoClicarFora(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharMenuAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharMenuAoClicarFora);
    };
  }, []);

  function logout() {
    ["token", "userId", "nome", "role"].forEach((chave) =>
      localStorage.removeItem(chave)
    );
    atualizarToken();
    navigate("/login");
  }

  function alternarMenu() {
    setMenuAberto((aberto) => !aberto);
  }

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <span className="logo-marca">ENDURAX</span>
        <span className="logo-marca-destaque">RUN</span>
      </Link>

      <div className="navbar-links">
        {usuarioAutenticado && (
          <>
            <div
              className={`menu-principal menu-usuario ${
                menuAberto ? "menu-principal-aberto" : ""
              }`}
              ref={menuRef}
            >
              <button
                className="usuario-logado usuario-menu-botao"
                type="button"
                title={nomeUsuario}
                onClick={alternarMenu}
                aria-expanded={menuAberto}
              >
                {nomeUsuario}
              </button>

              {menuAberto && (
                <div className="menu-principal-opcoes">
                  <NavLink
                    to="/meu-plano"
                    className={({ isActive }) =>
                      isActive ? "menu-ativo menu-coach-ia" : "menu-coach-ia"
                    }
                    onClick={fecharMenu}
                  >
                    <span className="menu-link-icone" aria-hidden="true">▦</span>
                    <span>Meu Plano</span>
                  </NavLink>
                </div>
              )}
            </div>

            <button
              className="btn-sair"
              onClick={logout}
            >
              Sair
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
