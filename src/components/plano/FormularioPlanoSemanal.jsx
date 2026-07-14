import {
  DIAS_SEMANA,
  DISTANCIAS_ALVO,
  DISTANCIAS_PROVA,
  EXPERIENCIAS_CORRIDA,
  IMPORTANCIAS_PROVA,
  OBJETIVOS_PLANO,
  OBJETIVOS_PROVA,
  RITMOS_CONFORTAVEIS,
  VOLUMES_SEMANAIS
} from "../../constants/planoTreino";

function OpcoesSelect({ opcoes }) {
  return opcoes.map((opcao) => (
    <option value={opcao} key={opcao}>
      {opcao}
    </option>
  ));
}

function FormularioPlanoSemanal({
  form,
  erro,
  sucesso,
  carregando,
  mensagemLoading,
  onAlterar,
  onAlternarDia,
  onSubmit,
  setErro,
  setForm
}) {
  return (
    <form className="coach-ia-form plano-ia-form" onSubmit={onSubmit}>
      <div className="coach-ia-form-titulo">
        <div><h2>Configure sua semana</h2></div>
        <p>O Coach distribuirá os estímulos de segunda a domingo.</p>
      </div>

      <div className="coach-ia-campos plano-ia-campos">
        <label className="coach-ia-campo">
          <span>Objetivo *</span>
          <select name="objetivo" value={form.objetivo} onChange={onAlterar} required>
            <option value="">Selecione</option>
            <OpcoesSelect opcoes={OBJETIVOS_PLANO} />
          </select>
        </label>
        {form.objetivo === "Outro" && (
          <label className="coach-ia-campo">
            <span>Objetivo personalizado *</span>
            <input
              name="objetivoPersonalizado"
              value={form.objetivoPersonalizado}
              onChange={onAlterar}
              placeholder="Ex.: Correr 7 km, completar uma ultramaratona, melhorar meu tempo nos 15 km, correr 30 km em trilha, etc."
              required
            />
          </label>
        )}
        <label className="coach-ia-campo">
          <span>Idade *</span>
          <input type="number" name="idade" value={form.idade}
            onChange={(event) => {
              const valor = event.target.value;
              if (valor === "" || /^\d+$/.test(valor)) {
                if (valor === "" || Number(valor) <= 100) {
                  onAlterar(event);
                } else {
                  setErro("A idade máxima permitida é 100 anos.");
                }
              }
            }}
            onBlur={() => {
              if (form.idade !== "" && Number(form.idade) < 18) {
                setForm((atual) => ({ ...atual, idade: "" }));
                setErro("A idade mínima permitida é 18 anos.");
              }
            }}
            onKeyDown={(event) => {
              if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                event.preventDefault();
                setErro("A idade deve ser informada somente com números inteiros.");
              }
            }}
            min="18" max="100" step="1"
            onInvalid={(event) => {
              event.preventDefault();
              setErro("Informe uma idade inteira entre 18 e 100 anos.");
            }}
            placeholder="Ex.: 30" required />
        </label>
        <label className="coach-ia-campo">
          <span>Experiência na corrida *</span>
          <select name="experienciaCorrida" value={form.experienciaCorrida}
            onChange={onAlterar} required>
            <option value="">Há quanto tempo você corre?</option>
            <OpcoesSelect opcoes={EXPERIENCIAS_CORRIDA} />
          </select>
        </label>
        <label className="coach-ia-campo">
          <span>Volume semanal atual *</span>
          <select name="volumeSemanalAtual" value={form.volumeSemanalAtual}
            onChange={onAlterar} required>
            <option value="">Quantos km você corre por semana?</option>
            <OpcoesSelect opcoes={VOLUMES_SEMANAIS} />
          </select>
        </label>
        <label className="coach-ia-campo">
          <span>Ritmo confortável atual *</span>
          <select name="ritmoConfortavel" value={form.ritmoConfortavel}
            onChange={onAlterar} required>
            <option value="">Qual é seu ritmo confortável atual?</option>
            <OpcoesSelect opcoes={RITMOS_CONFORTAVEIS} />
          </select>
        </label>
        <label className="coach-ia-campo">
          <span>Distância alvo *</span>
          <select name="distanciaAlvo" value={form.distanciaAlvo}
            onChange={onAlterar} required>
            <option value="">Selecione a distância alvo</option>
            <OpcoesSelect opcoes={DISTANCIAS_ALVO} />
          </select>
        </label>
        {form.distanciaAlvo === "Outro" && (
          <label className="coach-ia-campo">
            <span>Informe a distância alvo *</span>
            <input name="outraDistanciaAlvo" value={form.outraDistanciaAlvo}
              onChange={onAlterar} placeholder="Ex.: 8 km, 12 km, 30 km"
              onInvalid={(event) => {
                event.preventDefault();
                setErro("Informe a distância alvo desejada.");
              }}
              required />
          </label>
        )}
        <fieldset className="coach-ia-dias">
          <legend>Dias disponíveis para treinar *</legend>
          <div>
            {DIAS_SEMANA.map((dia) => {
              const selecionado = form.diasDisponiveis.includes(dia.valor);

              return (
                <button
                  className={selecionado ? "coach-ia-dia-selecionado" : ""}
                  type="button"
                  key={dia.valor}
                  aria-pressed={selecionado}
                  onClick={() => onAlternarDia(dia.valor)}
                >
                  {dia.sigla}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="coach-ia-radio-grupo">
          <legend>Possui uma prova marcada? *</legend>
          <div>
            <label>
              <input type="radio" name="possuiProva" value="sim"
                checked={form.possuiProva === "sim"} onChange={onAlterar} required />
              <span>Sim</span>
            </label>
            <label>
              <input type="radio" name="possuiProva" value="nao"
                checked={form.possuiProva === "nao"} onChange={onAlterar} required />
              <span>Não</span>
            </label>
          </div>
        </fieldset>
        {form.possuiProva === "sim" && (
          <>
            <label className="coach-ia-campo">
              <span>Data da prova *</span>
              <input type="date" name="dataProva" value={form.dataProva}
                onChange={onAlterar} required />
            </label>
            <label className="coach-ia-campo">
              <span>Distância da prova *</span>
              <select name="distanciaProva" value={form.distanciaProva}
                onChange={onAlterar} required>
                <option value="">Selecione</option>
                <OpcoesSelect opcoes={DISTANCIAS_PROVA} />
              </select>
            </label>
            {form.distanciaProva === "Outra" && (
              <label className="coach-ia-campo">
                <span>Qual é a distância? *</span>
                <input name="outraDistanciaProva" value={form.outraDistanciaProva}
                  onChange={onAlterar} placeholder="Ex.: 50 km" required />
              </label>
            )}
            <label className="coach-ia-campo">
              <span>Objetivo para a prova</span>
              <select name="objetivoProva" value={form.objetivoProva}
                onChange={onAlterar}>
                <option value="">Selecione</option>
                <OpcoesSelect opcoes={OBJETIVOS_PROVA} />
              </select>
            </label>
            {form.objetivoProva === "Buscar um tempo específico" && (
              <label className="coach-ia-campo">
                <span>Tempo desejado *</span>
                <input name="tempoDesejadoProva" value={form.tempoDesejadoProva}
                  onChange={onAlterar} placeholder="Ex.: 45:00 ou 1:35:00" required />
              </label>
            )}
            <label className="coach-ia-campo">
              <span>Importância da prova *</span>
              <select name="importanciaProva" value={form.importanciaProva}
                onChange={onAlterar} required>
                <option value="">Selecione</option>
                <OpcoesSelect opcoes={IMPORTANCIAS_PROVA} />
              </select>
            </label>
          </>
        )}
        <label className="coach-ia-lesao">
          <input type="checkbox" name="possuiLesao"
            checked={form.possuiLesao} onChange={onAlterar} />
          <span className="coach-ia-check" aria-hidden="true">✓</span>
          <span><strong>Possui lesão ou limitação?</strong>
            <small>O plano priorizará sua segurança.</small></span>
        </label>
        {form.possuiLesao && (
          <label className="coach-ia-campo">
            <span>Descrição da lesão *</span>
            <textarea name="descricaoLesao" value={form.descricaoLesao}
              onChange={onAlterar} required />
          </label>
        )}
        <label className="coach-ia-campo coach-ia-largo">
          <span>Observações</span>
          <textarea name="observacoes" value={form.observacoes}
            onChange={onAlterar} placeholder="Fadiga, preferências ou limitações." />
        </label>
      </div>

      {erro && <p className="coach-ia-erro">{erro}</p>}
      {sucesso && <p className="coach-ia-sucesso">{sucesso}</p>}
      {carregando && (
        <p className="coach-ia-loading-mensagem">
          {mensagemLoading}
        </p>
      )}
      <button className="coach-ia-submit" type="submit" disabled={carregando}>
        {carregando
          ? <><span className="coach-ia-spinner" />Gerando plano...</>
          : <><span>▦</span>Gerar plano semanal</>}
      </button>
    </form>
  );
}

export default FormularioPlanoSemanal;
