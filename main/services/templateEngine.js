import { convert } from 'html-to-text';
import {
  buildBrandVariables,
  buildContactVariables,
  normalizeSubject,
  sanitizeText,
  sanitizeVariableKey,
  sanitizeVariableValue
} from './validation.js';

const VARIABLE_PATTERN = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;
const RAW_TAG_PATTERN = /{{{\s*[A-Za-z0-9_.-]+\s*}}}/g;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolvePath(source, key) {
  return key.split('.').reduce((current, segment) => current?.[segment], source);
}

function renderSection(template, data, { escapeValues = true } = {}) {
  if (!template) {
    return '';
  }

  return template.replace(VARIABLE_PATTERN, (_, key) => {
    const value = resolvePath(data, key);
    const safeValue = sanitizeVariableValue(value);
    if (safeValue === null || safeValue === undefined) {
      return '';
    }

    return escapeValues ? escapeHtml(safeValue) : String(safeValue);
  });
}

export function extractTemplateVariables(...sections) {
  const variableSet = new Set();

  for (const section of sections) {
    const content = String(section ?? '');
    if (!content) {
      continue;
    }

    for (const rawTag of content.match(RAW_TAG_PATTERN) ?? []) {
      throw new Error(`A tag ${rawTag} nao e permitida. Use somente {{variavel}}.`);
    }

    for (const match of content.matchAll(VARIABLE_PATTERN)) {
      const key = sanitizeVariableKey(match[1]);
      if (key) {
        variableSet.add(key);
      }
    }
  }

  return Array.from(variableSet).sort((left, right) => left.localeCompare(right));
}

export function buildPreviewContext(contact, additional = {}) {
  return {
    contact: buildContactVariables(contact),
    ...buildContactVariables(contact),
    ...additional
  };
}

export function renderLocalTemplate({ template, contact, campaignConfig = {}, additionalContext = {} }) {
  const context = buildPreviewContext(contact, {
    ...buildBrandVariables(campaignConfig),
    ...additionalContext
  });
  const html = renderSection(template.html, context, { escapeValues: true });
  const textFromTemplate = renderSection(template.text, context, { escapeValues: false });
  const text =
    textFromTemplate ||
    convert(html, {
      selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } }
      ],
      wordwrap: 120
    });
  const subjectSource = template.subject || campaignConfig.subject || '';
  const subject = normalizeSubject(renderSection(subjectSource, context, { escapeValues: false })) || subjectSource;

  return {
    subject,
    html,
    text
  };
}

export function summarizeTemplate(template) {
  return {
    mode: template.mode,
    sourceType: template.sourceType,
    fileName: template.fileName,
    subject: sanitizeText(template.subject, { maxLength: 250 }),
    variables: extractTemplateVariables(template.subject, template.html, template.text),
    templateId: sanitizeText(template.templateId, { maxLength: 128 })
  };
}
