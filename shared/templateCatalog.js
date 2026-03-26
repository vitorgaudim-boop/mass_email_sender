const DEFAULT_CTA_URL = 'https://rakutenadvertising.com/pt-br/';
const VARIABLE_PATTERN = /{{\s*[A-Za-z0-9_.-]+\s*}}/g;

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

function normalizeRichBody(html) {
  const trimmed = String(html ?? '').trim();
  if (!trimmed) {
    return '<p style="margin:0 0 16px; font-size:15px; line-height:1.72; color:#2b2034;">Escreva aqui o conteúdo do email.</p>';
  }

  return trimmed;
}

function normalizeSignature(signature) {
  return escapeHtmlPreservingVariables(signature || 'Equipe {{brand_name}}').replace(/\n/g, '<br />');
}

function buildShellHtml(shell, composer) {
  const eyebrowHtml = shell.eyebrow
    ? `
      <p style="margin:0 0 12px; font-size:12px; line-height:1.4; letter-spacing:0.18em; text-transform:uppercase; color:${shell.eyebrowColor};">
        ${shell.eyebrow}
      </p>
    `
    : '';

  const logoHtml = `
    <img
      src="{{brand_logo_url}}"
      alt="{{brand_name}}"
      width="${shell.logoWidth}"
      style="display:block; width:100%; max-width:${shell.logoWidth}px; height:auto; border:0; margin:${shell.logoMargin};"
    />
  `;

  const introHtml = composer.intro
    ? `<p style="margin:18px 0 0; font-size:15px; line-height:1.7; color:${shell.introColor};">${escapeHtmlPreservingVariables(composer.intro)}</p>`
    : '';

  const ctaHtml =
    composer.ctaLabel && composer.ctaUrl
      ? `
        <div style="margin:12px 0 30px; padding:20px 22px; border-radius:20px; background:${shell.ctaPanelBackground};">
          <a
            href="${escapeHtmlPreservingVariables(composer.ctaUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block; padding:14px 22px; border-radius:999px; background:${shell.ctaButtonBackground}; color:${shell.ctaButtonColor}; font-weight:700; text-decoration:none;"
          >
            ${escapeHtmlPreservingVariables(composer.ctaLabel)}
          </a>
        </div>
      `
      : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtmlPreservingVariables(composer.headline || 'Novo email')}</title>
  </head>
  <body style="margin:0; padding:0; background:${shell.pageBackground}; font-family:Arial, Helvetica, sans-serif; color:${shell.bodyColor};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${shell.pageBackground};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border-radius:20px; overflow:hidden; border:${shell.frameBorder}; box-shadow:${shell.frameShadow};">
            <tr>
              <td style="padding:0;">
                <div style="background:${shell.headerBackground}; padding:${shell.headerPadding}; text-align:${shell.headerAlign};">
                  ${eyebrowHtml}
                  ${logoHtml}
                  <h1 style="margin:0; font-size:${shell.headlineSize}; line-height:1.18; color:${shell.headlineColor};">
                    ${escapeHtmlPreservingVariables(composer.headline || 'Seu título aqui')}
                  </h1>
                  ${introHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px 18px;">
                ${normalizeRichBody(composer.bodyHtml)}
                ${ctaHtml}
                <div style="margin-top:6px; padding-top:18px; border-top:1px solid ${shell.dividerColor};">
                  <p style="margin:0; font-size:15px; line-height:1.72; color:${shell.bodyColor};">
                    Atenciosamente,<br />
                    <strong>${normalizeSignature(composer.signature)}</strong>
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 22px; background:${shell.footerBackground}; color:${shell.footerColor};">
                <p style="margin:0; font-size:12px; line-height:1.62;">
                  ${shell.footerNote}
                </p>
              </td>
            </tr>
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
      '<p style="margin:0 0 16px; font-size:15px; line-height:1.72; color:#2b2034;">Olá {{name}},</p><p style="margin:0 0 16px; font-size:15px; line-height:1.72; color:#2b2034;">Escreva aqui a mensagem principal do email. Você pode usar negrito, listas, links e variáveis da planilha.</p>',
    ctaLabel: '',
    ctaUrl: DEFAULT_CTA_URL,
    signature: 'Equipe {{brand_name}}'
  };
}

export const BUILT_IN_TEMPLATES = [
  {
    id: 'banner_editorial',
    name: 'Banner editorial',
    category: 'Institucional',
    description: 'Base mais próxima do template.html, com topo largo e leitura clássica.',
    isDefault: true,
    eyebrow: '*english follows portuguese*',
    eyebrowColor: '#7a6d77',
    pageBackground: '#f4f1f7',
    headerBackground: 'linear-gradient(180deg,#f8f3fb 0%, #ffffff 100%)',
    headerPadding: '26px 36px 18px',
    headerAlign: 'center',
    logoWidth: 250,
    logoMargin: '0 auto 18px',
    headlineSize: '28px',
    headlineColor: '#1a1a1a',
    introColor: '#64596c',
    bodyColor: '#222222',
    ctaPanelBackground: '#f4eef7',
    ctaButtonBackground: '#7d28c2',
    ctaButtonColor: '#ffffff',
    dividerColor: '#e8dfea',
    footerBackground: '#f7f3f8',
    footerColor: '#6d6174',
    frameBorder: '1px solid #ebe5ef',
    frameShadow: '0 18px 44px rgba(71, 31, 98, 0.08)',
    footerNote:
      'Envio realizado por {{brand_name}}. Quando o unsubscribe estiver ligado na configuração, o link aparecerá automaticamente no rodapé do email.',
    defaultHeadline: 'Atualização importante para sua operação',
    defaultIntro: ''
  },
  {
    id: 'hero_soft',
    name: 'Hero suave',
    category: 'Relacionamento',
    description: 'Topo com mais presença visual e card branco limpo para campanhas e anúncios.',
    eyebrow: 'Comunicado',
    eyebrowColor: 'rgba(255,255,255,0.8)',
    pageBackground: '#f3edf8',
    headerBackground: 'linear-gradient(135deg,#8b33d0 0%, #6d21b0 100%)',
    headerPadding: '32px 36px 28px',
    headerAlign: 'left',
    logoWidth: 230,
    logoMargin: '0 0 20px',
    headlineSize: '30px',
    headlineColor: '#ffffff',
    introColor: 'rgba(255,255,255,0.88)',
    bodyColor: '#251b33',
    ctaPanelBackground: 'linear-gradient(135deg,#efe1ff,#f7efff)',
    ctaButtonBackground: '#6f22b4',
    ctaButtonColor: '#ffffff',
    dividerColor: '#e7dbf5',
    footerBackground: '#f8f2ff',
    footerColor: '#675978',
    frameBorder: '1px solid #e7dbf5',
    frameShadow: '0 20px 44px rgba(63, 17, 97, 0.10)',
    footerNote: 'Ideal para emails promocionais, lançamentos e convites para ação.',
    defaultHeadline: 'Destaque sua mensagem principal',
    defaultIntro: 'Use este shell quando você quiser um topo mais marcante, sem perder legibilidade.'
  },
  {
    id: 'notice_clean',
    name: 'Aviso clean',
    category: 'Operação',
    description: 'Mais sóbrio, excelente para cobranças, prazos e instruções.',
    eyebrow: 'Aviso',
    eyebrowColor: '#7c28c3',
    pageBackground: '#f5f1f9',
    headerBackground: '#ffffff',
    headerPadding: '26px 36px 18px',
    headerAlign: 'left',
    logoWidth: 200,
    logoMargin: '0 0 18px',
    headlineSize: '28px',
    headlineColor: '#231630',
    introColor: '#62566d',
    bodyColor: '#2b2034',
    ctaPanelBackground: '#f1e8fb',
    ctaButtonBackground: '#7726ba',
    ctaButtonColor: '#ffffff',
    dividerColor: '#e8dff1',
    footerBackground: '#faf7fc',
    footerColor: '#6c6075',
    frameBorder: '1px solid #ece4f2',
    frameShadow: '0 14px 36px rgba(66, 23, 92, 0.06)',
    footerNote: 'Use esta base para comunicação operacional, financeira ou de compliance.',
    defaultHeadline: 'Explique a atualização com clareza',
    defaultIntro: 'Estrutura enxuta e profissional para informações importantes.'
  },
  {
    id: 'band_top',
    name: 'Faixa superior',
    category: 'Promoção',
    description: 'Topo forte com faixa de cor e CTA bem visível.',
    eyebrow: 'Campanha',
    eyebrowColor: '#ffffff',
    pageBackground: '#f4eef9',
    headerBackground: 'linear-gradient(180deg,#5d1697 0%, #8d35d3 100%)',
    headerPadding: '18px 36px 26px',
    headerAlign: 'center',
    logoWidth: 220,
    logoMargin: '8px auto 20px',
    headlineSize: '30px',
    headlineColor: '#ffffff',
    introColor: 'rgba(255,255,255,0.9)',
    bodyColor: '#281d34',
    ctaPanelBackground: 'linear-gradient(135deg,#7c28c3,#9a4ad9)',
    ctaButtonBackground: '#ffffff',
    ctaButtonColor: '#6720a8',
    dividerColor: '#e6ddf2',
    footerBackground: '#f6effd',
    footerColor: '#655976',
    frameBorder: '1px solid #e5d8f4',
    frameShadow: '0 18px 42px rgba(76, 24, 116, 0.10)',
    footerNote: 'Bom para emails de campanha, benefício, cupom ou comunicação de lançamento.',
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
    headerPadding: '24px 36px 12px',
    headerAlign: 'left',
    logoWidth: 180,
    logoMargin: '0 0 16px',
    headlineSize: '26px',
    headlineColor: '#231830',
    introColor: '#685c73',
    bodyColor: '#261c32',
    ctaPanelBackground: '#f4ecfb',
    ctaButtonBackground: '#7b27c0',
    ctaButtonColor: '#ffffff',
    dividerColor: '#ece5f2',
    footerBackground: '#ffffff',
    footerColor: '#73687c',
    frameBorder: '1px solid #eee8f3',
    frameShadow: '0 14px 32px rgba(65, 24, 92, 0.05)',
    footerNote:
      'Base mais discreta para emails que precisam parecer diretos, sérios e corporativos.',
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
