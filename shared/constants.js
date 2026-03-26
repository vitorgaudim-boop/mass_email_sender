import { createDraftFromPreset, DEFAULT_TEMPLATE_PRESET } from './templateCatalog.js';

export const DEFAULT_BRAND_NAME = 'Rakuten Advertising';
export const DEFAULT_BRAND_LOGO_URL =
  'https://rakutenadvertising.com/wp-content/uploads/sites/2/2023/01/RAD_Logo_Hor_RADPurple-9.svg';
export const UNSUBSCRIBE_URL_VARIABLE = '{{unsubscribe_url}}';
export const SENDGRID_UNSUBSCRIBE_TAG = '[%unsubscribe_url%]';
export const PREVIEW_UNSUBSCRIBE_URL = 'https://preview.rakutenadvertising.example/unsubscribe';
export const DEFAULT_SUBSCRIPTION_TRACKING_TEXT =
  'Para deixar de receber estes emails, clique aqui: {{unsubscribe_url}}. To stop receiving these emails, click here: {{unsubscribe_url}}.';
export const DEFAULT_SUBSCRIPTION_TRACKING_HTML =
  '<p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6f5f78;">Para deixar de receber estes emails, <a href="{{unsubscribe_url}}" style="color:#7b27c0;text-decoration:underline;">clique aqui para cancelar a inscricao</a>.<br/>To stop receiving these emails, <a href="{{unsubscribe_url}}" style="color:#7b27c0;text-decoration:underline;">click here to unsubscribe</a>.</p>';

export const DEFAULT_SEND_CONFIG = {
  senderEmail: '',
  senderName: '',
  replyToEmail: '',
  replyToName: '',
  brandName: DEFAULT_BRAND_NAME,
  brandLogoUrl: DEFAULT_BRAND_LOGO_URL,
  selectedGroupIds: [],
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
