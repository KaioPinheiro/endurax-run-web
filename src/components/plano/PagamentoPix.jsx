import { useEffect, useMemo, useState } from "react";

function formatarTempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const restante = segundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(restante).padStart(2, "0")}`;
}

function PagamentoPix({
  pagamento,
  estado,
  mensagem,
  onTentarNovamente,
  onGerarNovo,
  onCancelarPagamento
}) {
  const [copiado, setCopiado] = useState(false);
  const [modalCancelamentoAberto, setModalCancelamentoAberto] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const expiracao = pagamento?.dataExpiracao || pagamento?.expirationDate;
  const copiaCola = pagamento?.pixCopiaCola || pagamento?.copiaCola || pagamento?.qrCode || "";
  const qrCodeBase64 = pagamento?.qrCodeBase64;

  useEffect(() => {
    if (!expiracao) return undefined;
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, [expiracao]);

  const segundosRestantes = useMemo(() => {
    if (!expiracao) return null;
    return Math.max(0, Math.ceil((new Date(expiracao).getTime() - agora) / 1000));
  }, [agora, expiracao]);

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

      <strong className="pix-valor">R$ 12,90</strong>
      {segundosRestantes !== null && estado === "PENDING" && (
        <p className="pix-expiracao">Expira em {formatarTempo(segundosRestantes)}</p>
      )}

      <p className={`pix-status pix-status-${estado.toLowerCase()}`}>
        {aguardando && <span className="coach-ia-spinner" aria-hidden="true" />}
        {mensagem}
      </p>
      {estado === "PENDING" && (
        <button
          className="pix-cancelar-pagamento"
          type="button"
          onClick={() => setModalCancelamentoAberto(true)}
        >
          Cancelar pagamento
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
      {estado === "EXPIRED" && (
        <button className="coach-ia-submit" type="button" onClick={onGerarNovo}>
          Gerar novo QR Code
        </button>
      )}

      {modalCancelamentoAberto && (
        <div
          className="pix-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalCancelamentoAberto(false);
          }}
        >
          <section
            className="pix-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pix-modal-titulo"
            aria-describedby="pix-modal-descricao"
          >
            <h3 id="pix-modal-titulo">Cancelar pagamento?</h3>
            <div id="pix-modal-descricao">
              <p>Você realmente deseja cancelar este pagamento?</p>
              <p>
                O QR Code atual será descartado e você retornará ao formulário para
                gerar um novo pagamento quando desejar.
              </p>
              <p className="pix-modal-observacao">
                <strong>Observação:</strong> Caso o pagamento seja realizado posteriormente
                utilizando este QR Code, ele continuará sendo processado normalmente pelo sistema.
              </p>
            </div>
            <div className="pix-modal-acoes">
              <button type="button" onClick={() => setModalCancelamentoAberto(false)}>
                Cancelar
              </button>
              <button
                className="pix-modal-confirmar"
                type="button"
                onClick={() => {
                  setModalCancelamentoAberto(false);
                  onCancelarPagamento();
                }}
              >
                Confirmar cancelamento
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default PagamentoPix;
