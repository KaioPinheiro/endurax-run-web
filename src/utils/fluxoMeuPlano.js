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

export function criarRecuperacaoCompra({ pagamentoToken, planoToken, solicitacaoPlanoId, payload }) {
  return {
    pagamento: pagamentoToken ? { acessoToken: pagamentoToken } : null,
    estadoPagamento: planoToken ? "COMPLETED" : pagamentoToken ? "PENDING" : null,
    solicitacaoSemPagamento: !pagamentoToken && !planoToken && Boolean(solicitacaoPlanoId && payload),
    payload
  };
}
