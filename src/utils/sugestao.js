export const LIMITE_SUGESTAO = 1500;
export const FORMSPREE_SUGESTAO_URL = "https://formspree.io/f/xkjnyjzj";

export async function enviarSugestaoFormspree(sugestao, fetchImpl = fetch) {
  const texto = String(sugestao ?? "").trim();
  if (!texto || texto.length > LIMITE_SUGESTAO) {
    throw new Error("Sugestão inválida.");
  }

  const response = await fetchImpl(FORMSPREE_SUGESTAO_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: texto })
  });

  if (!response.ok) {
    throw new Error("Falha ao enviar sugestão.");
  }
}
