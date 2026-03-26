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
    <section className="config-grid config-screen-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">3. Configuração</p>
            <h3>Preencha o essencial e deixe o resto recolhido</h3>
            <p className="section-copy">
              Esta tela foi organizada para ficar mais direta. Primeiro marque a identidade da
              campanha, depois o remetente e, por fim, o jeito de enviar.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={onStartCampaign}
            disabled={campaignIsActive || startingCampaign}
          >
            {startingCampaign ? 'Iniciando...' : 'Iniciar campanha'}
          </button>
        </div>

        <div className="config-sections">
          <section className="config-section">
            <div className="config-section-header">
              <strong>Marca e identidade</strong>
              <span>Usado no preview e nos templates prontos.</span>
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
                <span>URL da logo</span>
                <input
                  className="input-field"
                  value={configDraft.brandLogoUrl}
                  onChange={(event) => updateField('brandLogoUrl', event.target.value)}
                  placeholder="https://rakutenadvertising.com/..."
                />
              </label>
            </div>
            <div className="note-block compact-note">
              <strong>Importante</strong>
              <p>
                O campo <code>{'{{brand_logo_url}}'}</code> entra automaticamente nos templates
                prontos. Para melhor compatibilidade em clientes de email, prefira PNG ou JPG se
                você tiver essa opção.
              </p>
            </div>
          </section>

          <section className="config-section">
            <div className="config-section-header">
              <strong>Remetente</strong>
              <span>É isso que o destinatário vai ver no email.</span>
            </div>
            <div className="form-grid two-columns">
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
                  placeholder="Equipe Marketing"
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
                  placeholder="Equipe de Relacionamento"
                />
              </label>
              <label className="full-span">
                <span>Assunto da campanha</span>
                <input
                  className="input-field"
                  value={configDraft.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  placeholder="Ex.: Atualização importante sobre sua operação"
                />
              </label>
            </div>
          </section>

          <section className="config-section">
            <div className="config-section-header">
              <strong>Entrega</strong>
              <span>Defina lote, intervalo e modo de envio.</span>
            </div>
            <div className="form-grid two-columns">
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
                <span>Intervalo entre lotes (ms)</span>
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
                <span>Modo de envio</span>
                <select
                  className="input-field"
                  value={configDraft.sendMode}
                  onChange={(event) => updateField('sendMode', event.target.value)}
                >
                  <option value="individual">Um email por contato</option>
                  <option value="shared_bcc">Lote com BCC compartilhado</option>
                </select>
              </label>
              <label className="toggle-row compact-toggle">
                <input
                  type="checkbox"
                  checked={configDraft.enablePersonalization && !personalizationLocked}
                  disabled={personalizationLocked}
                  onChange={(event) => updateField('enablePersonalization', event.target.checked)}
                />
                <div>
                  <strong>Ativar personalização</strong>
                  <p>
                    Recomendado no envio individual. No modo BCC compartilhado, a personalização por
                    contato fica bloqueada.
                  </p>
                </div>
              </label>
            </div>

            {configDraft.sendMode === 'shared_bcc' ? (
              <div className="form-grid two-columns">
                <label>
                  <span>Destinatário visível (To)</span>
                  <input
                    className="input-field"
                    value={configDraft.visibleToEmail}
                    onChange={(event) => updateField('visibleToEmail', event.target.value)}
                    placeholder="marketing@empresa.com"
                  />
                </label>
                <label>
                  <span>Nome do destinatário visível</span>
                  <input
                    className="input-field"
                    value={configDraft.visibleToName}
                    onChange={(event) => updateField('visibleToName', event.target.value)}
                    placeholder="Equipe Marketing"
                  />
                </label>
              </div>
            ) : null}
          </section>

          <section className="config-section">
            <div className="toggle-grid">
              <label className="toggle-row compact-toggle">
                <input
                  type="checkbox"
                  checked={configDraft.enableSubscriptionTracking}
                  onChange={(event) =>
                    updateField('enableSubscriptionTracking', event.target.checked)
                  }
                />
                <div>
                  <strong>Unsubscribe padrão</strong>
                  <p>Deixa o opt-out ativo por padrão em todos os envios.</p>
                </div>
              </label>

              <label className="toggle-row compact-toggle">
                <input
                  type="checkbox"
                  checked={configDraft.autoDeleteTempContacts}
                  onChange={(event) => updateField('autoDeleteTempContacts', event.target.checked)}
                />
                <div>
                  <strong>Apagar contatos ao concluir</strong>
                  <p>O histórico fica salvo, mas a lista temporária é removida.</p>
                </div>
              </label>
            </div>
          </section>

          <details className="advanced-panel">
            <summary>Opções avançadas</summary>
            <div className="advanced-panel-body">
              <div className="note-block compact-note">
                <strong>Você pode ignorar esta parte</strong>
                <p>
                  Se você não usa CC fixo, BCC fixo, suppression groups, timeout customizado ou
                  headers extras, deixe tudo abaixo em branco.
                </p>
              </div>

              <div className="form-grid two-columns">
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
                <label>
                  <span>Timeout por requisição (ms)</span>
                  <input
                    className="input-field"
                    type="number"
                    min="5000"
                    step="1000"
                    value={configDraft.requestTimeoutMs}
                    onChange={(event) =>
                      updateField('requestTimeoutMs', Number(event.target.value))
                    }
                  />
                </label>
              </div>

              <div className="note-block compact-note">
                <strong>Variáveis de marca</strong>
                <p>
                  Você pode usar <code>{'{{brand_logo_url}}'}</code> e{' '}
                  <code>{'{{brand_name}}'}</code> em qualquer template. Se sua conta usa
                  suppression groups no SendGrid, preencha o ASM Group ID.
                </p>
              </div>

              <div className="form-grid">
                <div className="panel-header compact">
                  <div>
                    <p className="eyebrow">Headers</p>
                    <h3>Cabeçalhos customizados</h3>
                  </div>
                  <button
                    className="ghost-button"
                    onClick={() =>
                      updateField('customHeaders', [
                        ...configDraft.customHeaders,
                        { key: '', value: '' }
                      ])
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
                      placeholder="newsletter-maio"
                    />
                    <button
                      className="ghost-button"
                      onClick={() =>
                        updateField(
                          'customHeaders',
                          configDraft.customHeaders.filter(
                            (_, currentIndex) => currentIndex !== index
                          )
                        )
                      }
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </article>

      <article className="panel test-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">4. Teste</p>
            <h3>Valide antes do disparo</h3>
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

        <div className="note-block compact-note">
          <strong>Como este teste funciona</strong>
          <p>
            O app usa o template atual, o remetente atual e os dados do primeiro contato válido da
            lista para montar a prévia e enviar o teste.
          </p>
        </div>

        {testState.preview ? (
          <div className="note-block compact-note">
            <strong>Prévia pronta</strong>
            <p>
              {testState.preview.notice ||
                'A prévia já foi renderizada com os dados do primeiro contato válido.'}
            </p>
          </div>
        ) : null}

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
    </section>
  );
}
