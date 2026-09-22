// Posições alcançáveis: o último grupo nunca tenta rolar além do conteúdo.
export function posicoesCarrossel(inicios, larguraConteudo, larguraVisivel) {
  const maximo = Math.max(0, larguraConteudo - larguraVisivel);
  return inicios.reduce((posicoes, inicio) => {
    const posicao = Math.min(maximo, Math.max(0, inicio));
    if (!posicoes.length || Math.abs(posicao - posicoes.at(-1)) > 1) {
      posicoes.push(posicao);
    }
    return posicoes;
  }, []);
}

export function indiceCarrossel(posicoes, scrollLeft) {
  return posicoes.reduce((melhor, posicao, indice) => (
    Math.abs(posicao - scrollLeft) < Math.abs(posicoes[melhor] - scrollLeft)
      ? indice : melhor
  ), 0);
}

export function indiceCircular(indice, total) {
  return ((indice % total) + total) % total;
}

// Três ciclos idênticos permitem atravessar as bordas sem voltar visualmente.
export function posicaoCentralCarrossel(indiceFisico, total) {
  return total + indiceCircular(indiceFisico - total, total);
}
