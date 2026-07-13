import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

function Navbar({ atualizarToken }) {
  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem("nome");
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
    localStorage.clear();
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
        {nomeUsuario && (
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
              👤 {nomeUsuario}
            </button>

            {menuAberto && (
              <div className="menu-principal-opcoes">
                <NavLink
                  to="/coach-ia"
                  className={({ isActive }) =>
                    isActive ? "menu-ativo menu-coach-ia" : "menu-coach-ia"
                  }
                  onClick={fecharMenu}
                >
                  <span className="menu-link-icone" aria-hidden="true">✦</span>
                  <span>Endurax Coach</span>
                </NavLink>

                <NavLink
                  to="/plano-semanal-ia"
                  className={({ isActive }) =>
                    isActive ? "menu-ativo menu-coach-ia" : "menu-coach-ia"
                  }
                  onClick={fecharMenu}
                >
                  <span className="menu-link-icone" aria-hidden="true">▦</span>
                  <span>Plano Semanal Endurax</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        <button
          className="btn-sair"
          onClick={logout}
        >
          👋 Sair
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
