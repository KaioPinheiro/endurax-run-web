import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="pagina-nao-encontrada">
      <span>ERRO 404</span>
      <h1>Página não encontrada.</h1>
      <p>O endereço informado não existe ou foi removido.</p>
      <Link to="/">Voltar para o início</Link>
    </main>
  );
}

export default NotFound;
