import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("oferece impressão com todas as semanas e oculta os controles", async () => {
  const [resultado, estilos] = await Promise.all([
    readFile(new URL("../src/components/plano/ResultadoMeuPlano.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/PlanoSemanalIA.css", import.meta.url), "utf8")
  ]);

  assert.match(resultado, /onClick=\{\(\) => window\.print\(\)\}/);
  assert.match(resultado, /onClick=\{onGerarNovamente\}/);
  assert.match(resultado, /Gerar novo plano/);
  assert.match(resultado, /plano-ia-semanas-impressao/);
  assert.match(resultado, /const distanciaEstimada = bloco\.distancia[\s\S]*\? ""[\s\S]*estimarDistanciaBloco/);
  assert.match(resultado, /distanciaEstimada && <small>/);
  assert.match(resultado, /semanas\.map\(\(semana\) =>/);
  assert.match(resultado, /endurax-run-logo-light\.svg/);
  assert.match(resultado, /plano-ia-capa/);
  assert.match(estilos, /@media print/);
  assert.match(estilos, /\.navbar,[\s\S]*\.coach-ia-hero \{[\s\S]*display: none/);
  assert.match(estilos, /\.plano-ia-capa \{[\s\S]*break-after: page/);
  assert.doesNotMatch(estilos, /\.plano-ia-semana:first-child/);
  assert.match(estilos, /\.plano-ia-semana \+ \.plano-ia-semana \{[\s\S]*break-before: page/);
  assert.match(
    estilos,
    /\.plano-ia-semanas-tabs,[\s\S]*\.plano-ia-acoes[\s\S]*display: none/
  );
});
