import path from 'node:path';
import fs from 'node:fs/promises';
import { dialog, ipcMain } from 'electron';
import { DEFAULT_SEND_CONFIG, DEFAULT_TEMPLATE_DRAFT } from '../shared/constants.js';
import { syncTemplateDraft } from '../shared/templateCatalog.js';
import { parseContactsWorkbook, parseTemplateFile } from './services/fileParser.js';
import { extractTemplateVariables, renderLocalTemplate } from './services/templateEngine.js';
import { parseRecipientList, sanitizeText } from './services/validation.js';
import { exportCampaignResultsCsv } from './services/reportService.js';
import { buildSubscriptionTrackingContent } from './services/emailService.js';

function normalizeConfigPayload(config = {}) {
  const nextConfig = {
    ...DEFAULT_SEND_CONFIG,
    ...config
  };

  if (nextConfig.sendMode !== 'shared_bcc' && nextConfig.sendMode !== 'individual') {
    nextConfig.sendMode = DEFAULT_SEND_CONFIG.sendMode;
  }

  if (nextConfig.sendMode === 'shared_bcc') {
    nextConfig.enablePersonalization = false;
  }

  return nextConfig;
}

function buildBootstrap(database) {
  const configDraft = normalizeConfigPayload(database.getConfigDraft() || {});

  return {
    contacts: database.listTempContacts(),
    contactGroups: database.listContactGroups(),
    templateDraft: syncTemplateDraft({
      ...DEFAULT_TEMPLATE_DRAFT,
      ...(database.getTemplateDraft() || {})
    }),
    configDraft,
    eligibleContactsCount: database.countEligibleContacts(configDraft.selectedGroupIds || []),
    history: database.listCampaignHistory()
  };
}

function appendPreviewUnsubscribe(html, config) {
  if (!config.enableSubscriptionTracking) {
    return html;
  }

  const trackingContent = buildSubscriptionTrackingContent(config, { preview: true });
  const unsubscribeHtml = `<div data-preview-unsubscribe="true">${trackingContent.html}</div>`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeHtml}</body>`);
  }

  return `${html}${unsubscribeHtml}`;
}

function toUiPreview(template, config, sampleContact) {
  if (template.mode === 'sendgrid_dynamic') {
    return {
      type: 'remote_dynamic_template',
      subject: config.subject || '',
      html: '',
      text: '',
      notice:
        'Templates dinamicos do SendGrid sao renderizados remotamente. O app mostra os dados enviados, nao o HTML final.'
    };
  }

  const rendered = renderLocalTemplate({
    template,
    contact: sampleContact,
    campaignConfig: config
  });

  return {
    type: 'local_template',
    ...rendered,
    html: appendPreviewUnsubscribe(rendered.html, config),
    notice: ''
  };
}

function getEligibleContactsForConfig(database, config) {
  return database.getEligibleContacts(config.selectedGroupIds || []);
}

export function registerIpcHandlers({ database, queueManager }) {
  ipcMain.handle('app:get-bootstrap', async () => buildBootstrap(database));

  ipcMain.handle('contacts:import', async () => {
    const selection = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Planilhas Excel', extensions: ['xlsx'] }]
    });

    if (selection.canceled || !selection.filePaths[0]) {
      return null;
    }

    const parsedWorkbook = await parseContactsWorkbook(selection.filePaths[0]);
    const contacts = database.replaceTempContacts(parsedWorkbook);

    return {
      summary: {
        fileName: parsedWorkbook.fileName,
        totalRows: parsedWorkbook.totalRows,
        validRows: parsedWorkbook.validRows,
        invalidRows: parsedWorkbook.invalidRows
      },
      contacts
    };
  });

  ipcMain.handle('contacts:list', async () => database.listTempContacts());

  ipcMain.handle('contacts:remove', async (_event, ids) => database.removeTempContacts(ids));

  ipcMain.handle('contacts:exclude', async (_event, ids, excluded) =>
    database.toggleTempContactExclusion(ids, excluded)
  );

  ipcMain.handle('contacts:clear', async () => {
    database.clearTempContacts();
    return [];
  });

  ipcMain.handle('contacts:eligible-count', async (_event, groupIds = []) =>
    database.countEligibleContacts(groupIds || [])
  );

  ipcMain.handle('groups:list', async () => database.listContactGroups());

  ipcMain.handle('groups:create', async (_event, payload) =>
    database.createContactGroup(payload)
  );

  ipcMain.handle('groups:delete', async (_event, groupId) =>
    database.deleteContactGroup(groupId)
  );

  ipcMain.handle('groups:add-members', async (_event, groupId, contacts) =>
    database.addContactsToGroup(groupId, contacts)
  );

  ipcMain.handle('groups:remove-members', async (_event, groupId, contacts) =>
    database.removeContactsFromGroup(groupId, contacts)
  );

  ipcMain.handle('template:import', async () => {
    const selection = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Templates', extensions: ['html', 'eml'] }]
    });

    if (selection.canceled || !selection.filePaths[0]) {
      return null;
    }

    const template = await parseTemplateFile(selection.filePaths[0]);
    database.saveTemplateDraft(template);
    return template;
  });

  ipcMain.handle('template:save', async (_event, template) => {
    const nextTemplate = syncTemplateDraft({
      ...DEFAULT_TEMPLATE_DRAFT,
      ...template
    });
    nextTemplate.variables =
      nextTemplate.mode === 'sendgrid_dynamic'
        ? nextTemplate.variables || []
        : extractTemplateVariables(nextTemplate.subject, nextTemplate.html, nextTemplate.text);

    database.saveTemplateDraft(nextTemplate);
    return nextTemplate;
  });

  ipcMain.handle('template:preview', async (_event, { template, config }) => {
    const normalizedConfig = normalizeConfigPayload(config);
    const eligibleContacts = getEligibleContactsForConfig(database, normalizedConfig);
    const sampleContact = eligibleContacts[0] || {
      email: normalizedConfig.senderEmail || 'preview@example.com',
      name: 'Contato Exemplo',
      variables: {}
    };

    return toUiPreview(template, normalizedConfig, sampleContact);
  });

  ipcMain.handle('config:save', async (_event, config) => {
    const nextConfig = normalizeConfigPayload(config);
    database.saveConfigDraft(nextConfig);
    return nextConfig;
  });

  ipcMain.handle('campaign:send-test', async (_event, { config, template, recipientsText }) => {
    const normalizedConfig = normalizeConfigPayload(config);
    const { recipients, errors } = parseRecipientList(recipientsText);
    if (!recipients.length) {
      throw new Error('Informe pelo menos um email de teste valido.');
    }

    if (errors.length) {
      throw new Error(`Emails de teste invalidos: ${errors.join(', ')}`);
    }

    const eligibleContacts = getEligibleContactsForConfig(database, normalizedConfig);
    const sampleContact = eligibleContacts[0] || {
      email: normalizedConfig.senderEmail,
      name: 'Contato Teste',
      variables: {}
    };
    const preview = toUiPreview(template, normalizedConfig, sampleContact);
    const results = await queueManager.sendTest({
      config: normalizedConfig,
      template,
      testRecipients: recipients,
      sampleContact
    });

    return {
      preview,
      sampleContact,
      results
    };
  });

  ipcMain.handle('campaign:start', async (_event, { config, template }) => {
    const normalizedConfig = normalizeConfigPayload(config);
    const contacts = getEligibleContactsForConfig(database, normalizedConfig);
    const uniqueContacts = queueManager.emailService.normalizeContactsForSend(contacts);
    if (queueManager.getCurrentCampaign()) {
      throw new Error('Ja existe uma campanha em andamento.');
    }

    if (!uniqueContacts.length) {
      if ((normalizedConfig.selectedGroupIds || []).length) {
        throw new Error(
          'Os grupos selecionados nao tem contatos validos disponiveis para envio. Revise os grupos ativos ou reimporte a base.'
        );
      }

      throw new Error(
        'Nao ha contatos elegiveis para envio. Importe uma base ou selecione um grupo com contatos validos.'
      );
    }

    queueManager.emailService.validateConfig(normalizedConfig, template, uniqueContacts);
    database.saveConfigDraft(normalizedConfig);
    database.saveTemplateDraft(template);

    queueManager.startCampaign({ config: normalizedConfig, template, contacts: uniqueContacts }).catch((error) => {
      queueManager.emit('error', {
        message: error.message,
        createdAt: new Date().toISOString()
      });
    });

    return {
      started: true,
      totalContacts: uniqueContacts.length
    };
  });

  ipcMain.handle('campaign:pause', async () => {
    queueManager.pauseCampaign();
    return true;
  });

  ipcMain.handle('campaign:resume', async () => {
    queueManager.resumeCampaign();
    return true;
  });

  ipcMain.handle('campaign:cancel', async () => {
    queueManager.cancelCampaign();
    return true;
  });

  ipcMain.handle('campaign:history', async () => database.listCampaignHistory());

  ipcMain.handle('campaign:results', async (_event, campaignId) => ({
    results: database.listCampaignResults(campaignId),
    logs: database.listCampaignLogs(campaignId),
    history: database.listCampaignHistory().find((item) => item.id === campaignId) || null
  }));

  ipcMain.handle('campaign:purge-details', async (_event, campaignId) => {
    database.purgeCampaignDetails(campaignId);
    return database.listCampaignHistory();
  });

  ipcMain.handle('campaign:export-report', async (_event, campaignId) => {
    const campaign = database.listCampaignHistory().find((item) => item.id === campaignId);
    if (!campaign) {
      throw new Error('Campanha nao encontrada.');
    }

    const results = database.listCampaignResults(campaignId);
    if (!results.length) {
      throw new Error('Nao ha detalhes suficientes para exportar este relatorio.');
    }

    const suggestedName = `relatorio-${sanitizeText(campaign.subject || campaignId, {
      maxLength: 40
    }).replace(/\s+/g, '-').toLowerCase() || campaignId}.csv`;

    const selection = await dialog.showSaveDialog({
      defaultPath: path.join(process.cwd(), suggestedName),
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });

    if (selection.canceled || !selection.filePath) {
      return null;
    }

    await exportCampaignResultsCsv(selection.filePath, campaign, results);
    return selection.filePath;
  });

  ipcMain.handle('system:read-log-file', async (_event, filePath) => {
    return fs.readFile(filePath, 'utf8');
  });
}
