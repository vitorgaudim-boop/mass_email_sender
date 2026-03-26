import fs from 'node:fs/promises';
import path from 'node:path';
import xlsx from 'xlsx';
import emlFormat from 'eml-format';
import {
  isValidEmail,
  normalizeEmail,
  normalizeName,
  sanitizeCustomVariables,
  sanitizeText
} from './validation.js';
import { extractTemplateVariables } from './templateEngine.js';

function normalizeHeaderName(header) {
  const normalized = sanitizeText(header, { maxLength: 100 }).toLowerCase();
  if (!normalized || normalized.startsWith('__empty')) {
    return '';
  }

  return normalized;
}

function parseEml(content) {
  return new Promise((resolve, reject) => {
    emlFormat.read(content, (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(data);
    });
  });
}

export async function parseContactsWorkbook(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('O arquivo XLSX nao possui abas legiveis.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows.length) {
    throw new Error('A planilha nao possui linhas para importar.');
  }

  const contacts = rows.map((rawRow, index) => {
    const normalizedRow = {};

    for (const [key, value] of Object.entries(rawRow)) {
      const normalizedKey = normalizeHeaderName(key);
      if (!normalizedKey) {
        continue;
      }

      normalizedRow[normalizedKey] = value;
    }

    const email = normalizeEmail(normalizedRow.email);
    const name = normalizeName(normalizedRow.name);
    const variables = sanitizeCustomVariables(
      Object.fromEntries(
        Object.entries(normalizedRow).filter(([key]) => !['email', 'name'].includes(key))
      )
    );
    const isValid = isValidEmail(email);

    return {
      email,
      name,
      variables,
      isValid,
      validationError: isValid ? '' : 'Endereco de email invalido.',
      rowNumber: index + 2
    };
  });

  const validRows = contacts.filter((contact) => contact.isValid).length;
  const invalidRows = contacts.length - validRows;

  return {
    fileName: path.basename(filePath),
    sourcePath: filePath,
    totalRows: contacts.length,
    validRows,
    invalidRows,
    contacts
  };
}

export async function parseTemplateFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  if (!['.html', '.eml'].includes(extension)) {
    throw new Error('Somente arquivos .html e .eml sao suportados.');
  }

  const raw = await fs.readFile(filePath, 'utf8');

  if (extension === '.html') {
    return {
      mode: 'local',
      sourceType: 'html',
      fileName,
      html: raw,
      text: '',
      subject: '',
      templateId: '',
      variables: extractTemplateVariables(raw)
    };
  }

  const eml = await parseEml(raw);
  const html = eml.html || eml.texthtml || '';
  const text = eml.text || '';
  const subject = sanitizeText(eml.subject, { maxLength: 250 });

  return {
    mode: 'local',
    sourceType: 'eml',
    fileName,
    html,
    text,
    subject,
    templateId: '',
    variables: extractTemplateVariables(subject, html, text)
  };
}
