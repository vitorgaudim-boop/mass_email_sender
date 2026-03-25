import { describe, expect, it } from 'vitest';
import { normalizeHeaderPairs, parseRecipientList, sanitizeCustomVariables } from '../main/services/validation.js';

describe('validation helpers', () => {
  it('parses comma and line-separated recipient lists', () => {
    const parsed = parseRecipientList('One <one@example.com>,\ntwo@example.com');

    expect(parsed.errors).toEqual([]);
    expect(parsed.recipients).toEqual([
      { email: 'one@example.com', name: 'One' },
      { email: 'two@example.com', name: '' }
    ]);
  });

  it('blocks reserved SendGrid headers', () => {
    expect(() => normalizeHeaderPairs([{ key: 'Subject', value: 'nope' }])).toThrow(/reservado/i);
  });

  it('sanitizes custom variable payloads to primitives', () => {
    const sanitized = sanitizeCustomVariables({
      name: 'Alice',
      nested: { city: 'Sao Paulo' },
      amount: 10
    });

    expect(sanitized).toEqual({
      amount: 10,
      name: 'Alice',
      nested: '[object Object]'
    });
  });
});
