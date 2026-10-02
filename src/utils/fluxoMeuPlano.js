export const CHAVES_FLUXO_MEU_PLANO = {
  pagamentoToken: "pagamentoToken",
  pagamentoMeuPlano: "pagamentoMeuPlano",
  planoToken: "planoToken",
  solicitacaoPlanoId: "solicitacaoPlanoId",
  payloadMeuPlano: "payloadMeuPlano",
  formularioMeuPlano: "formularioMeuPlano"
};

export const ULTIMO_PLANO_TOKEN_KEY = "ultimoPlanoToken";
export const ULTIMO_PLANO_LOCAL_KEY = "ultimoPlanoDesenvolvimento";

export function lerUltimoPlanoLocal(storage) {
  try {
    const plano = JSON.parse(storage.getItem(ULTIMO_PLANO_LOCAL_KEY));
    return plano && Array.isArray(plano.semanas) ? plano : null;
  } catch {
    return null;
  }
}

export function salvarUltimoPlanoLocal(storage, plano) {
  try {
    storage.setItem(ULTIMO_PLANO_LOCAL_KEY, JSON.stringify(plano));
  } catch {
    // Falha de armazenamento não impede a exibição do plano gerado.
  }
}

export function lerPagamentoPersistido(storage, pagamentoToken) {
  if (!pagamentoToken) return null;
  try {
    const pagamento = JSON.parse(
      storage.getItem(CHAVES_FLUXO_MEU_PLANO.pagamentoMeuPlano)
    );
    return pagamento?.acessoToken === pagamentoToken ? pagamento : null;
  } catch {
    return null;
  }
}

export function salvarPagamentoPersistido(storage, pagamento) {
  if (!pagamento?.acessoToken) return;
  try {
    storage.setItem(
      CHAVES_FLUXO_MEU_PLANO.pagamentoMeuPlano,
      JSON.stringify(pagamento)
    );
  } catch {
    // O polling continua funcionando mesmo se o navegador negar armazenamento.
  }
}

export function limparFluxoComercialMeuPlano(storage) {
  Object.values(CHAVES_FLUXO_MEU_PLANO).forEach((chave) => storage.removeItem(chave));
}

export function iniciarNovaJornadaMeuPlano(storage) {
  const planoToken = storage.getItem(CHAVES_FLUXO_MEU_PLANO.planoToken);
  if (planoToken) storage.setItem(ULTIMO_PLANO_TOKEN_KEY, planoToken);
  limparFluxoComercialMeuPlano(storage);
}

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

export function criarRecuperacaoCompra({
  pagamentoToken,
  pagamentoPersistido,
  planoToken,
  solicitacaoPlanoId,
  payload
}) {
  return {
    pagamento: pagamentoToken
      ? pagamentoPersistido || { acessoToken: pagamentoToken }
      : null,
    estadoPagamento: planoToken ? "COMPLETED" : pagamentoToken ? "PENDING" : null,
    solicitacaoSemPagamento: !pagamentoToken && !planoToken && Boolean(solicitacaoPlanoId && payload),
    payload
  };
}
