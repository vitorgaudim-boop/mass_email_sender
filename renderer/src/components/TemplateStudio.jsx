import DOMPurify from 'dompurify';
import Editor from '@monaco-editor/react';

export function TemplateStudio({
  templateDraft,
  availableFields,
  onChangeTemplate,
  onPreview,
  preview,
  onImportTemplate
}) {
  const sanitizedPreview = preview?.html ? DOMPurify.sanitize(preview.html) : '';

  return (
    <section className="template-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">2. Template Studio</p>
            <h3>HTML, EML e modo dinamico remoto</h3>
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

        <div className="segment-control">
          <button
            className={templateDraft.mode === 'local' ? 'segment active' : 'segment'}
            onClick={() => onChangeTemplate({ ...templateDraft, mode: 'local' })}
          >
            Conteudo local
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
            Template dinamico
          </button>
        </div>

        {templateDraft.mode === 'sendgrid_dynamic' ? (
          <div className="form-grid">
            <label>
              <span>Template ID do SendGrid</span>
              <input
                className="input-field"
                value={templateDraft.templateId}
                onChange={(event) => onChangeTemplate({ ...templateDraft, templateId: event.target.value })}
                placeholder="d-123abc..."
              />
            </label>
            <div className="note-block">
              <strong>Preview remoto</strong>
              <p>
                O app envia `dynamic_template_data` para o template `d-*`, mas o HTML final e
                renderizado pelo SendGrid. O preview local mostra apenas os dados do contato.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="form-grid">
              <label>
                <span>Assunto embutido do template</span>
                <input
                  className="input-field"
                  value={templateDraft.subject}
                  onChange={(event) => onChangeTemplate({ ...templateDraft, subject: event.target.value })}
                  placeholder="Opcional. Se vazio, o assunto da campanha sera usado."
                />
              </label>
            </div>
            <div className="editor-shell">
              <Editor
                height="420px"
                defaultLanguage="html"
                language="html"
                theme="vs-light"
                value={templateDraft.html}
                onChange={(value) => onChangeTemplate({ ...templateDraft, html: value || '' })}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on'
                }}
              />
            </div>
          </>
        )}
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Variaveis</p>
            <h3>Campos disponiveis para personalizacao</h3>
          </div>
        </div>
        <div className="pill-row">
          {availableFields.map((field) => (
            <span key={field} className="variable-pill">
              {`{{${field}}}`}
            </span>
          ))}
        </div>
        <div className="note-block">
          <strong>Regras de seguranca</strong>
          <p>
            O app aceita somente <code>{'{{variavel}}'}</code> com escape automatico. Tags raw sao
            bloqueadas para evitar injecao no preview e no envio.
          </p>
        </div>
        <div className="preview-shell">
          <div className="preview-header">
            <span>Preview</span>
            <strong>{preview?.subject || 'Sem assunto'}</strong>
          </div>
          {preview?.type === 'remote_dynamic_template' ? (
            <div className="note-block">
              <strong>Template remoto</strong>
              <p>{preview.notice}</p>
            </div>
          ) : (
            <div className="preview-frame" dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
          )}
        </div>
      </article>
    </section>
  );
}
