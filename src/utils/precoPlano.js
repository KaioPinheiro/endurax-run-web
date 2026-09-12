export function formatarPrecoPlano(valorPlano) {
  const valorNumerico = Number(valorPlano);
  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) return null;

  return `R$ ${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valorNumerico)}`;
}
