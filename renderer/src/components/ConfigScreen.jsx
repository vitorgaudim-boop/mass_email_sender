export function ConfigScreen({
  configDraft,
  onChangeConfig,
  campaignIsActive,
  onSendTest,
  onStartCampaign,
  testState,
  setTestState,
  sendingTest,
  startingCampaign
}) {
  const personalizationLocked = configDraft.sendMode === 'shared_bcc';

  function updateField(key, value) {
    onChangeConfig({
      ...configDraft,
      [key]: value
    });
  }

  function updateHeader(index, field, value) {
    const nextHeaders = configDraft.customHeaders.map((header, currentIndex) =>
      currentIndex === index ? { ...header, [field]: value } : header
    );
    updateField('customHeaders', nextHeaders);
  }

  return (
    <section className="config-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">3. Sending Configuration</p>
            <h3>Remetente, lotes, BCC e governanca do envio</h3>
          </div>
          <button className="primary-button" onClick={onStartCampaign} disabled={campaignIsActive || startingCampaign}>
            {startingCampaign ? 'Iniciando...' : 'Iniciar campanha'}
          </button>
        </div>

        <div className="form-grid two-columns">
          <label>
            <span>Nome da marca</span>
            <input
              className="input-field"
              value={configDraft.brandName}
              onChange={(event) => updateField('brandName', event.target.value)}
              placeholder="Rakuten Advertising"
            />
          </label>
          <label>
            <span>URL da logo da marca</span>
            <input
              className="input-field"
              value={configDraft.brandLogoUrl}
              onChange={(event) => updateField('brandLogoUrl', event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label>
            <span>Email do remetente</span>
            <input
              className="input-field"
              value={configDraft.senderEmail}
              onChange={(event) => updateField('senderEmail', event.target.value)}
              placeholder="marketing@empresa.com"
            />
          </label>
          <label>
            <span>Nome do remetente</span>
            <input
              className="input-field"
              value={configDraft.senderName}
              onChange={(event) => updateField('senderName', event.target.value)}
              placeholder="Equipe Comercial"
            />
          </label>
          <label>
            <span>Reply-to</span>
            <input
              className="input-field"
              value={configDraft.replyToEmail}
              onChange={(event) => updateField('replyToEmail', event.target.value)}
              placeholder="suporte@empresa.com"
            />
          </label>
          <label>
            <span>Nome do reply-to</span>
            <input
              className="input-field"
              value={configDraft.replyToName}
              onChange={(event) => updateField('replyToName', event.target.value)}
              placeholder="Relacionamento"
            />
          </label>
          <label className="full-span">
            <span>Assunto da campanha</span>
            <input
              className="input-field"
              value={configDraft.subject}
              onChange={(event) => updateField('subject', event.target.value)}
              placeholder="Seu cupom especial chegou"
            />
          </label>
          <label>
            <span>Tamanho do lote</span>
            <input
              className="input-field"
              type="number"
              min="1"
              max="1000"
              value={configDraft.batchSize}
              onChange={(event) => updateField('batchSize', Number(event.target.value))}
            />
          </label>
          <label>
            <span>Delay entre lotes (ms)</span>
            <input
              className="input-field"
              type="number"
              min="0"
              step="500"
              value={configDraft.delayMs}
              onChange={(event) => updateField('delayMs', Number(event.target.value))}
            />
          </label>
          <label>
            <span>Timeout por requisicao (ms)</span>
            <input
              className="input-field"
              type="number"
              min="5000"
              step="1000"
              value={configDraft.requestTimeoutMs}
              onChange={(event) => updateField('requestTimeoutMs', Number(event.target.value))}
            />
          </label>
          <label>
            <span>Modo de envio</span>
            <select
              className="input-field"
              value={configDraft.sendMode}
              onChange={(event) => updateField('sendMode', event.target.value)}
            >
              <option value="individual">Individual por contato</option>
              <option value="shared_bcc">BCC compartilhado</option>
            </select>
          </label>
          <label>
            <span>CC fixo</span>
            <textarea
              className="input-field"
              value={configDraft.ccListText}
              onChange={(event) => updateField('ccListText', event.target.value)}
              placeholder="financeiro@empresa.com"
            />
          </label>
          <label>
            <span>BCC fixo</span>
            <textarea
              className="input-field"
              value={configDraft.bccListText}
              onChange={(event) => updateField('bccListText', event.target.value)}
              placeholder="auditoria@empresa.com"
            />
          </label>
          <label>
            <span>ASM Group ID</span>
            <input
              className="input-field"
              value={configDraft.asmGroupId}
              onChange={(event) => updateField('asmGroupId', event.target.value)}
              placeholder="Opcional. Ex.: 12345"
            />
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={configDraft.enablePersonalization && !personalizationLocked}
              disabled={personalizationLocked}
              onChange={(event) => updateField('enablePersonalization', event.target.checked)}
            />
            <div>
              <strong>Ativar personalizacao</strong>
              <p>Ligado por padrao no modo individual. Desligado automaticamente no BCC compartilhado.</p>
            </div>
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={configDraft.enableSubscriptionTracking}
              onChange={(event) => updateField('enableSubscriptionTracking', event.target.checked)}
            />
            <div>
              <strong>Ativar unsubscribe padrao</strong>
              <p>Usa `tracking_settings.subscription_tracking` do SendGrid para anexar o link de unsubscribe em todos os emails.</p>
            </div>
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={configDraft.autoDeleteTempContacts}
              onChange={(event) => updateField('autoDeleteTempContacts', event.target.checked)}
            />
            <div>
              <strong>Apagar contatos temporarios ao concluir</strong>
              <p>O historico agregado fica salvo, mas o buffer da importacao e removido apos a campanha.</p>
            </div>
          </label>
        </div>

        <div className="note-block">
          <strong>Branding e compliance</strong>
          <p>
            A URL da logo entra automaticamente na variavel <code>{'{{brand_logo_url}}'}</code>.
            O nome da marca entra em <code>{'{{brand_name}}'}</code>. O unsubscribe fica ativo por
            padrao e o ASM Group ID e opcional para quem usa suppression groups no SendGrid.
          </p>
        </div>

        {configDraft.sendMode === 'shared_bcc' ? (
          <div className="form-grid two-columns">
            <label>
              <span>Destinatario visivel (To)</span>
              <input
                className="input-field"
                value={configDraft.visibleToEmail}
                onChange={(event) => updateField('visibleToEmail', event.target.value)}
                placeholder="marketing@empresa.com"
              />
            </label>
            <label>
              <span>Nome do destinatario visivel</span>
              <input
                className="input-field"
                value={configDraft.visibleToName}
                onChange={(event) => updateField('visibleToName', event.target.value)}
                placeholder="Equipe Marketing"
              />
            </label>
          </div>
        ) : null}

        <div className="form-grid">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">Headers</p>
              <h3>Cabecalhos customizados</h3>
            </div>
            <button
              className="ghost-button"
              onClick={() =>
                updateField('customHeaders', [...configDraft.customHeaders, { key: '', value: '' }])
              }
            >
              Adicionar header
            </button>
          </div>
          {configDraft.customHeaders.map((header, index) => (
            <div key={`header-${index}`} className="header-row">
              <input
                className="input-field"
                value={header.key}
                onChange={(event) => updateHeader(index, 'key', event.target.value)}
                placeholder="X-Campaign-Source"
              />
              <input
                className="input-field"
                value={header.value}
                onChange={(event) => updateHeader(index, 'value', event.target.value)}
                placeholder="promocao-marco"
              />
              <button
                className="ghost-button"
                onClick={() =>
                  updateField(
                    'customHeaders',
                    configDraft.customHeaders.filter((_, currentIndex) => currentIndex !== index)
                  )
                }
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">4. Test Mode</p>
            <h3>Renderizacao amostral e envio controlado</h3>
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

        {testState.preview ? (
          <div className="note-block">
            <strong>Preview disponivel</strong>
            <p>{testState.preview.notice || 'Conteudo renderizado com os dados do primeiro contato valido da lista.'}</p>
          </div>
        ) : null}

        <div className="test-results">
          {testState.results.map((result) => (
            <div key={result.email} className={result.status === 'aceita' ? 'result-pill success' : 'result-pill danger'}>
              <strong>{result.email}</strong>
              <span>{result.status === 'aceita' ? 'Aceita pelo SendGrid' : result.reason}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
