import validator from 'validator';
import {
  DEFAULT_BRAND_LOGO_URL,
  DEFAULT_BRAND_NAME
} from '../../shared/constants.js';

export const RESERVED_HEADERS = new Set([
  'x-sg-id',
  'x-sg-eid',
  'received',
  'dkim-signature',
  'content-type',
  'content-transfer-encoding',
  'to',
  'from',
  'subject',
  'reply-to',
  'cc',
  'bcc'
]);

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;
const HEADER_KEY_PATTERN = /^[A-Za-z0-9-]{1,100}$/;
const DOT_PATH_SEGMENT = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

export function sanitizeText(value, { maxLength = 512, allowEmpty = true } = {}) {
  const normalized = String(value ?? '')
    .replace(CONTROL_CHARACTERS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

  if (!allowEmpty && !normalized) {
    return '';
  }

  return normalized;
}

export function isValidEmail(email) {
  return validator.isEmail(String(email ?? '').trim(), {
    allow_utf8_local_part: false,
    ignore_max_length: false
  });
}

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function normalizeName(name) {
  return sanitizeText(name, { maxLength: 120 });
}

export function normalizeSubject(subject) {
  return sanitizeText(subject, { maxLength: 250, allowEmpty: false });
}

export function sanitizeVariableKey(key) {
  const value = sanitizeText(key, { maxLength: 80, allowEmpty: false });
  if (!value || !DOT_PATH_SEGMENT.test(value)) {
    return null;
  }

  return value;
}

export function sanitizeVariableValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return String(value)
    .replace(CONTROL_CHARACTERS, ' ')
    .trim()
    .slice(0, 2000);
}

export function sanitizeCustomVariables(record) {
  const cleanRecord = {};

  for (const [key, value] of Object.entries(record ?? {})) {
    const safeKey = sanitizeVariableKey(key);
    if (!safeKey) {
      continue;
    }

    cleanRecord[safeKey] = sanitizeVariableValue(value);
  }

  return cleanRecord;
}

export function buildBrandVariables(config = {}) {
  return {
    brand_name:
      sanitizeText(config.brandName || DEFAULT_BRAND_NAME, {
        maxLength: 120,
        allowEmpty: false
      }) || DEFAULT_BRAND_NAME,
    brand_logo_url:
      sanitizeText(config.brandLogoUrl || DEFAULT_BRAND_LOGO_URL, {
        maxLength: 1000,
        allowEmpty: false
      }) || DEFAULT_BRAND_LOGO_URL,
  };
}

export function parseAddressToken(token) {
  const raw = sanitizeText(token, { maxLength: 256, allowEmpty: false });
  if (!raw) {
    return null;
  }

  const angleMatch = raw.match(/^(?<name>.*?)<(?<email>[^>]+)>$/);
  if (angleMatch?.groups) {
    const email = normalizeEmail(angleMatch.groups.email);
    if (!isValidEmail(email)) {
      return null;
    }

    return {
      email,
      name: normalizeName(angleMatch.groups.name.replace(/^"|"$/g, ''))
    };
  }

  const email = normalizeEmail(raw);
  if (!isValidEmail(email)) {
    return null;
  }

  return {
    email,
    name: ''
  };
}

export function parseRecipientList(value) {
  const tokens = String(value ?? '')
    .split(/[\n,;]+/g)
    .map((token) => token.trim())
    .filter(Boolean);

  const recipients = [];
  const errors = [];
  const seen = new Set();

  for (const token of tokens) {
    const parsed = parseAddressToken(token);
    if (!parsed) {
      errors.push(token);
      continue;
    }

    if (seen.has(parsed.email)) {
      continue;
    }

    seen.add(parsed.email);
    recipients.push(parsed);
  }

  return { recipients, errors };
}

export function normalizeHeaderPairs(headers = []) {
  const normalized = [];

  for (const header of headers) {
    const key = sanitizeText(header?.key, { maxLength: 100, allowEmpty: false });
    const value = sanitizeText(header?.value, { maxLength: 400, allowEmpty: false });
    const normalizedKey = key.toLowerCase();

    if (!key || !value) {
      continue;
    }

    if (!HEADER_KEY_PATTERN.test(key)) {
      throw new Error(`Cabecalho invalido: ${key}`);
    }

    if (RESERVED_HEADERS.has(normalizedKey)) {
      throw new Error(`Cabecalho reservado pelo SendGrid: ${key}`);
    }

    normalized.push({ key, value });
  }

  return normalized;
}

export function buildContactVariables(contact) {
  return {
    email: contact.email,
    name: contact.name,
    ...sanitizeCustomVariables(contact.variables)
  };
}
