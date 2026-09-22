export default function PrecoPlanoLanding({ preco, className = "" }) {
  if (!preco) return null;

  return (
    <div className={`landing-preco ${className}`}>
      <s className="landing-preco__original" aria-label="Preço de referência: R$ 99,90">R$ 99,90</s>
      <strong className="landing-preco__linha">{preco} por plano · pagamento único · sem assinatura</strong>
    </div>
  );
}
