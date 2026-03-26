import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import {
  BUILT_IN_TEMPLATES,
  createDraftFromPreset,
  DEFAULT_TEMPLATE_PRESET,
  syncTemplateDraft
} from '../../../shared/templateCatalog.js';

export function TemplateStudio({
  templateDraft,
  availableFields,
  onChangeTemplate,
  onPreview,
  preview,
  onImportTemplate
}) {
  const [EditorComponent, setEditorComponent] = useState(null);
  const [editorLoadError, setEditorLoadError] = useState('');
  const sanitizedPreview = preview?.html
    ? DOMPurify.sanitize(preview.html, {
        USE_PROFILES: { html: true }
      })
    : '';

  useEffect(() => {
    let active = true;

    import('@monaco-editor/react')
      .then((module) => {
        if (!active) {
          return;
        }

        setEditorComponent(() => module.default);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        console.error('Monaco failed to load:', error);
        setEditorLoadError(
          'O editor avançado não carregou nesta instalação. O app trocou automaticamente para o editor simples.'
        );
      });

    return () => {
      active = false;
    };
  }, []);

  function updateDraft(nextDraft) {
    onChangeTemplate(syncTemplateDraft(nextDraft));
  }

  function updateComposerField(key, value) {
    updateDraft({
      ...templateDraft,
      composer: {
        ...(templateDraft.composer || {}),
        [key]: value
      }
    });
  }

  function applyPreset(preset) {
    onChangeTemplate(createDraftFromPreset(preset));
  }

  function switchToPresetMode() {
    const fallbackPreset =
      BUILT_IN_TEMPLATES.find((item) => item.id === templateDraft.presetId) || DEFAULT_TEMPLATE_PRESET;
    applyPreset(fallbackPreset);
  }

  const isPresetMode = templateDraft.mode === 'local' && templateDraft.sourceType === 'preset';

  return (
    <section className="template-grid">
      <article className="panel template-main-panel">
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow">2. Template</p>
            <h3>Escolha o visual e escreva o texto</h3>
            <p className="section-copy compact-copy">
              Aqui o template é só a estrutura visual. O conteúdo é preenchido em campos simples,
              sem precisar abrir HTML.
            </p>
          </div>
          <div className="panel-actions">
            <button className="ghost-button" onClick={onImportTemplate}>
              Importar HTML/EML
            </button>
            <button className="primary-button" onClick={onPreview}>
              Atualizar preview
            </button>
          </div>
        </div>

        <div className="template-mode-strip">
          <button
            className={templateDraft.mode === 'local' ? 'segment active' : 'segment'}
            onClick={() => updateDraft({ ...templateDraft, mode: 'local' })}
          >
            Shells do app
          </button>
          <button
            className={templateDraft.mode === 'sendgrid_dynamic' ? 'segment active' : 'segment'}
            onClick={() =>
              updateDraft({
                ...templateDraft,
                mode: 'sendgrid_dynamic',
                sourceType: 'sendgrid_dynamic'
              })
            }
          >
            Template dinâmico do SendGrid
          </button>
        </div>

        {templateDraft.mode === 'sendgrid_dynamic' ? (
          <div className="template-simple-stack">
            <label>
              <span>Template ID do SendGrid</span>
              <input
                className="input-field"
                value={templateDraft.templateId}
                onChange={(event) =>
                  onChangeTemplate({ ...templateDraft, templateId: event.target.value })
                }
                placeholder="d-123abc..."
              />
            </label>

            <div className="note-block compact-note">
              <strong>Quando usar</strong>
              <p>
                Use este modo só quando o HTML final já estiver hospedado no SendGrid. Se você quer
                montar o email aqui no app, fique em <strong>Shells do app</strong>.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="template-shell-grid">
              {BUILT_IN_TEMPLATES.map((preset) => (
                <button
                  key={preset.id}
                  className={
                    templateDraft.presetId === preset.id && templateDraft.sourceType === 'preset'
                      ? 'template-shell-card active'
                      : 'template-shell-card'
                  }
                  onClick={() => applyPreset(preset)}
                >
                  <span className="template-category">{preset.category}</span>
                  <strong>{preset.name}</strong>
                  <small>{preset.description}</small>
                </button>
              ))}
            </div>

            {isPresetMode ? (
              <div className="simple-composer-grid">
                <div className="note-block compact-note full-span">
                  <strong>O assunto fica na tela Configuração</strong>
                  <p>
                    Aqui você escolhe só o visual e escreve o conteúdo do email. O assunto da
                    campanha é definido depois, junto com remetente, lote e teste.
                  </p>
                </div>

                <label className="full-span">
                  <span>Título do email</span>
                  <input
                    className="input-field"
                    value={templateDraft.composer?.headline || ''}
                    onChange={(event) => updateComposerField('headline', event.target.value)}
                    placeholder="Ex.: Atualização importante para sua operação"
                  />
                </label>

                <label className="full-span">
                  <span>Saudação</span>
                  <input
                    className="input-field"
                    value={templateDraft.composer?.greeting || ''}
                    onChange={(event) => updateComposerField('greeting', event.target.value)}
                    placeholder="Olá {{name}},"
                  />
                </label>

                <label className="full-span">
                  <span>Mensagem principal</span>
                  <textarea
                    className="input-field composer-textarea composer-textarea-main"
                    value={templateDraft.composer?.body || ''}
                    onChange={(event) => updateComposerField('body', event.target.value)}
                    placeholder="Escreva aqui o texto principal do email."
                  />
                </label>

                <label className="full-span">
                  <span>Texto complementar</span>
                  <textarea
                    className="input-field composer-textarea"
                    value={templateDraft.composer?.supportingText || ''}
                    onChange={(event) => updateComposerField('supportingText', event.target.value)}
                    placeholder="Use este espaço para contexto extra, instruções ou observações."
                  />
                </label>

                <label className="full-span">
                  <span>Pontos-chave</span>
                  <textarea
                    className="input-field composer-textarea"
                    value={templateDraft.composer?.highlights || ''}
                    onChange={(event) => updateComposerField('highlights', event.target.value)}
                    placeholder={'Um item por linha\nOutro item por linha'}
                  />
                </label>

                <label>
                  <span>Texto do botão</span>
                  <input
                    className="input-field"
                    value={templateDraft.composer?.ctaLabel || ''}
                    onChange={(event) => updateComposerField('ctaLabel', event.target.value)}
                    placeholder="Ex.: Ver detalhes"
                  />
                </label>

                <label>
                  <span>URL do botão</span>
                  <input
                    className="input-field"
                    value={templateDraft.composer?.ctaUrl || ''}
                    onChange={(event) => updateComposerField('ctaUrl', event.target.value)}
                    placeholder="https://..."
                  />
                </label>

                <label className="full-span">
                  <span>Assinatura</span>
                  <input
                    className="input-field"
                    value={templateDraft.composer?.signature || ''}
                    onChange={(event) => updateComposerField('signature', event.target.value)}
                    placeholder="Equipe {{brand_name}}"
                  />
                </label>

                <div className="note-block compact-note full-span">
                  <strong>Você ainda pode personalizar</strong>
                  <p>
                    Esses campos aceitam variáveis como <code>{'{{name}}'}</code>,{' '}
                    <code>{'{{coupon_code}}'}</code> e <code>{'{{brand_name}}'}</code>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="template-imported-stack">
                <div className="note-block compact-note">
                  <strong>HTML importado</strong>
                  <p>
                    Você está usando um arquivo importado. Se quiser voltar ao fluxo simples do app,
                    clique no botão abaixo.
                  </p>
                </div>

                <div className="panel-actions">
                  <button className="ghost-button" onClick={switchToPresetMode}>
                    Voltar para os shells do app
                  </button>
                </div>

                <details className="advanced-panel">
                  <summary>Editar HTML avançado</summary>
                  <div className="advanced-panel-body">
                    <div className="editor-shell">
                      {EditorComponent ? (
                        <EditorComponent
                          height="360px"
                          defaultLanguage="html"
                          language="html"
                          theme="vs-light"
                          value={templateDraft.html}
                          onChange={(value) =>
                            onChangeTemplate({ ...templateDraft, html: value || '' })
                          }
                          options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            wordWrap: 'on',
                            lineNumbersMinChars: 3
                          }}
                        />
                      ) : (
                        <textarea
                          className="editor-fallback"
                          value={templateDraft.html}
                          onChange={(event) =>
                            onChangeTemplate({ ...templateDraft, html: event.target.value })
                          }
                          placeholder="Cole ou edite o HTML aqui."
                        />
                      )}
                    </div>
                    {editorLoadError ? <p className="inline-warning">{editorLoadError}</p> : null}
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </article>

      <article className="panel template-preview-panel">
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow">Prévia</p>
            <h3>Como o email deve ficar</h3>
          </div>
        </div>

        <div className="note-block compact-note">
          <strong>Variáveis prontas para uso</strong>
          <div className="pill-row">
            {availableFields.map((field) => (
              <span key={field} className="variable-pill">
                {`{{${field}}}`}
              </span>
            ))}
          </div>
        </div>

        <div className="preview-shell mail-preview-shell">
          <div className="preview-header">
            <span>Assunto</span>
            <strong>{preview?.subject || 'Sem assunto'}</strong>
          </div>

          {preview?.type === 'remote_dynamic_template' ? (
            <div className="note-block compact-note">
              <strong>Template remoto</strong>
              <p>{preview.notice}</p>
            </div>
          ) : sanitizedPreview ? (
            <div className="preview-frame mail-preview-frame">
              <iframe
                title="Preview do email"
                className="mail-preview-iframe"
                srcDoc={sanitizedPreview}
                sandbox=""
              />
            </div>
          ) : (
            <div className="preview-frame mail-preview-frame">
              <div className="preview-empty-state">
                <strong>O preview aparece aqui</strong>
                <p>Escolha um shell, escreva o texto e revise o resultado.</p>
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
