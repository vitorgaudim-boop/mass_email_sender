export function ConfigScreen({ configDraft, onChangeConfig }) {
  const sendMode = configDraft.sendMode === 'shared_bcc' ? 'shared_bcc' : 'individual';
  const personalizationLocked = sendMode === 'shared_bcc';

  function buildNextConfig(patch) {
    const nextConfig = {
      ...configDraft,
      ...patch
    };

    if (nextConfig.sendMode === 'shared_bcc') {
      nextConfig.enablePersonalization = false;
    }

    return nextConfig;
  }

  function updateField(key, value) {
    onChangeConfig(buildNextConfig({ [key]: value }));
  }

  function updateHeader(index, field, value) {
    const nextHeaders = configDraft.customHeaders.map((header, currentIndex) =>
      currentIndex === index ? { ...header, [field]: value } : header
    );
    updateField('customHeaders', nextHeaders);
  }

  return (
    <section className="config-grid config-screen-grid single-panel-grid">
      <article className="panel panel-wide config-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">3. Configuração</p>
            <h3>Identidade, remetente e regras de envio</h3>
            <p className="section-copy">
              O essencial do disparo fica no topo. Teste, prévia final e início do envio continuam
              na tela de <strong>Disparo</strong>.
            </p>
          </div>
        </div>

        <div className="config-scroll-area">
          <div className="config-sections">
            <section className="config-section">
              <div className="config-section-header">
                <strong>Envio</strong>
                <span>Assunto, modo, lote e intervalo ficam sempre visíveis logo aqui.</span>
              </div>

              <div className="form-grid two-columns">
                <label className="full-span">
                  <span>Assunto da campanha</span>
                  <input
                    className="input-field"
                    value={configDraft.subject}
                    onChange={(event) => updateField('subject', event.target.value)}
                    placeholder="Ex.: Atualização importante sobre sua operação"
                  />
                  <small className="field-help">
                    Você também pode ajustar esse assunto diretamente na tela de <strong>Disparo</strong>.
                  </small>
                </label>

                <label>
                  <span>Modo de envio</span>
                  <select
                    className="input-field"
                    value={sendMode}
                    onChange={(event) => updateField('sendMode', event.target.value)}
                  >
                    <option value="individual">Um email por contato</option>
                    <option value="shared_bcc">Lote com BCC compartilhado</option>
                  </select>
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
                      contato fica bloqueada automaticamente.
                    </p>
                  </div>
                </label>
              </div>

              {sendMode === 'shared_bcc' ? (
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
              <div className="config-section-header">
                <strong>Marca e identidade</strong>
                <span>Isso aparece no topo e na assinatura dos templates prontos.</span>
              </div>

              <div className="form-grid two-columns">
                <label>
                  <span>Nome exibido da marca</span>
                  <input
                    className="input-field"
                    value={configDraft.brandName}
                    onChange={(event) => updateField('brandName', event.target.value)}
                    placeholder="Rakuten Advertising"
                  />
                </label>

                <label>
                  <span>URL da logo exibida</span>
                  <input
                    className="input-field"
                    value={configDraft.brandLogoUrl}
                    onChange={(event) => updateField('brandLogoUrl', event.target.value)}
                    placeholder="https://rakutenadvertising.com/..."
                  />
                </label>
              </div>
            </section>

            <section className="config-section">
              <div className="config-section-header">
                <strong>Remetente</strong>
                <span>É isso que o destinatário vai ver no envio.</span>
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
              </div>
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
                    <p>O bloco fica visível na prévia final da tela de disparo.</p>
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
        </div>
      </article>
    </section>
  );
}
