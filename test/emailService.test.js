import { describe, expect, it } from 'vitest';
import { EmailService } from '../main/services/emailService.js';

const baseConfig = {
  senderEmail: 'sender@example.com',
  senderName: 'Equipe',
  replyToEmail: '',
  replyToName: '',
  subject: 'Oferta especial',
  batchSize: 200,
  delayMs: 2000,
  requestTimeoutMs: 30000,
  sendMode: 'individual',
  enablePersonalization: true,
  templateMode: 'local',
  templateId: '',
  visibleToEmail: '',
  visibleToName: '',
  ccListText: '',
  bccListText: '',
  brandName: 'Rakuten Advertising',
  brandLogoUrl: 'https://cdn.example.com/rakuten.png',
  enableSubscriptionTracking: true,
  asmGroupId: '',
  subscriptionTrackingText:
    'Para deixar de receber estes emails, use o link de unsubscribe ao final desta mensagem.',
  subscriptionTrackingHtml:
    '<p>Para deixar de receber estes emails, use o link de unsubscribe ao final desta mensagem.</p>',
  customHeaders: [],
  autoDeleteTempContacts: true
};

const contacts = [
  { id: '1', email: 'one@example.com', name: 'One', variables: { coupon: 'A1' } },
  { id: '2', email: 'two@example.com', name: 'Two', variables: { coupon: 'B2' } }
];

describe('emailService', () => {
  const service = new EmailService({
    env: {
      SENDGRID_API_KEY: 'SG.fake',
      SENDGRID_BASE_URL: 'https://api.sendgrid.com'
    }
  });

  it('creates one request per contact when local personalization is enabled', () => {
    const requests = service.buildBatchRequests({
      contacts,
      template: {
        mode: 'local',
        html: '<p>Ola {{name}}</p>',
        text: '',
        subject: ''
      },
      config: baseConfig,
      campaignId: 'cmp-1',
      batchIndex: 1
    });

    expect(requests).toHaveLength(2);
    expect(requests[0].requestStrategy).toBe('local_individual_request');
  });

  it('creates one dynamic batch request for multiple contacts', () => {
    const requests = service.buildBatchRequests({
      contacts,
      template: {
        mode: 'sendgrid_dynamic',
        templateId: 'd-123'
      },
      config: {
        ...baseConfig,
        templateMode: 'sendgrid_dynamic'
      },
      campaignId: 'cmp-2',
      batchIndex: 1
    });

    expect(requests).toHaveLength(1);
    expect(requests[0].payload.personalizations).toHaveLength(2);
    expect(requests[0].payload.personalizations[0].dynamic_template_data.brand_logo_url).toBe(
      'https://cdn.example.com/rakuten.png'
    );
    expect(requests[0].payload.tracking_settings.subscription_tracking.enable).toBe(true);
  });

  it('injects unsubscribe placeholder into local html and uses subscription tag tracking', () => {
    const requests = service.buildBatchRequests({
      contacts: [contacts[0]],
      template: {
        mode: 'local',
        html: '<p>Ola {{name}}</p>',
        text: '',
        subject: ''
      },
      config: baseConfig,
      campaignId: 'cmp-4',
      batchIndex: 1
    });

    expect(requests[0].payload.tracking_settings.subscription_tracking.substitution_tag).toBe(
      '[%unsubscribe_url%]'
    );
    expect(requests[0].payload.content[1].value).toContain('[%unsubscribe_url%]');
    expect(requests[0].payload.content[1].value).toContain(
      'clique aqui para cancelar a inscricao'
    );
  });

  it('rejects shared BCC mode when personalization is still enabled', () => {
    expect(() =>
      service.validateConfig(
        {
          ...baseConfig,
          sendMode: 'shared_bcc',
          enablePersonalization: true
        },
        {
          mode: 'local',
          html: '<p>oi</p>',
          text: '',
          subject: ''
        },
        contacts
      )
    ).toThrow(/BCC compartilhado/);
  });

  it('adds ASM group when configured', () => {
    const requests = service.buildBatchRequests({
      contacts,
      template: {
        mode: 'local',
        html: '<p>Ola {{name}}</p>',
        text: '',
        subject: ''
      },
      config: {
        ...baseConfig,
        asmGroupId: '12345'
      },
      campaignId: 'cmp-3',
      batchIndex: 1
    });

    expect(requests[0].payload.asm.group_id).toBe(12345);
  });

  it('rejects shared BCC requests that exceed SendGrid recipient cap', () => {
    expect(() =>
      service.validateConfig(
        {
          ...baseConfig,
          sendMode: 'shared_bcc',
          enablePersonalization: false,
          batchSize: 1000,
          bccListText: 'audit@example.com'
        },
        {
          mode: 'local',
          html: '<p>oi</p>',
          text: '',
          subject: ''
        },
        contacts
      )
    ).toThrow(/1000 destinatarios/);
  });
});
