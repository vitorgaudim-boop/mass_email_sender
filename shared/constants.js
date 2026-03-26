import { createDraftFromPreset, DEFAULT_TEMPLATE_PRESET } from './templateCatalog.js';

export const DEFAULT_BRAND_NAME = 'Rakuten Advertising';
export const DEFAULT_BRAND_LOGO_URL =
  'https://rakutenadvertising.com/wp-content/uploads/sites/2/2023/01/RAD_Logo_Hor_RADPurple-9.svg';
export const DEFAULT_SUBSCRIPTION_TRACKING_TEXT =
  'Para deixar de receber estes emails, use o link de unsubscribe ao final desta mensagem. To stop receiving these emails, use the unsubscribe link at the end of this message.';
export const DEFAULT_SUBSCRIPTION_TRACKING_HTML =
  '<p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6f5f78;">Para deixar de receber estes emails, use o link de unsubscribe ao final desta mensagem.<br/>To stop receiving these emails, use the unsubscribe link at the end of this message.</p>';

export const DEFAULT_SEND_CONFIG = {
  senderEmail: '',
  senderName: '',
  replyToEmail: '',
  replyToName: '',
  brandName: DEFAULT_BRAND_NAME,
  brandLogoUrl: DEFAULT_BRAND_LOGO_URL,
  subject: '',
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
  enableSubscriptionTracking: true,
  asmGroupId: '',
  subscriptionTrackingText: DEFAULT_SUBSCRIPTION_TRACKING_TEXT,
  subscriptionTrackingHtml: DEFAULT_SUBSCRIPTION_TRACKING_HTML,
  customHeaders: [],
  autoDeleteTempContacts: true
};

export const DEFAULT_TEMPLATE_DRAFT = createDraftFromPreset(DEFAULT_TEMPLATE_PRESET);

export const CAMPAIGN_STATUS = {
  IDLE: 'ociosa',
  RUNNING: 'executando',
  PAUSED: 'pausada',
  COMPLETED: 'concluida',
  COMPLETED_WITH_FAILURES: 'concluida_com_falhas',
  CANCELLED: 'cancelada',
  INTERRUPTED: 'interrompida'
};

export const RESULT_STATUS = {
  ACCEPTED: 'aceita',
  FAILED: 'falhou',
  VALIDATION_FAILED: 'validacao_falhou',
  CANCELLED: 'cancelada'
};
