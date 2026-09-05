import { useMemo, useState } from "react";

function formatarHorarioExpiracao(expiracao) {
  if (!expiracao) return null;
  const data = new Date(expiracao);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function PagamentoPix({
  pagamento,
  estado,
  mensagem,
  onTentarNovamente,
  onBuscarPlano,
  onGerarNovo,
  onEditarDados,
  cancelando = false,
  sincronizado = false
}) {
  const [copiado, setCopiado] = useState(false);
  const [confirmandoEdicao, setConfirmandoEdicao] = useState(false);
  const expiracao = pagamento?.dataExpiracao || pagamento?.expirationDate;
  const horarioExpiracao = formatarHorarioExpiracao(expiracao);
  const copiaCola = pagamento?.pixCopiaCola || pagamento?.copiaCola || pagamento?.qrCode || "";
  const qrCodeBase64 = pagamento?.qrCodeBase64;
  const ticketUrl = pagamento?.ticketUrl;
  const valorFormatado = useMemo(() => {
    const valor = Number(pagamento?.valor);
    return Number.isFinite(valor)
      ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : null;
  }, [pagamento?.valor]);

  async function copiar() {
    if (!copiaCola) return;
    await navigator.clipboard.writeText(copiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const aguardando = estado === "PENDING" || estado === "PROCESSING";

  return (
    <section className="pix-card" aria-live="polite">
      <header>
        <span>PAGAMENTO PIX</span>
        <h2>Finalize seu pagamento</h2>
      </header>

      {qrCodeBase64 && estado === "PENDING" && (
        <img
          className="pix-qrcode"
          src={qrCodeBase64.startsWith("data:") ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code para pagamento via Pix"
        />
      )}

      {copiaCola && estado === "PENDING" && (
        <div className="pix-copia-cola">
          <label htmlFor="pix-codigo">Pix Copia e Cola</label>
          <div>
            <textarea id="pix-codigo" value={copiaCola} readOnly rows="3" />
            <button type="button" onClick={copiar}>{copiado ? "Copiado!" : "Copiar"}</button>
          </div>
          <button className="pix-copiar-principal" type="button" onClick={copiar}>
            {copiado ? "Copiado!" : "Copiar código Pix"}
          </button>
        </div>
      )}

      {valorFormatado && <strong className="pix-valor">{valorFormatado}</strong>}
      {horarioExpiracao && estado === "PENDING" && (
        <p className="pix-expiracao">Expira às {horarioExpiracao}</p>
      )}

      <p className={`pix-status pix-status-${estado.toLowerCase()}`}>
        {aguardando && <span className="coach-ia-spinner" aria-hidden="true" />}
        {mensagem}
      </p>
      {estado === "PENDING" && (
        <button type="button" onClick={() => setConfirmandoEdicao(true)} disabled={cancelando}>
          Editar dados
        </button>
      )}
      <p className="pix-informacao">
        Após a confirmação do pagamento seu plano será gerado automaticamente.
      </p>

      {estado === "FAILED" && (
        <button className="coach-ia-submit" type="button" onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      )}
      {estado === "COMPLETED" && (
        <button className="coach-ia-submit" type="button" onClick={onBuscarPlano}>
          Buscar meu plano
        </button>
      )}
      {estado === "EXPIRED" && (
        <button className="coach-ia-submit" type="button" onClick={onGerarNovo}>
          Gerar novo QR Code
        </button>
      )}
      {/* Só oferece nova cobrança depois que o backend confirmou que esta cobrança está
          mesmo sem dados de Pix. Durante a reidratação após F5 os dados ainda não
          chegaram, e criar cobrança nova aqui geraria cobrança duplicada. */}
      {estado === "PENDING" && sincronizado && !qrCodeBase64 && !copiaCola && (
        <>
          {ticketUrl && <a href={ticketUrl} target="_blank" rel="noreferrer">Abrir Pix</a>}
          <button className="coach-ia-submit" type="button" onClick={onGerarNovo}>
            Gerar novo QR Code
          </button>
        </>
      )}

      {confirmandoEdicao && (
        <div
          className="pix-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmandoEdicao(false);
          }}
        >
          <section
            className="pix-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pix-modal-titulo"
            aria-describedby="pix-modal-descricao"
          >
            <h3 id="pix-modal-titulo">Editar os dados do plano?</h3>
            <div id="pix-modal-descricao">
              <p>
                Este Pix será cancelado e não poderá mais ser pago.
              </p>
              <p>Seus dados preenchidos serão preservados.</p>
            </div>
            <div className="pix-modal-acoes">
              <button type="button" onClick={() => setConfirmandoEdicao(false)} disabled={cancelando}>
                Voltar
              </button>
              <button
                className="pix-modal-confirmar"
                type="button"
                disabled={cancelando}
                onClick={() => {
                  setConfirmandoEdicao(false);
                  onEditarDados();
                }}
              >
                Cancelar Pix e editar
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default PagamentoPix;
