import { Link } from "react-router-dom";
import logoEndurax from "../assets/brand/endurax-run-logo.svg";
import "./PoliticaPrivacidade.css";

const secoes = [
  {
    titulo: "Dados que podemos coletar",
    conteudo: (
      <>
        <p>Podemos coletar os dados que você informa ao usar o Endurax Run, como nome, e-mail, objetivo esportivo, nível de experiência, rotina, disponibilidade e informações necessárias para criar e acompanhar seu plano de treinos.</p>
        <p>Também podemos registrar dados técnicos básicos, como endereço IP, tipo de dispositivo, navegador e informações de uso, para manter o serviço seguro e melhorar seu funcionamento.</p>
      </>
    ),
  },
  {
    titulo: "Uso das informações",
    conteudo: <p>Usamos as informações para fornecer e personalizar os serviços, criar planos de treino, processar solicitações, prestar suporte, comunicar informações importantes, prevenir fraudes e aprimorar a experiência no Endurax Run.</p>,
  },
  {
    titulo: "Integrações com serviços de terceiros",
    conteudo: <p>Você poderá autorizar a conexão do Endurax Run com plataformas, aplicativos ou dispositivos de terceiros. Nesses casos, trataremos somente os dados necessários às permissões que você conceder. Você poderá gerenciar ou revogar essas permissões diretamente no serviço de terceiro correspondente, conforme os recursos disponibilizados por ele.</p>,
  },
  {
    titulo: "Pagamentos",
    conteudo: <p>Os pagamentos são processados por provedores especializados. O Endurax Run poderá receber e armazenar informações necessárias para identificar a transação e confirmar seu status, mas não armazena os dados completos do seu cartão ou credenciais bancárias.</p>,
  },
  {
    titulo: "Compartilhamento de dados",
    conteudo: <p>Não vendemos seus dados pessoais. Podemos compartilhar informações apenas com fornecedores necessários à operação do serviço, quando exigido por lei ou para proteger direitos, segurança e integridade do Endurax Run e de seus usuários.</p>,
  },
  {
    titulo: "Segurança",
    conteudo: <p>Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso, alteração, divulgação ou destruição não autorizados. Nenhum sistema é totalmente imune a riscos, mas revisamos continuamente nossas práticas de segurança.</p>,
  },
  {
    titulo: "Seus direitos",
    conteudo: <p>Você pode solicitar confirmação do tratamento, acesso, correção, atualização, anonimização ou exclusão dos seus dados, quando aplicável. Também pode pedir informações sobre o compartilhamento e revogar consentimentos anteriormente concedidos.</p>,
  },
  {
    titulo: "Alterações nesta política",
    conteudo: <p>Esta política poderá ser atualizada para refletir mudanças no serviço ou em requisitos legais. Quando isso acontecer, publicaremos a versão revisada nesta página e atualizaremos a data informada no início do documento.</p>,
  },
  {
    titulo: "Contato",
    conteudo: <p>Para dúvidas ou solicitações relacionadas à privacidade, entre em contato pelo e-mail <a href="mailto:enduraxrun@hotmail.com">enduraxrun@hotmail.com</a>.</p>,
  },
];

function PoliticaPrivacidade() {
  return (
    <div className="politica-page">
      <header className="politica-header">
        <Link to="/" aria-label="Endurax Run — início">
          <img src={logoEndurax} alt="Endurax Run" />
        </Link>
      </header>

      <main className="politica-conteudo">
        <div className="politica-introducao">
          <span>PRIVACIDADE E TRANSPARÊNCIA</span>
          <h1>Política de Privacidade</h1>
          <p className="politica-atualizacao">Última atualização: 05 de outubro de 2026.</p>
          <p>Esta Política de Privacidade explica, de forma clara e objetiva, como o Endurax Run trata as informações relacionadas ao uso de seus serviços.</p>
        </div>

        <article className="politica-card">
          {secoes.map((secao) => (
            <section key={secao.titulo}>
              <h2>{secao.titulo}</h2>
              {secao.conteudo}
            </section>
          ))}
        </article>

        <Link className="politica-voltar" to="/">
          <span aria-hidden="true">←</span>
          Voltar ao início
        </Link>
      </main>
    </div>
  );
}

export default PoliticaPrivacidade;
