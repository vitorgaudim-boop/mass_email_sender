import { randomUUID } from 'node:crypto';
import {
  buildBrandVariables,
  buildContactVariables,
  isValidEmail,
  normalizeHeaderPairs,
  normalizeSubject,
  parseRecipientList,
  sanitizeText
} from './validation.js';
import { extractTemplateVariables, renderLocalTemplate, summarizeTemplate } from './templateEngine.js';
import {
  DEFAULT_SUBSCRIPTION_TRACKING_HTML,
  DEFAULT_SUBSCRIPTION_TRACKING_TEXT,
  PREVIEW_UNSUBSCRIBE_URL,
  SENDGRID_UNSUBSCRIBE_TAG,
  UNSUBSCRIBE_URL_VARIABLE
} from '../../shared/constants.js';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sanitizeAddress(recipient, fallbackName = '') {
  return {
    email: recipient.email,
    ...(recipient.name || fallbackName ? { name: recipient.name || fallbackName } : {})
  };
}

function normalizeEmailKey(email) {
  return String(email ?? '').trim().toLowerCase();
}

function dedupeContacts(contacts = []) {
  const uniqueContacts = [];
  const seenEmails = new Set();

  for (const contact of contacts) {
    const emailKey = normalizeEmailKey(contact?.email);

    if (!emailKey || seenEmails.has(emailKey)) {
      continue;
    }

    seenEmails.add(emailKey);
    uniqueContacts.push({
      ...contact,
      email: emailKey
    });
  }

  return uniqueContacts;
}

function buildUniqueRecipientSets({ to = [], cc = [], bcc = [] }) {
  const seenEmails = new Set();

  function takeUnique(recipients) {
    const uniqueRecipients = [];

    for (const recipient of recipients) {
      const emailKey = normalizeEmailKey(recipient?.email);

      if (!emailKey || seenEmails.has(emailKey)) {
        continue;
      }

      seenEmails.add(emailKey);
      uniqueRecipients.push(sanitizeAddress({
        ...recipient,
        email: emailKey
      }));
    }

    return uniqueRecipients;
  }

  const uniqueTo = takeUnique(to);
  const uniqueCc = takeUnique(cc);
  const uniqueBcc = takeUnique(bcc);

  return {
    to: uniqueTo,
    ...(uniqueCc.length ? { cc: uniqueCc } : {}),
    ...(uniqueBcc.length ? { bcc: uniqueBcc } : {})
  };
}

function parseAddressLists(config) {
  const cc = parseRecipientList(config.ccListText);
  const bcc = parseRecipientList(config.bccListText);

  if (cc.errors.length) {
    throw new Error(`Existem enderecos invalidos em CC: ${cc.errors.join(', ')}`);
  }

  if (bcc.errors.length) {
    throw new Error(`Existem enderecos invalidos em BCC: ${bcc.errors.join(', ')}`);
  }

  if (cc.recipients.length > 1000) {
    throw new Error('A lista fixa de CC nao pode ultrapassar 1000 enderecos.');
  }

  if (bcc.recipients.length > 1000) {
    throw new Error('A lista fixa de BCC nao pode ultrapassar 1000 enderecos.');
  }

  return { cc: cc.recipients, bcc: bcc.recipients };
}

function ensureHtmlSubscriptionLink(source, urlValue) {
  const html = String(source || '').trim();

  if (!html) {
    return '';
  }

  const withUrl = html.includes(UNSUBSCRIBE_URL_VARIABLE)
    ? html.replaceAll(UNSUBSCRIBE_URL_VARIABLE, urlValue)
    : `${html}<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6f5f78;">Para deixar de receber estes emails, <a href="${urlValue}" style="color:#7b27c0;text-decoration:underline;">clique aqui para cancelar a inscricao</a>.</p>`;

  return withUrl;
}

function ensureTextSubscriptionLink(source, urlValue) {
  const text = String(source || '').trim();

  if (!text) {
    return '';
  }

  if (text.includes(UNSUBSCRIBE_URL_VARIABLE)) {
    return text.replaceAll(UNSUBSCRIBE_URL_VARIABLE, urlValue);
  }

  return `${text}\n${urlValue}`;
}

export function buildSubscriptionTrackingContent(config, { preview = false } = {}) {
  if (!config.enableSubscriptionTracking) {
    return { html: '', text: '' };
  }

  const urlValue = preview ? PREVIEW_UNSUBSCRIBE_URL : SENDGRID_UNSUBSCRIBE_TAG;
  const htmlSource = config.subscriptionTrackingHtml || DEFAULT_SUBSCRIPTION_TRACKING_HTML;
  const textSource = config.subscriptionTrackingText || DEFAULT_SUBSCRIPTION_TRACKING_TEXT;

  return {
    html: ensureHtmlSubscriptionLink(htmlSource, urlValue),
    text: ensureTextSubscriptionLink(textSource, urlValue)
  };
}

function appendSubscriptionTracking(renderedContent, config) {
  if (!config.enableSubscriptionTracking) {
    return renderedContent;
  }

  const trackingContent = buildSubscriptionTrackingContent(config, { preview: false });
  const nextHtml = renderedContent.html.includes('</body>')
    ? renderedContent.html.replace('</body>', `${trackingContent.html}</body>`)
    : `${renderedContent.html}${trackingContent.html}`;
  const nextText = renderedContent.text
    ? `${renderedContent.text}\n\n${trackingContent.text}`
    : trackingContent.text;

  return {
    ...renderedContent,
    html: nextHtml,
    text: nextText
  };
}

function buildTrackingSettings(config, { useSubstitutionTag = false } = {}) {
  if (!config.enableSubscriptionTracking) {
    return null;
  }

  if (useSubstitutionTag) {
    return {
      subscription_tracking: {
        enable: true,
        substitution_tag: SENDGRID_UNSUBSCRIBE_TAG
      }
    };
  }

  return {
    subscription_tracking: {
      enable: true,
      text: config.subscriptionTrackingText || DEFAULT_SUBSCRIPTION_TRACKING_TEXT,
      html: config.subscriptionTrackingHtml || DEFAULT_SUBSCRIPTION_TRACKING_HTML
    }
  };
}

function buildAsm(config) {
  const groupId = Number(config.asmGroupId);
  if (!Number.isInteger(groupId) || groupId <= 0) {
    return null;
  }

  return {
    group_id: groupId
  };
}

function buildBaseMessage(config, template, renderedContent = null) {
  const headers = normalizeHeaderPairs(config.customHeaders);
  const trackingSettings = buildTrackingSettings(config, {
    useSubstitutionTag: template.mode === 'local'
  });
  const asm = buildAsm(config);
  const baseMessage = {
    from: {
      email: config.senderEmail,
      ...(config.senderName ? { name: config.senderName } : {})
    },
    ...(config.replyToEmail
      ? {
          reply_to: {
            email: config.replyToEmail,
            ...(config.replyToName ? { name: config.replyToName } : {})
          }
        }
      : {}),
    ...(trackingSettings ? { tracking_settings: trackingSettings } : {}),
    ...(asm ? { asm } : {}),
    ...(headers.length
      ? {
          headers: Object.fromEntries(headers.map((header) => [header.key, header.value]))
        }
      : {})
  };

  if (template.mode === 'sendgrid_dynamic') {
    return {
      ...baseMessage,
      ...(config.subject ? { subject: config.subject } : {}),
      template_id: template.templateId
    };
  }

  return {
    ...baseMessage,
    subject: renderedContent?.subject || config.subject,
    content: [
      {
        type: 'text/plain',
        value: renderedContent?.text || ''
      },
      {
        type: 'text/html',
        value: renderedContent?.html || ''
      }
    ]
  };
}

function buildPersonalizationMetadata(campaignId, batchIndex, contact) {
  return {
    campaignId,
    batchIndex,
    contactId: contact?.id || '',
    contactEmail: contact?.email || ''
  };
}

function buildDynamicPersonalization(contact, config, ccList, bccList, campaignId, batchIndex) {
  const data = {
    ...buildContactVariables(contact),
    ...buildBrandVariables(config)
  };
  const recipients = buildUniqueRecipientSets({
    to: [sanitizeAddress(contact)],
    cc: ccList,
    bcc: bccList
  });

  return {
    ...recipients,
    dynamic_template_data: data,
    custom_args: buildPersonalizationMetadata(campaignId, batchIndex, contact)
  };
}

function buildRenderedMessageForContact(template, contact, config) {
  return appendSubscriptionTracking(
    renderLocalTemplate({
      template,
      contact,
      campaignConfig: config
    }),
    config
  );
}

function buildRequestUnit({ payload, contacts, requestStrategy, description }) {
  return {
    id: randomUUID(),
    payload,
    contacts,
    requestStrategy,
    description
  };
}

function getTemplateVariables(template) {
  if ((template.variables || []).length) {
    return template.variables;
  }

  if (template.mode !== 'local') {
    return [];
  }

  return extractTemplateVariables(template.subject, template.html, template.text);
}

function buildLocalBatchRequests({ contacts, template, config, ccList, bccList, campaignId, batchIndex }) {
  const uniqueContacts = dedupeContacts(contacts);
  const personalized = config.enablePersonalization && getTemplateVariables(template).length > 0;

  if (personalized) {
    return uniqueContacts.map((contact) => {
      const rendered = buildRenderedMessageForContact(template, contact, config);
      const recipients = buildUniqueRecipientSets({
        to: [sanitizeAddress(contact)],
        cc: ccList,
        bcc: bccList
      });
      const payload = {
        ...buildBaseMessage(config, template, rendered),
        personalizations: [
          {
            ...recipients,
            custom_args: buildPersonalizationMetadata(campaignId, batchIndex, contact)
          }
        ]
      };

      return buildRequestUnit({
        payload,
        contacts: [contact],
        requestStrategy: 'local_individual_request',
        description: `Envio individual para ${contact.email}`
      });
    });
  }

  const rendered = renderLocalTemplate({
    template,
    contact: { email: '', name: '', variables: {} },
    campaignConfig: config
  });
  const renderedWithTracking = appendSubscriptionTracking(rendered, config);
  const payload = {
    ...buildBaseMessage(config, template, renderedWithTracking),
    personalizations: uniqueContacts.map((contact) => ({
      ...buildUniqueRecipientSets({
        to: [sanitizeAddress(contact)],
        cc: ccList,
        bcc: bccList
      }),
      custom_args: buildPersonalizationMetadata(campaignId, batchIndex, contact)
    }))
  };

  return [
    buildRequestUnit({
      payload,
      contacts: uniqueContacts,
      requestStrategy: 'local_batch_request',
      description: `Lote local com ${uniqueContacts.length} destinatario(s)`
    })
  ];
}

function buildDynamicBatchRequests({ contacts, template, config, ccList, bccList, campaignId, batchIndex }) {
  const uniqueContacts = dedupeContacts(contacts);
  const payload = {
    ...buildBaseMessage(config, template),
    personalizations: uniqueContacts.map((contact) =>
      buildDynamicPersonalization(contact, config, ccList, bccList, campaignId, batchIndex)
    )
  };

  return [
    buildRequestUnit({
      payload,
      contacts: uniqueContacts,
      requestStrategy: 'dynamic_batch_request',
      description: `Lote dinamico com ${uniqueContacts.length} destinatario(s)`
    })
  ];
}

function buildSharedBccRequest({ contacts, template, config, ccList, bccList, campaignId, batchIndex }) {
  const uniqueContacts = dedupeContacts(contacts);
  const rendered =
    template.mode === 'local'
      ? appendSubscriptionTracking(
          renderLocalTemplate({
            template,
            contact: { email: '', name: '', variables: {} },
            campaignConfig: config
          }),
          config
        )
      : null;

  const visibleTo = {
    email: normalizeEmailKey(config.visibleToEmail || config.senderEmail),
    ...(config.visibleToName ? { name: config.visibleToName } : {})
  };
  const recipients = buildUniqueRecipientSets({
    to: [sanitizeAddress(visibleTo)],
    cc: ccList,
    bcc: [...uniqueContacts.map((contact) => sanitizeAddress(contact)), ...bccList]
  });
  const payload = {
    ...buildBaseMessage(config, template, rendered),
    personalizations: [
      {
        ...recipients,
        custom_args: {
          campaignId,
          batchIndex,
          strategy: 'shared_bcc'
        }
      }
    ]
  };

  return [
    buildRequestUnit({
      payload,
      contacts: uniqueContacts,
      requestStrategy: 'shared_bcc_batch_request',
      description: `Lote BCC compartilhado com ${uniqueContacts.length} contato(s)`
    })
  ];
}

export class SendGridApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SendGridApiError';
    this.status = details.status || 0;
    this.retryable = Boolean(details.retryable);
    this.retryAfterMs = details.retryAfterMs || 0;
    this.details = details.details || null;
  }
}

export class EmailService {
  constructor({ env }) {
    this.env = env;
  }

  normalizeContactsForSend(contacts = []) {
    return dedupeContacts(contacts);
  }

  validateEnvironment() {
    if (!this.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY nao foi encontrado no arquivo .env.');
    }
  }

  validateConfig(config, template, contacts = []) {
    this.validateEnvironment();
    const uniqueContacts = dedupeContacts(contacts);

    if (!isValidEmail(config.senderEmail)) {
      throw new Error('Informe um remetente valido.');
    }

    if (config.replyToEmail && !isValidEmail(config.replyToEmail)) {
      throw new Error('Informe um reply-to valido.');
    }

    if (!config.subject && !template.subject && template.mode !== 'sendgrid_dynamic') {
      throw new Error('Informe um assunto para o email.');
    }

    if (!Number.isInteger(config.batchSize) || config.batchSize < 1 || config.batchSize > 1000) {
      throw new Error('O tamanho do lote deve estar entre 1 e 1000.');
    }

    if (config.sendMode === 'shared_bcc') {
      if (!isValidEmail(config.visibleToEmail || config.senderEmail)) {
        throw new Error('No modo BCC, informe um destinatario visivel valido.');
      }

      if (config.enablePersonalization) {
        throw new Error('Personalizacao por contato nao e compativel com o modo BCC compartilhado.');
      }
    }

    if (template.mode === 'sendgrid_dynamic') {
      if (!sanitizeText(template.templateId, { maxLength: 128 }).startsWith('d-')) {
        throw new Error('Template ID invalido. Templates dinamicos precisam comecar com d-.');
      }
    }

    if (config.asmGroupId && (!Number.isInteger(Number(config.asmGroupId)) || Number(config.asmGroupId) <= 0)) {
      throw new Error('O ASM Group ID precisa ser um numero inteiro positivo.');
    }

    if (!uniqueContacts.length) {
      throw new Error('Nao ha contatos elegiveis para envio.');
    }

    const { bcc } = parseAddressLists(config);

    if (config.sendMode === 'shared_bcc' && config.batchSize + bcc.length > 1000) {
      throw new Error('No modo BCC compartilhado, lote + BCC fixo nao podem ultrapassar 1000 destinatarios por requisicao.');
    }
  }

  summarizeTemplate(template) {
    return summarizeTemplate(template);
  }

  buildBatchRequests({ contacts, template, config, campaignId, batchIndex }) {
    const uniqueContacts = dedupeContacts(contacts);
    const { cc, bcc } = parseAddressLists(config);

    if (config.sendMode === 'shared_bcc') {
      return buildSharedBccRequest({
        contacts: uniqueContacts,
        template,
        config,
        ccList: cc,
        bccList: bcc,
        campaignId,
        batchIndex
      });
    }

    if (template.mode === 'sendgrid_dynamic') {
      return buildDynamicBatchRequests({
        contacts: uniqueContacts,
        template,
        config,
        ccList: cc,
        bccList: bcc,
        campaignId,
        batchIndex
      });
    }

    return buildLocalBatchRequests({
      contacts: uniqueContacts,
      template,
      config,
      ccList: cc,
      bccList: bcc,
      campaignId,
      batchIndex
    });
  }

  getLogicalBatches(contacts, batchSize) {
    return chunkArray(dedupeContacts(contacts), batchSize);
  }

  countRequestUnits(contacts, template, config) {
    const uniqueContacts = dedupeContacts(contacts);

    if (config.sendMode === 'shared_bcc') {
      return Math.ceil(uniqueContacts.length / config.batchSize);
    }

    if (template.mode === 'sendgrid_dynamic') {
      return Math.ceil(uniqueContacts.length / config.batchSize);
    }

    if (config.enablePersonalization && getTemplateVariables(template).length > 0) {
      return uniqueContacts.length;
    }

    return Math.ceil(uniqueContacts.length / config.batchSize);
  }

  async sendRequest(payload, { timeoutMs }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${this.env.SENDGRID_BASE_URL || 'https://api.sendgrid.com'}/v3/mail/send`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (response.status === 202) {
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      }

      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 0;
      const rawBody = await response.text();
      let parsedBody = null;
      if (rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = null;
        }
      }
      const errorMessage =
        parsedBody?.errors?.map((entry) => entry.message).filter(Boolean).join('; ') ||
        `Erro SendGrid ${response.status}`;

      throw new SendGridApiError(errorMessage, {
        status: response.status,
        retryAfterMs,
        retryable: response.status === 429 || response.status >= 500,
        details: parsedBody
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new SendGridApiError('Tempo limite excedido ao chamar o SendGrid.', {
          retryable: true
        });
      }

      if (error instanceof SendGridApiError) {
        throw error;
      }

      throw new SendGridApiError(error.message || 'Falha de rede ao enviar para o SendGrid.', {
        retryable: true
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async sendWithRetry(requestUnit, config, logger) {
    const maxRetries = 3;
    let attempt = 0;

    while (true) {
      attempt += 1;
      try {
        const response = await this.sendRequest(requestUnit.payload, {
          timeoutMs: config.requestTimeoutMs
        });

        return {
          ok: true,
          attempt,
          response
        };
      } catch (error) {
        const retryable = error.retryable && attempt <= maxRetries;
        logger?.('warn', error.message, {
          requestUnitId: requestUnit.id,
          attempt,
          retryable
        });

        if (!retryable) {
          return {
            ok: false,
            attempt,
            error
          };
        }

        const waitTime = error.retryAfterMs || 1000 * Math.pow(2, attempt - 1);
        await delay(waitTime);
      }
    }
  }
}
