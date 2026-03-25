export const DEFAULT_SEND_CONFIG = {
  senderEmail: '',
  senderName: '',
  replyToEmail: '',
  replyToName: '',
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
  customHeaders: [],
  autoDeleteTempContacts: true
};

export const DEFAULT_TEMPLATE_DRAFT = {
  mode: 'local',
  sourceType: 'html',
  fileName: '',
  html: '',
  text: '',
  subject: '',
  templateId: '',
  variables: []
};

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
