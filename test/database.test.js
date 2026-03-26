/** @vitest-environment node */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('databaseService eligible contacts', () => {
  it('keeps group members eligible even after clearing the temporary import list', () => {
    const script = `
      import fs from 'node:fs';
      import os from 'node:os';
      import path from 'node:path';
      import { DatabaseService } from '${pathToFileURL(
        path.resolve(process.cwd(), 'main/services/database.js')
      ).href}';

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envio-db-'));
      const database = new DatabaseService(path.join(tempDir, 'envio-de-email.sqlite'));
      database.initialize();

      const parsedWorkbook = {
        sourcePath: 'C:/tmp/contatos.xlsx',
        fileName: 'contatos.xlsx',
        totalRows: 2,
        validRows: 2,
        invalidRows: 0,
        contacts: [
          {
            email: 'Primeiro@Example.com',
            name: 'Primeiro',
            variables: { city: 'Osasco' },
            isValid: true,
            validationError: '',
            rowNumber: 2
          },
          {
            email: 'segundo@example.com',
            name: 'Segundo',
            variables: { city: 'Sao Paulo' },
            isValid: true,
            validationError: '',
            rowNumber: 3
          }
        ]
      };

      const importedContacts = database.replaceTempContacts(parsedWorkbook);
      database.createContactGroup({ name: 'Grupo NF', description: '' });
      const group = database.listContactGroups().find((item) => item.name === 'Grupo NF');
      database.addContactsToGroup(group.id, importedContacts);
      database.clearTempContacts();

      const output = {
        tempContacts: database.listTempContacts().length,
        eligibleContacts: database.getEligibleContacts([group.id]).map((contact) => contact.email),
        eligibleCount: database.countEligibleContacts([group.id])
      };

      console.log(JSON.stringify(output));
    `;

    const rawOutput = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: process.cwd(),
      encoding: 'utf8'
    }).trim();
    const parsed = JSON.parse(rawOutput);

    expect(parsed.tempContacts).toBe(0);
    expect(parsed.eligibleContacts).toEqual(['primeiro@example.com', 'segundo@example.com']);
    expect(parsed.eligibleCount).toBe(2);
  });
});
