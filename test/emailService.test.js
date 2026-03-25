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
});
