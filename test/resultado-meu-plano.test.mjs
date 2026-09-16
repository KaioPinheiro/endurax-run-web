import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("oculta apenas a descricao de aquecimento e desaquecimento", async () => {
  const { createServer } = await import("vite");
  const servidor = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });

  try {
    const { default: ResultadoMeuPlano } = await servidor.ssrLoadModule(
      "/src/components/plano/ResultadoMeuPlano.jsx"
    );
    const descricao = [
      "Aquecimento: 10 min de trote leve a 6:20-6:40 min/km",
      "Principal: 30 min de corrida confortavel a 5:30-5:50 min/km",
      "Desaquecimento: 10 min de trote suave a 6:30-6:50 min/km"
    ].join(" | ");
    const plano = {
      titulo: "Plano teste",
      objetivoPlano: "Corrida",
      duracaoSemanas: 1,
      semanas: [{
        numeroSemana: 1,
        titulo: "Semana teste",
        treinos: [{
          diaSemana: "Segunda-feira",
          tipo: "Corrida",
          titulo: "Corrida leve",
          descricao,
          duracaoEstimada: "50 min"
        }]
      }]
    };

    const html = renderToStaticMarkup(React.createElement(ResultadoMeuPlano, { plano }));
    assert.doesNotMatch(html, /10 min de trote leve a/);
    assert.doesNotMatch(html, /10 min de trote suave a/);
    assert.match(html, /30 min de corrida confortavel a 5:30-5:50 min\/km/);
    assert.match(html, /<strong>Aquecimento<\/strong>/);
    assert.match(html, /<strong>Desaquecimento<\/strong>/);
    assert.match(html, /<span>10 min<\/span>/);
    assert.match(html, /<small>~1,5 km<\/small>/);
    assert.match(html, /Pace: 6:20-6:40 min\/km/);
    assert.match(html, /Pace: 6:30-6:50 min\/km/);
  } finally {
    await servidor.close();
  }
});

test("oferece ações no topo e impressão com todas as semanas", async () => {
  const [resultado, pagina, estilos] = await Promise.all([
    readFile(new URL("../src/components/plano/ResultadoMeuPlano.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/MeuPlano.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/PlanoSemanalIA.css", import.meta.url), "utf8")
  ]);

  assert.match(pagina, /onClick=\{\(\) => window\.print\(\)\}/);
  assert.match(pagina, /onClick=\{iniciarNovoPlano\}/);
  assert.equal((pagina.match(/Baixar PDF/g) || []).length, 1);
  assert.equal((pagina.match(/Gerar novo plano/g) || []).length, 1);
  assert.ok(pagina.indexOf("Baixar PDF") < pagina.indexOf("<ResultadoMeuPlano"));
  assert.doesNotMatch(resultado, /Baixar PDF|Gerar novo plano/);
  assert.match(resultado, /plano-ia-semanas-impressao/);
  assert.match(resultado, /const distanciaEstimada = bloco\.distancia[\s\S]*\? ""[\s\S]*estimarDistanciaBloco/);
  assert.match(resultado, /distanciaEstimada && <small>/);
  assert.doesNotMatch(resultado, /<dt>Distância<\/dt>/);
  assert.match(resultado, /<dt>Duração<\/dt>/);
  assert.match(resultado, /<dt>Pace<\/dt>/);
  assert.match(estilos, /\.plano-ia-card dl \{[\s\S]*grid-template-columns: repeat\(2,/);
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
