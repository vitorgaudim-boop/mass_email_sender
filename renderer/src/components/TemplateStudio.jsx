import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { RichTextEditor } from './RichTextEditor.jsx';
import {
  BUILT_IN_TEMPLATES,
  createDraftFromPreset,
  DEFAULT_TEMPLATE_PRESET,
  TEMPLATE_FONT_OPTIONS,
  syncTemplateDraft
} from '../../../shared/templateCatalog.js';

function ShellThumb({ preset }) {
  return (
    <div className="template-shell-thumb" style={{ background: preset.pageBackground }}>
      <div
        className="template-shell-thumb-header"
        style={{ background: preset.headerBackground }}
      >
        <div
          className="template-shell-thumb-logo"
          style={{ background: preset.useWhiteLogo ? 'rgba(255,255,255,0.92)' : '#7b27c0' }}
        />
        <div
          className="template-shell-thumb-title"
          style={{ background: preset.headlineColor }}
        />
        <div
          className="template-shell-thumb-line short"
          style={{ background: preset.introColor }}
        />
      </div>
      <div className="template-shell-thumb-body">
        <div className="template-shell-thumb-line" />
        <div className="template-shell-thumb-line" />
        <div className="template-shell-thumb-line short" />
        <div
          className="template-shell-thumb-cta"
          style={{ background: preset.ctaButtonBackground }}
        />
      </div>
    </div>
  );
}

export function TemplateStudio({
  templateDraft,
  configDraft,
  availableFields,
  onChangeTemplate,
  onPreview,
  preview,
  onImportTemplate,
  onOpenConfig
}) {
  const [EditorComponent, setEditorComponent] = useState(null);
  const [editorLoadError, setEditorLoadError] = useState('');
  const sanitizedPreview = preview?.html
    ? DOMPurify.sanitize(preview.html, {
        USE_PROFILES: { html: true }
      })
    : '';
  const activeBrandName = configDraft?.brandName || 'Rakuten Advertising';
  const hasBrandLogo = Boolean(configDraft?.brandLogoUrl);

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
          'O editor avançado de HTML não carregou nesta instalação. O app trocou para o editor simples.'
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
            <h3>Escolha o visual e escreva o conteúdo</h3>
            <p className="section-copy compact-copy">
              O template agora é a moldura visual do email. O texto principal é escrito em um
              editor rico, sem depender de HTML.
            </p>
          </div>
          <div className="panel-actions">
            <button className="ghost-button" onClick={onImportTemplate}>
              Importar HTML/EML
            </button>
            <button className="primary-button" onClick={onPreview}>
              Atualizar prévia
            </button>
          </div>
        </div>

        <div className="template-brand-bar">
          <div className="template-brand-copy">
            <p className="eyebrow">Marca aplicada</p>
            <strong>{activeBrandName}</strong>
            <p>
              Esse nome entra no topo e na assinatura dos templates prontos. A logo configurada
              entra automaticamente no cabeçalho do email.
            </p>
          </div>

          <div className="template-brand-meta">
            <span className="template-brand-state">
              {hasBrandLogo ? 'Logo configurada' : 'Logo ainda não configurada'}
            </span>
            <button className="ghost-button" onClick={onOpenConfig}>
              Abrir configuração
            </button>
          </div>
        </div>

        <div className="template-mode-strip">
          <button
            className={templateDraft.mode === 'local' ? 'segment active' : 'segment'}
            onClick={() => updateDraft({ ...templateDraft, mode: 'local' })}
          >
            Templates do app
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
                montar o email aqui no app, fique em <strong>Templates do app</strong>.
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
                  <ShellThumb preset={preset} />
                  <span className="template-category">{preset.category}</span>
                  <strong>{preset.name}</strong>
                  <small>{preset.description}</small>
                </button>
              ))}
            </div>

            {isPresetMode ? (
              <div className="template-compose-stack">
                <div className="template-form-row">
                  <label>
                    <span>Título do email</span>
                    <input
                      className="input-field"
                      value={templateDraft.composer?.headline || ''}
                      onChange={(event) => updateComposerField('headline', event.target.value)}
                      placeholder="Ex.: Atualização importante para a sua operação"
                    />
                  </label>

                  <label>
                    <span>Linha de apoio</span>
                    <input
                      className="input-field"
                      value={templateDraft.composer?.intro || ''}
                      onChange={(event) => updateComposerField('intro', event.target.value)}
                      placeholder="Ex.: Use este espaço para resumir o contexto do email."
                    />
                  </label>
                </div>

                <div className="template-form-row">
                  <label>
                    <span>Fonte do template inteiro</span>
                    <select
                      className="input-field"
                      value={templateDraft.composer?.fontFamily || TEMPLATE_FONT_OPTIONS[0].value}
                      onChange={(event) => updateComposerField('fontFamily', event.target.value)}
                    >
                      {TEMPLATE_FONT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="note-block compact-note">
                    <strong>Fonte global</strong>
                    <p>
                      A fonte escolhida aqui vale para título, subtítulo, corpo, botão e assinatura.
                    </p>
                  </div>
                </div>

                <section className="template-editor-panel">
                  <div className="template-editor-header">
                    <div>
                      <p className="eyebrow">Conteúdo principal</p>
                      <h4>Escreva o corpo do email com formatação</h4>
                    </div>
                    <p>
                      Use negrito, itálico, listas, links e variáveis da planilha sem abrir o HTML.
                    </p>
                  </div>

                  <RichTextEditor
                    value={templateDraft.composer?.bodyHtml || ''}
                    onChange={(value) => updateComposerField('bodyHtml', value)}
                    availableFields={availableFields}
                    fontFamily={
                      templateDraft.composer?.fontFamily || TEMPLATE_FONT_OPTIONS[0].value
                    }
                  />
                </section>

                <div className="template-form-row template-form-row-compact">
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

                  <label>
                    <span>Assinatura</span>
                    <input
                      className="input-field"
                      value={templateDraft.composer?.signature || ''}
                      onChange={(event) => updateComposerField('signature', event.target.value)}
                      placeholder="Equipe {{brand_name}}"
                    />
                  </label>
                </div>

                <div className="note-block compact-note">
                  <strong>Fluxo recomendado</strong>
                  <p>
                    1. Escolha a moldura visual. 2. Escreva o conteúdo no editor rico. 3. Defina o
                    assunto na tela de configuração. 4. Atualize a prévia e envie um teste.
                  </p>
                </div>
              </div>
            ) : (
              <div className="template-imported-stack">
                <div className="note-block compact-note">
                  <strong>HTML importado</strong>
                  <p>
                    Você está usando um arquivo externo. Se quiser voltar ao fluxo simples do app,
                    use o botão abaixo.
                  </p>
                </div>

                <div className="panel-actions">
                  <button className="ghost-button" onClick={switchToPresetMode}>
                    Voltar para os templates do app
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
          <strong>Marca atual do template</strong>
          <p>
            <strong>{activeBrandName}</strong>
            {hasBrandLogo
              ? ' com logo configurada.'
              : ' sem logo definida ainda. Abra Configuração para ajustar isso.'}
          </p>
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
            <strong>{preview?.subject || configDraft?.subject || 'Sem assunto definido'}</strong>
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
                <p>Escolha uma moldura, escreva no editor e revise o resultado final.</p>
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
