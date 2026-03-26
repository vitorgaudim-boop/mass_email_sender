import DOMPurify from 'dompurify';

export function SendScreen({
  configDraft,
  contactGroups,
  totalEligibleContacts,
  preview,
  testState,
  setTestState,
  sendingTest,
  startingCampaign,
  onChangeConfig,
  onSendTest,
  onStartCampaign
}) {
  const selectedGroups = contactGroups.filter((group) =>
    (configDraft.selectedGroupIds || []).includes(group.id)
  );
  const sanitizedPreview = preview?.html
    ? DOMPurify.sanitize(preview.html, {
        USE_PROFILES: { html: true }
      })
    : '';

  return (
    <section className="dashboard-grid send-grid">
      <article className="panel panel-wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">4. Disparo</p>
            <h3>Prévia final, teste e envio</h3>
            <p className="section-copy">
              Esta é a última checagem antes do envio. Aqui você confirma público, assunto,
              unsubscribe visível na prévia e dispara a campanha.
            </p>
          </div>
          <button className="primary-button" onClick={onStartCampaign} disabled={startingCampaign}>
            {startingCampaign ? 'Iniciando...' : 'Iniciar disparo'}
          </button>
        </div>

        <div className="stats-grid">
          <article className="metric-card metric-card-wide">
            <span>Assunto do email</span>
            <input
              className="input-field"
              value={configDraft.subject}
              onChange={(event) =>
                onChangeConfig({
                  ...configDraft,
                  subject: event.target.value
                })
              }
              placeholder="Ex.: Atualização importante sobre sua operação"
            />
          </article>
          <article className="metric-card">
            <span>Contatos elegíveis</span>
            <strong>{totalEligibleContacts}</strong>
          </article>
          <article className="metric-card">
            <span>Grupos ativos</span>
            <strong>{selectedGroups.length || 'Todos'}</strong>
          </article>
          <article className="metric-card">
            <span>Lote</span>
            <strong>{configDraft.batchSize}</strong>
          </article>
          <article className="metric-card">
            <span>Intervalo</span>
            <strong>{configDraft.delayMs} ms</strong>
          </article>
        </div>

        <div className="send-summary-grid">
          <div className="note-block compact-note">
            <strong>Assunto</strong>
            <p>{configDraft.subject || 'Sem assunto definido.'}</p>
          </div>

          <div className="note-block compact-note">
            <strong>Remetente</strong>
            <p>
              {configDraft.senderName || 'Sem nome'} {configDraft.senderEmail ? `· ${configDraft.senderEmail}` : ''}
            </p>
          </div>

          <div className="note-block compact-note">
            <strong>Público selecionado</strong>
            <p>
              {selectedGroups.length
                ? selectedGroups.map((group) => group.name).join(', ')
                : 'Todos os contatos válidos e ativos da base atual.'}
            </p>
          </div>

          <div className="note-block compact-note">
            <strong>Unsubscribe na prévia</strong>
            <p>
              {configDraft.enableSubscriptionTracking
                ? 'Ativo. A prévia abaixo já mostra o bloco de unsubscribe.'
                : 'Desativado. O bloco de unsubscribe não será exibido.'}
            </p>
          </div>
        </div>

        <div className="panel-header compact">
          <div>
            <p className="eyebrow">Teste</p>
            <h3>Envio de teste</h3>
          </div>
          <button className="ghost-button" onClick={onSendTest} disabled={sendingTest}>
            {sendingTest ? 'Enviando...' : 'Enviar teste'}
          </button>
        </div>

        <label>
          <span>Emails de teste</span>
          <textarea
            className="input-field"
            value={testState.recipientsText}
            onChange={(event) =>
              setTestState((current) => ({
                ...current,
                recipientsText: event.target.value
              }))
            }
            placeholder="qa@empresa.com&#10;gestor@empresa.com"
          />
        </label>

        <div className="test-results">
          {testState.results.map((result) => (
            <div
              key={result.email}
              className={result.status === 'aceita' ? 'result-pill success' : 'result-pill danger'}
            >
              <strong>{result.email}</strong>
              <span>{result.status === 'aceita' ? 'Aceita pelo SendGrid' : result.reason}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel template-preview-panel">
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow">Prévia final</p>
            <h3>Exatamente o que será revisado</h3>
          </div>
        </div>

        <div className="preview-shell mail-preview-shell">
          <div className="preview-header">
            <span>Assunto</span>
            <strong>{preview?.subject || configDraft.subject || 'Sem assunto definido'}</strong>
          </div>

          {preview?.type === 'remote_dynamic_template' ? (
            <div className="note-block compact-note">
              <strong>Template remoto</strong>
              <p>{preview.notice}</p>
            </div>
          ) : sanitizedPreview ? (
            <div className="preview-frame mail-preview-frame">
              <iframe
                title="Preview final do email"
                className="mail-preview-iframe"
                srcDoc={sanitizedPreview}
                sandbox=""
              />
            </div>
          ) : (
            <div className="preview-frame mail-preview-frame">
              <div className="preview-empty-state">
                <strong>Sem prévia ainda</strong>
                <p>Monte o template e preencha a configuração para revisar o email final aqui.</p>
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
