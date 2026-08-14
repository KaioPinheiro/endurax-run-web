export function estadoDoResultado(resultado) {
  if (resultado.pagamentoStatus === "EXPIRED") return "EXPIRED";
  if (["REJECTED", "CANCELLED"].includes(resultado.pagamentoStatus)) return "FAILED";
  if (resultado.geracaoStatus === "FAILED") return "FAILED";
  if (resultado.geracaoStatus === "COMPLETED") return "COMPLETED";
  if (resultado.pagamentoStatus === "APPROVED" || resultado.geracaoStatus === "PROCESSING") {
    return "PROCESSING";
  }
  return "PENDING";
}

export function criarRecuperacaoCompra({ pagamentoId, planoId, solicitacaoPlanoId, payload }) {
  return {
    pagamento: pagamentoId ? { pagamentoId } : null,
    estadoPagamento: planoId ? "COMPLETED" : pagamentoId ? "PENDING" : null,
    solicitacaoSemPagamento: !pagamentoId && Boolean(solicitacaoPlanoId && payload),
    payload
  };
}
