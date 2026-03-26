const DEFAULT_CTA_URL = 'https://rakutenadvertising.com/pt-br/';
const DEFAULT_TEMPLATE_FONT_FAMILY = "'Segoe UI', Arial, Helvetica, sans-serif";
const VARIABLE_PATTERN = /{{\s*[A-Za-z0-9_.-]+\s*}}/g;

export const TEMPLATE_FONT_OPTIONS = [
  { label: 'Segoe UI', value: "'Segoe UI', Arial, Helvetica, sans-serif" },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', Arial, sans-serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' }
];

function escapeHtmlPreservingVariables(value) {
  const tokens = [];
  const source = String(value ?? '').replace(VARIABLE_PATTERN, (match) => {
    const token = `__VAR_TOKEN_${tokens.length}__`;
    tokens.push({ token, match });
    return token;
  });

  let escaped = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  for (const { token, match } of tokens) {
    escaped = escaped.replaceAll(token, match);
  }

  return escaped;
}

function removeInlineFontFamilyStyles(html) {
  return String(html ?? '')
    .replace(/\sface=(['"]).*?\1/gi, '')
    .replace(/\sstyle=(['"])(.*?)\1/gi, (_, quote, content) => {
      const keptRules = content
        .split(';')
        .map((rule) => rule.trim())
        .filter(Boolean)
        .filter((rule) => !rule.toLowerCase().startsWith('font-family'));

      return keptRules.length ? ` style=${quote}${keptRules.join('; ')}${quote}` : '';
    });
}

function normalizeRichBody(html, fontFamily, bodyColor) {
  const trimmed = removeInlineFontFamilyStyles(html).trim();
  const fallback =
    '<p style="margin:0 0 16px; font-size:15px; line-height:1.72;">Escreva aqui o conteúdo do email.</p>';

  return `
    <div style="font-family:${fontFamily}; color:${bodyColor};">
      ${trimmed || fallback}
    </div>
  `;
}

function normalizeSignature(signature) {
  return escapeHtmlPreservingVariables(signature || 'Equipe {{brand_name}}').replace(/\n/g, '<br />');
}

function buildShellHtml(shell, composer) {
  const fontFamily = composer.fontFamily || DEFAULT_TEMPLATE_FONT_FAMILY;
  const logoSource = shell.useWhiteLogo ? '{{brand_logo_white_url}}' : '{{brand_logo_url}}';
  const eyebrowText = composer.eyebrow || shell.eyebrow || '';
  const eyebrowHtml = eyebrowText
    ? `
      <p style="margin:0 0 12px; font-size:12px; line-height:1.4; letter-spacing:0.18em; text-transform:uppercase; color:${shell.eyebrowColor}; font-family:${fontFamily};">
        ${escapeHtmlPreservingVariables(eyebrowText)}
      </p>
    `
    : '';
  const topAccentHtml = shell.topAccent
    ? `<div style="height:${shell.topAccentHeight || '6px'}; background:${shell.topAccent};"></div>`
    : '';
  const logoPlateHtml = `
    <div style="display:inline-flex; align-items:center; justify-content:${shell.headerAlign === 'center' ? 'center' : 'flex-start'}; padding:${shell.logoPlatePadding || '0'}; border-radius:${shell.logoPlateRadius || '0'}; background:${shell.logoPlateBackground || 'transparent'}; box-shadow:${shell.logoPlateShadow || 'none'}; margin:${shell.logoPlateMargin || '0'};">
      <img
        src="${logoSource}"
        alt="{{brand_name}}"
        width="${shell.logoWidth}"
        style="display:block; width:100%; max-width:${shell.logoWidth}px; height:auto; border:0;"
      />
    </div>
  `;
  const introHtml = composer.intro
    ? `
      <p style="margin:18px ${shell.headerAlign === 'center' ? 'auto' : '0'} 0; max-width:${shell.introMaxWidth || shell.headlineMaxWidth || '100%'}; font-size:15px; line-height:1.7; color:${shell.introColor}; font-family:${fontFamily};">
        ${escapeHtmlPreservingVariables(composer.intro)}
      </p>
    `
    : '';
  const ctaHtml =
    composer.ctaLabel && composer.ctaUrl
      ? `
        <div style="margin:12px 0 30px; padding:20px 22px; border-radius:20px; background:${shell.ctaPanelBackground};">
          <a
            href="${escapeHtmlPreservingVariables(composer.ctaUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block; padding:14px 22px; border-radius:999px; background:${shell.ctaButtonBackground}; color:${shell.ctaButtonColor}; font-weight:700; text-decoration:none; font-family:${fontFamily};"
          >
            ${escapeHtmlPreservingVariables(composer.ctaLabel)}
          </a>
        </div>
      `
      : '';
  const footerHtml = shell.footerNote
    ? `
            <tr>
              <td style="padding:16px 36px 22px; background:${shell.footerBackground}; color:${shell.footerColor};">
                <p style="margin:0; font-size:12px; line-height:1.62; font-family:${fontFamily};">
                  ${shell.footerNote}
                </p>
              </td>
            </tr>
      `
    : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtmlPreservingVariables(composer.headline || 'Novo email')}</title>
  </head>
  <body style="margin:0; padding:0; background:${shell.pageBackground}; font-family:${fontFamily}; color:${shell.bodyColor};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${shell.pageBackground};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border-radius:20px; overflow:hidden; border:${shell.frameBorder}; box-shadow:${shell.frameShadow};">
            <tr>
              <td style="padding:0;">
                <div style="background:${shell.headerBackground}; text-align:${shell.headerAlign};">
                  ${topAccentHtml}
                  <div style="padding:${shell.headerPadding};">
                    ${eyebrowHtml}
                    ${logoPlateHtml}
                    <h1 style="margin:${shell.headlineMargin || '18px 0 0'}; max-width:${shell.headlineMaxWidth || '100%'}; ${shell.headerAlign === 'center' ? 'margin-left:auto; margin-right:auto;' : ''} font-size:${shell.headlineSize}; line-height:1.14; color:${shell.headlineColor}; font-family:${fontFamily}; letter-spacing:${shell.headlineTracking || '-0.03em'};">
                      ${escapeHtmlPreservingVariables(composer.headline || 'Seu título aqui')}
                    </h1>
                    ${introHtml}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:${shell.bodyPadding || '32px 36px 18px'};">
                ${normalizeRichBody(composer.bodyHtml, fontFamily, shell.bodyColor)}
                ${ctaHtml}
                <div style="margin-top:6px; padding-top:18px; border-top:1px solid ${shell.dividerColor};">
                  <p style="margin:0; font-size:15px; line-height:1.72; color:${shell.bodyColor}; font-family:${fontFamily};">
                    Atenciosamente,<br />
                    <strong>${normalizeSignature(composer.signature)}</strong>
                  </p>
                </div>
              </td>
            </tr>
            ${footerHtml}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function createDefaultComposer(template) {
  return {
    headline: template.defaultHeadline || 'Seu título aqui',
    intro: template.defaultIntro || '',
    bodyHtml:
      '<p style="margin:0 0 16px; font-size:15px; line-height:1.72;">Olá {{name}},</p><p style="margin:0 0 16px; font-size:15px; line-height:1.72;">Escreva aqui a mensagem principal do email. Você pode usar negrito, listas, links e variáveis da planilha.</p>',
    ctaLabel: '',
    ctaUrl: DEFAULT_CTA_URL,
    signature: 'Equipe {{brand_name}}',
    eyebrow: template.defaultEyebrow || template.eyebrow || '',
    fontFamily: DEFAULT_TEMPLATE_FONT_FAMILY
  };
}

export const BUILT_IN_TEMPLATES = [
  {
    id: 'banner_editorial',
    name: 'Editorial premium',
    category: 'Institucional',
    description: 'Mais próximo do template principal: elegante, limpo e com leitura editorial.',
    isDefault: true,
    eyebrow: '*english follows portuguese*',
    eyebrowColor: '#7a6d77',
    topAccent: 'linear-gradient(90deg, #6d21b0 0%, #b34bff 100%)',
    topAccentHeight: '8px',
    pageBackground: '#f4f1f7',
    headerBackground: 'linear-gradient(180deg,#faf6fd 0%, #ffffff 100%)',
    headerPadding: '28px 36px 24px',
    headerAlign: 'center',
    logoWidth: 245,
    logoPlateBackground: '#ffffff',
    logoPlatePadding: '12px 18px',
    logoPlateRadius: '18px',
    logoPlateShadow: '0 14px 34px rgba(103, 39, 163, 0.08)',
    logoPlateMargin: '0 auto',
    headlineSize: '30px',
    headlineColor: '#1a1a1a',
    headlineMaxWidth: '460px',
    introMaxWidth: '420px',
    introColor: '#64596c',
    bodyColor: '#222222',
    bodyPadding: '34px 38px 20px',
    ctaPanelBackground: '#f4eef7',
    ctaButtonBackground: '#7d28c2',
    ctaButtonColor: '#ffffff',
    dividerColor: '#e8dfea',
    footerBackground: '#f7f3f8',
    footerColor: '#6d6174',
    frameBorder: '1px solid #ebe5ef',
    frameShadow: '0 22px 56px rgba(71, 31, 98, 0.08)',
    footerNote: '',
    defaultHeadline: 'Atualização importante para sua operação',
    defaultIntro: ''
  },
  {
    id: 'hero_soft',
    name: 'Hero executivo',
    category: 'Relacionamento',
    description: 'Header forte, mais premium, com contraste alto e logo branca.',
    eyebrow: 'Comunicado',
    eyebrowColor: 'rgba(255,255,255,0.76)',
    pageBackground: '#f3edf8',
    headerBackground: 'linear-gradient(135deg,#5c1793 0%, #8c34d1 100%)',
    headerPadding: '34px 38px 30px',
    headerAlign: 'left',
    useWhiteLogo: true,
    logoWidth: 235,
    logoPlateBackground: 'transparent',
    logoPlateMargin: '0',
    headlineSize: '31px',
    headlineColor: '#ffffff',
    headlineMaxWidth: '420px',
    introMaxWidth: '420px',
    introColor: 'rgba(255,255,255,0.92)',
    bodyColor: '#251b33',
    bodyPadding: '34px 38px 20px',
    ctaPanelBackground: 'linear-gradient(135deg,#efe1ff,#f7efff)',
    ctaButtonBackground: '#6f22b4',
    ctaButtonColor: '#ffffff',
    dividerColor: '#e7dbf5',
    footerBackground: '#f8f2ff',
    footerColor: '#675978',
    frameBorder: '1px solid #e7dbf5',
    frameShadow: '0 24px 56px rgba(63, 17, 97, 0.12)',
    footerNote: '',
    defaultHeadline: 'Destaque sua mensagem principal',
    defaultIntro: 'Use este shell quando você quiser um topo marcante, sem perder leitura.'
  },
  {
    id: 'notice_clean',
    name: 'Aviso clean',
    category: 'Operação',
    description: 'Mais sóbrio, excelente para cobrança, prazo e instrução operacional.',
    eyebrow: 'Aviso',
    eyebrowColor: '#7c28c3',
    topAccent: 'linear-gradient(90deg, #7b29c1 0%, #d9b9ff 100%)',
    topAccentHeight: '6px',
    pageBackground: '#f5f1f9',
    headerBackground: '#ffffff',
    headerPadding: '26px 36px 18px',
    headerAlign: 'left',
    logoWidth: 205,
    logoPlateBackground: '#fbf7ff',
    logoPlatePadding: '10px 14px',
    logoPlateRadius: '16px',
    logoPlateShadow: '0 10px 24px rgba(90, 31, 141, 0.05)',
    logoPlateMargin: '0',
    headlineSize: '28px',
    headlineColor: '#231630',
    headlineMaxWidth: '430px',
    introMaxWidth: '430px',
    introColor: '#62566d',
    bodyColor: '#2b2034',
    bodyPadding: '32px 36px 18px',
    ctaPanelBackground: '#f1e8fb',
    ctaButtonBackground: '#7726ba',
    ctaButtonColor: '#ffffff',
    dividerColor: '#e8dff1',
    footerBackground: '#faf7fc',
    footerColor: '#6c6075',
    frameBorder: '1px solid #ece4f2',
    frameShadow: '0 16px 38px rgba(66, 23, 92, 0.06)',
    footerNote: '',
    defaultHeadline: 'Explique a atualização com clareza',
    defaultIntro: 'Estrutura enxuta e profissional para informações importantes.'
  },
  {
    id: 'band_top',
    name: 'Faixa premium',
    category: 'Promoção',
    description: 'Header com presença visual forte e CTA bem destacado.',
    eyebrow: 'Campanha',
    eyebrowColor: 'rgba(255,255,255,0.82)',
    pageBackground: '#f4eef9',
    headerBackground: 'linear-gradient(180deg,#48117c 0%, #8d35d3 100%)',
    headerPadding: '20px 36px 28px',
    headerAlign: 'center',
    useWhiteLogo: true,
    logoWidth: 225,
    logoPlateBackground: 'transparent',
    logoPlateMargin: '8px auto 0',
    headlineSize: '31px',
    headlineColor: '#ffffff',
    headlineMaxWidth: '430px',
    introMaxWidth: '410px',
    introColor: 'rgba(255,255,255,0.9)',
    bodyColor: '#281d34',
    bodyPadding: '34px 38px 20px',
    ctaPanelBackground: 'linear-gradient(135deg,#7c28c3,#9a4ad9)',
    ctaButtonBackground: '#ffffff',
    ctaButtonColor: '#6720a8',
    dividerColor: '#e6ddf2',
    footerBackground: '#f6effd',
    footerColor: '#655976',
    frameBorder: '1px solid #e5d8f4',
    frameShadow: '0 20px 48px rgba(76, 24, 116, 0.12)',
    footerNote: '',
    defaultHeadline: 'Convide o destinatário a agir',
    defaultIntro: 'Ideal para quando o botão é parte importante do resultado.'
  },
  {
    id: 'minimal_frame',
    name: 'Minimalista',
    category: 'Executivo',
    description: 'Sem excesso visual, com foco total no texto e na leitura.',
    eyebrow: 'Atualização',
    eyebrowColor: '#8a43c8',
    pageBackground: '#f5f2f8',
    headerBackground: '#ffffff',
    headerPadding: '24px 36px 14px',
    headerAlign: 'left',
    logoWidth: 180,
    logoPlateBackground: 'transparent',
    logoPlateMargin: '0',
    headlineSize: '26px',
    headlineColor: '#231830',
    headlineMaxWidth: '420px',
    introMaxWidth: '420px',
    introColor: '#685c73',
    bodyColor: '#261c32',
    bodyPadding: '30px 36px 18px',
    ctaPanelBackground: '#f4ecfb',
    ctaButtonBackground: '#7b27c0',
    ctaButtonColor: '#ffffff',
    dividerColor: '#ece5f2',
    footerBackground: '#ffffff',
    footerColor: '#73687c',
    frameBorder: '1px solid #eee8f3',
    frameShadow: '0 14px 32px rgba(65, 24, 92, 0.05)',
    footerNote: '',
    defaultHeadline: 'Seu email direto ao ponto',
    defaultIntro: ''
  }
];

export const DEFAULT_TEMPLATE_PRESET =
  BUILT_IN_TEMPLATES.find((template) => template.isDefault) || BUILT_IN_TEMPLATES[0];

export function getPresetById(templateId) {
  return BUILT_IN_TEMPLATES.find((template) => template.id === templateId) || null;
}

export function createDraftFromPreset(template) {
  const composer = createDefaultComposer(template);

  return {
    mode: 'local',
    sourceType: 'preset',
    fileName: template.name,
    html: buildShellHtml(template, composer),
    text: '',
    subject: '',
    templateId: '',
    variables: [],
    presetId: template.id,
    composer
  };
}

export function syncTemplateDraft(templateDraft) {
  const baseDraft = {
    ...createDraftFromPreset(DEFAULT_TEMPLATE_PRESET),
    ...templateDraft
  };

  if (baseDraft.mode !== 'local') {
    return baseDraft;
  }

  if (baseDraft.sourceType !== 'preset') {
    return {
      ...baseDraft,
      composer: baseDraft.composer || createDefaultComposer(DEFAULT_TEMPLATE_PRESET)
    };
  }

  const preset = getPresetById(baseDraft.presetId) || DEFAULT_TEMPLATE_PRESET;
  const composer = {
    ...createDefaultComposer(preset),
    ...(baseDraft.composer || {})
  };

  return {
    ...baseDraft,
    sourceType: 'preset',
    fileName: preset.name,
    composer,
    html: buildShellHtml(preset, composer)
  };
}
