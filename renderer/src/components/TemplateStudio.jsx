import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { BUILT_IN_TEMPLATES, createDraftFromPreset } from '../../../shared/templateCatalog.js';

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

  function applyPreset(preset) {
    onChangeTemplate(createDraftFromPreset(preset));
  }

  return (
    <section className="template-grid">
      <article className="panel template-main-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">2. Template</p>
            <h3>Escolha um modelo pronto e ajuste só o necessário</h3>
            <p className="section-copy">
              O fluxo mais simples é este: clique em <strong>Usar modelo</strong>, revise o
              assunto e confira o preview. O editor HTML fica escondido logo abaixo, para quando
              você realmente precisar mexer no código.
            </p>
          </div>
          <div className="panel-actions">
            <button className="ghost-button" onClick={onImportTemplate}>
              Importar HTML ou EML
            </button>
            <button className="primary-button" onClick={onPreview}>
              Atualizar preview
            </button>
          </div>
        </div>

        <div className="template-quickstart">
          <div className="quickstart-item">
            <strong>1. Escolha um modelo</strong>
            <span>Todos já saem com header, logo, estrutura e rodapé prontos.</span>
          </div>
          <div className="quickstart-item">
            <strong>2. Ajuste o texto</strong>
            <span>Troque o assunto ou o conteúdo principal. Nada de começar do zero.</span>
          </div>
          <div className="quickstart-item">
            <strong>3. Revise e envie</strong>
            <span>O preview é atualizado com a sua marca e com os dados do primeiro contato.</span>
          </div>
        </div>

        <div className="template-mode-strip">
          <button
            className={templateDraft.mode === 'local' ? 'segment active' : 'segment'}
            onClick={() => onChangeTemplate({ ...templateDraft, mode: 'local' })}
          >
            Modelos prontos e HTML
          </button>
          <button
            className={templateDraft.mode === 'sendgrid_dynamic' ? 'segment active' : 'segment'}
            onClick={() =>
              onChangeTemplate({
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

            <div className="note-block">
              <strong>Quando usar este modo</strong>
              <p>
                Use apenas se o HTML final já estiver criado dentro do SendGrid. Se você quer
                começar por um modelo pronto do app, fique no modo anterior.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="note-block compact-note">
              <strong>Biblioteca pronta para uso</strong>
              <p>
                Os modelos abaixo já vêm com estrutura Rakuten, espaçamento, logo e fechamento.
                Você pode simplesmente escolher um deles e seguir para o teste.
              </p>
            </div>

            <div className="template-library">
              {BUILT_IN_TEMPLATES.map((preset) => (
                <article
                  key={preset.id}
                  className={
                    templateDraft.presetId === preset.id ? 'template-card active' : 'template-card'
                  }
                >
                  <div className="template-card-top">
                    <span className="template-category">{preset.category}</span>
                    {preset.isDefault ? <span className="template-badge">Padrão</span> : null}
                  </div>
                  <h4>{preset.name}</h4>
                  <p>{preset.description}</p>
                  <div className="template-tag-row">
                    {preset.tags.map((tag) => (
                      <span key={`${preset.id}-${tag}`} className="template-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="ghost-button template-use-button" onClick={() => applyPreset(preset)}>
                    {templateDraft.presetId === preset.id ? 'Modelo em uso' : 'Usar modelo'}
                  </button>
                </article>
              ))}
            </div>

            <div className="template-editor-toolbar">
              <label className="full-span">
                <span>Assunto do template</span>
                <input
                  className="input-field"
                  value={templateDraft.subject}
                  onChange={(event) =>
                    onChangeTemplate({ ...templateDraft, subject: event.target.value })
                  }
                  placeholder="Ex.: Atualização importante sobre sua operação"
                />
              </label>

              <div className="note-block">
                <strong>Modelo atual</strong>
                <p>
                  {templateDraft.fileName
                    ? `Você está usando: ${templateDraft.fileName}.`
                    : 'Nenhum arquivo importado. Escolha um dos modelos acima ou importe um HTML.'}
                </p>
              </div>
            </div>

            <details className="advanced-panel">
              <summary>Editar HTML avançado</summary>
              <div className="advanced-panel-body">
                <p className="section-copy no-margin">
                  Use este editor só se você quiser refinar o HTML manualmente. Para o fluxo normal,
                  você pode ignorar esta parte.
                </p>
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
          </>
        )}
      </article>

      <article className="panel template-preview-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Prévia</p>
            <h3>Como o email deve ficar</h3>
          </div>
        </div>

        <div className="note-block compact-note">
          <strong>Variáveis prontas para uso</strong>
          <p>
            Você pode usar dados da planilha e da marca. O app escapa os valores automaticamente
            para evitar injeção.
          </p>
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
                <p>Escolha um modelo pronto, importe um HTML ou edite o conteúdo para visualizar.</p>
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
