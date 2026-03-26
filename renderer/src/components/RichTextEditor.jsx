import { useEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2
} from 'lucide-react';

function sanitizeEditorHtml(html) {
  return DOMPurify.sanitize(html || '', {
    USE_PROFILES: { html: true }
  });
}

function normalizeEmptyHtml(html) {
  const cleaned = String(html || '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  return cleaned.length === 0;
}

function ToolbarButton({ label, icon, onClick }) {
  return (
    <button
      type="button"
      className="rich-editor-button"
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export function RichTextEditor({ value, onChange, availableFields = [], fontFamily }) {
  const editorRef = useRef(null);

  const sanitizedValue = useMemo(() => sanitizeEditorHtml(value), [value]);
  const editorIsEmpty = normalizeEmptyHtml(sanitizedValue);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== sanitizedValue) {
      editor.innerHTML = sanitizedValue;
    }
  }, [sanitizedValue]);

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    onChange(sanitizeEditorHtml(editor.innerHTML));
  }

  function runCommand(command, commandValue = null) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function insertVariable(variableName) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand('insertText', false, `{{${variableName}}}`);
    emitChange();
  }

  function createLink() {
    const url = window.prompt('Cole a URL do link');
    if (!url) {
      return;
    }

    runCommand('createLink', url);
  }

  return (
    <div className="rich-editor-shell">
      <div className="rich-editor-toolbar">
        <div className="rich-editor-toolbar-group">
          <ToolbarButton label="Desfazer" icon={<Undo2 size={16} />} onClick={() => runCommand('undo')} />
          <ToolbarButton label="Refazer" icon={<Redo2 size={16} />} onClick={() => runCommand('redo')} />
        </div>

        <div className="rich-editor-toolbar-group">
          <ToolbarButton label="Negrito" icon={<Bold size={16} />} onClick={() => runCommand('bold')} />
          <ToolbarButton label="Itálico" icon={<Italic size={16} />} onClick={() => runCommand('italic')} />
          <ToolbarButton label="Sublinhado" icon={<Underline size={16} />} onClick={() => runCommand('underline')} />
          <ToolbarButton label="Título" icon={<Heading2 size={16} />} onClick={() => runCommand('formatBlock', 'h2')} />
        </div>

        <div className="rich-editor-toolbar-group">
          <ToolbarButton label="Lista" icon={<List size={16} />} onClick={() => runCommand('insertUnorderedList')} />
          <ToolbarButton
            label="Lista numerada"
            icon={<ListOrdered size={16} />}
            onClick={() => runCommand('insertOrderedList')}
          />
          <ToolbarButton label="Link" icon={<Link2 size={16} />} onClick={createLink} />
          <ToolbarButton label="Limpar formatação" icon={<Eraser size={16} />} onClick={() => runCommand('removeFormat')} />
        </div>

        <div className="rich-editor-toolbar-group">
          <ToolbarButton label="Alinhar à esquerda" icon={<AlignLeft size={16} />} onClick={() => runCommand('justifyLeft')} />
          <ToolbarButton label="Centralizar" icon={<AlignCenter size={16} />} onClick={() => runCommand('justifyCenter')} />
          <ToolbarButton label="Alinhar à direita" icon={<AlignRight size={16} />} onClick={() => runCommand('justifyRight')} />
        </div>

        <div className="rich-editor-toolbar-group">
          <input
            className="rich-editor-color"
            type="color"
            defaultValue="#2b2034"
            onInput={(event) => runCommand('foreColor', event.currentTarget.value)}
            title="Cor do texto"
          />
        </div>
      </div>

      <div className="rich-editor-variable-row">
        <span>Inserir variável:</span>
        <div className="pill-row">
          {availableFields.map((field) => (
            <button
              key={field}
              type="button"
              className="variable-pill variable-pill-button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertVariable(field)}
            >
              {`{{${field}}}`}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={editorRef}
        className="rich-editor-surface"
        contentEditable
        suppressContentEditableWarning
        style={{ fontFamily }}
        data-placeholder="Escreva aqui o conteúdo do email. Você pode usar negrito, listas, links e variáveis."
        data-empty={editorIsEmpty ? 'true' : 'false'}
        onInput={emitChange}
        onBlur={emitChange}
      />
    </div>
  );
}
