const DEFAULT_CTA_URL = 'https://rakutenadvertising.com/pt-br/';
const VARIABLE_PATTERN = /{{\s*[A-Za-z0-9_.-]+\s*}}/g;

function escapeHtmlPreservingVariables(value) {
  const tokens = [];
  const source = String(value ?? '').replace(VARIABLE_PATTERN, (match) => {
    const token = `__VARIABLE_TOKEN_${tokens.length}__`;
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

function normalizeLineBreaks(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function renderParagraphs(value, { className = '', color = '#2b2034' } = {}) {
  const paragraphs = normalizeLineBreaks(value)
    .split(/\n\s*\n/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return '';
  }

  return paragraphs
    .map((paragraph) => {
      const html = escapeHtmlPreservingVariables(paragraph).replace(/\n/g, '<br />');
      return `<p class="${className}" style="margin:0 0 16px; font-size:15px; line-height:1.72; color:${color};">${html}</p>`;
    })
    .join('');
}

function renderHighlightList(value, color = '#2b2034') {
  const items = normalizeLineBreaks(value)
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!items.length) {
    return '';
  }

  return `
    <ul style="margin:0 0 20px 18px; padding:0; color:${color};">
      ${items
        .map(
          (item) =>
            `<li style="margin:0 0 8px; font-size:15px; line-height:1.6;">${escapeHtmlPreservingVariables(item)}</li>`
        )
        .join('')}
    </ul>
  `;
}

function renderSignature(value) {
  return escapeHtmlPreservingVariables(value || 'Equipe {{brand_name}}').replace(/\n/g, '<br />');
}

function buildShellHtml(shell, composer) {
  const greetingHtml = renderParagraphs(composer.greeting, {
    className: 'greeting',
    color: shell.textColor
  });
  const bodyHtml = renderParagraphs(composer.body, {
    className: 'body-copy',
    color: shell.textColor
  });
  const supportingHtml = renderParagraphs(composer.supportingText, {
    className: 'support-copy',
    color: shell.mutedTextColor
  });
  const highlightsHtml = renderHighlightList(composer.highlights, shell.textColor);
  const ctaEnabled = composer.ctaLabel && composer.ctaUrl;
  const ctaHtml = ctaEnabled
    ? `
      <section style="margin:8px 0 28px; padding:22px 24px; border-radius:22px; background:${shell.ctaBackground};">
        <a
          href="${escapeHtmlPreservingVariables(composer.ctaUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          style="display:inline-block; padding:14px 22px; border-radius:999px; background:${shell.ctaButtonBackground}; color:${shell.ctaButtonColor}; font-weight:700; text-decoration:none;"
        >
          ${escapeHtmlPreservingVariables(composer.ctaLabel)}
        </a>
      </section>
    `
    : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtmlPreservingVariables(composer.headline || 'Novo email')}</title>
  </head>
  <body style="margin:0; padding:0; background:${shell.pageBackground}; font-family:Arial, Helvetica, sans-serif; color:${shell.textColor};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${shell.pageBackground};">
      <tr>
        <td align="center" style="padding:24px 14px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:640px; background:#ffffff; border-radius:26px; overflow:hidden; border:1px solid ${shell.frameLine};">
            <tr>
              <td style="padding:0; background:${shell.headerBackground};">
                <div style="padding:28px 34px 24px;">
                  <div style="display:inline-flex; align-items:center; padding:8px 12px; border-radius:999px; background:${shell.labelBackground}; color:${shell.labelColor}; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700;">
                    ${shell.label}
                  </div>
                  <img
                    src="{{brand_logo_url}}"
                    alt="{{brand_name}}"
                    width="220"
                    style="display:block; width:100%; max-width:220px; height:auto; border:0; margin:18px 0 0;"
                  />
                  <h1 style="margin:20px 0 0; font-size:30px; line-height:1.15; color:${shell.titleColor};">
                    ${escapeHtmlPreservingVariables(composer.headline || 'Seu título aqui')}
                  </h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 34px 18px;">
                ${greetingHtml}
                ${bodyHtml}
                ${supportingHtml}
                ${highlightsHtml}
                ${ctaHtml}
                <div style="margin-top:10px; padding-top:18px; border-top:1px solid ${shell.frameLine};">
                  <p style="margin:0; font-size:15px; line-height:1.7; color:${shell.textColor};">
                    Atenciosamente,<br />
                    <strong>${renderSignature(composer.signature)}</strong>
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 34px 22px; background:${shell.footerBackground}; color:${shell.footerColor};">
                <p style="margin:0; font-size:12px; line-height:1.6;">
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
    greeting: 'Olá {{name}},',
    body: 'Escreva aqui a mensagem principal do email.',
    supportingText:
      'Use este segundo bloco para complementar o contexto, incluir observações ou reforçar instruções.',
    highlights: '',
    ctaLabel: '',
    ctaUrl: DEFAULT_CTA_URL,
    signature: 'Equipe {{brand_name}}'
  };
}

export const BUILT_IN_TEMPLATES = [
  {
    id: 'rakuten_header_clean',
    name: 'Header limpo',
    category: 'Clássico',
    description: 'Topo limpo com logo em destaque e corpo neutro.',
    tags: ['simples', 'institucional'],
    isDefault: true,
    label: 'Comunicado',
    defaultHeadline: 'Seu comunicado começa aqui',
    pageBackground: '#f5f0fb',
    headerBackground: 'linear-gradient(180deg,#f5ecff 0%, #ffffff 100%)',
    labelBackground: 'rgba(133, 41, 205, 0.12)',
    labelColor: '#772bb8',
    titleColor: '#251a31',
    textColor: '#2b2034',
    mutedTextColor: '#6f617b',
    frameLine: '#eadcf8',
    ctaBackground: 'linear-gradient(135deg,#f0e0ff,#f7efff)',
    ctaButtonBackground: '#7c28c3',
    ctaButtonColor: '#ffffff',
    footerBackground: '#faf5ff',
    footerColor: '#6c5d79',
    footerNote:
      'Envio realizado por {{brand_name}}. O link de unsubscribe aparecerá automaticamente no rodapé do email quando habilitado na configuração.'
  },
  {
    id: 'rakuten_header_band',
    name: 'Faixa roxa',
    category: 'Impacto',
    description: 'Faixa superior mais marcante, boa para campanhas e avisos fortes.',
    tags: ['destaque', 'cta'],
    label: 'Campanha',
    defaultHeadline: 'Destaque sua mensagem principal',
    pageBackground: '#f4effb',
    headerBackground: 'linear-gradient(135deg,#7f27c6 0%, #9d46e2 100%)',
    labelBackground: 'rgba(255,255,255,0.16)',
    labelColor: '#ffffff',
    titleColor: '#ffffff',
    textColor: '#2b2034',
    mutedTextColor: '#665875',
    frameLine: '#e6daf6',
    ctaBackground: 'linear-gradient(135deg,#7f27c6,#9d46e2)',
    ctaButtonBackground: '#ffffff',
    ctaButtonColor: '#7022b2',
    footerBackground: '#f8f2ff',
    footerColor: '#6c5d79',
    footerNote:
      'Use este shell quando você quiser um topo mais forte sem escrever HTML. O unsubscribe continua sendo controlado pela configuração do SendGrid.'
  },
  {
    id: 'rakuten_notice_frame',
    name: 'Quadro informativo',
    category: 'Aviso',
    description: 'Visual mais sóbrio para instruções, prazos e comunicação operacional.',
    tags: ['aviso', 'prazo'],
    label: 'Aviso',
    defaultHeadline: 'Explique a atualização com clareza',
    pageBackground: '#f7f3fb',
    headerBackground: '#ffffff',
    labelBackground: '#f0e3ff',
    labelColor: '#6d25ae',
    titleColor: '#221632',
    textColor: '#2d2340',
    mutedTextColor: '#64586f',
    frameLine: '#d9c7f3',
    ctaBackground: '#f3e7ff',
    ctaButtonBackground: '#7427b6',
    ctaButtonColor: '#ffffff',
    footerBackground: '#f7f1ff',
    footerColor: '#695a79',
    footerNote:
      'Este modelo funciona bem para mudanças de processo, cobrança gentil, documentos pendentes e comunicados internos.'
  },
  {
    id: 'rakuten_minimal_compact',
    name: 'Compacto',
    category: 'Desktop',
    description: 'Mais enxuto, com menos blocos visuais e leitura direta.',
    tags: ['compacto', 'rápido'],
    label: 'Atualização',
    defaultHeadline: 'Seu email direto ao ponto',
    pageBackground: '#f7f4fb',
    headerBackground: '#ffffff',
    labelBackground: '#f3eff8',
    labelColor: '#7c28c3',
    titleColor: '#221632',
    textColor: '#2a1f34',
    mutedTextColor: '#63576f',
    frameLine: '#ece1f8',
    ctaBackground: '#f5effc',
    ctaButtonBackground: '#7c28c3',
    ctaButtonColor: '#ffffff',
    footerBackground: '#ffffff',
    footerColor: '#766783',
    footerNote:
      'Ideal para mensagens curtas. Se você não precisar de CTA, deixe os campos do botão em branco e o bloco não será exibido.'
  },
  {
    id: 'rakuten_footer_cta',
    name: 'CTA no rodapé',
    category: 'Promoção',
    description: 'Shell pensado para calls-to-action com fechamento mais forte.',
    tags: ['promo', 'cta'],
    label: 'Ação',
    defaultHeadline: 'Convide o destinatário a agir',
    pageBackground: '#f5effb',
    headerBackground: 'linear-gradient(180deg,#ffffff 0%, #f6ecff 100%)',
    labelBackground: '#f2e2ff',
    labelColor: '#7022b2',
    titleColor: '#221632',
    textColor: '#2d2340',
    mutedTextColor: '#665875',
    frameLine: '#e4d5f5',
    ctaBackground: 'linear-gradient(135deg,#7c28c3,#9d46e2)',
    ctaButtonBackground: '#ffffff',
    ctaButtonColor: '#7022b2',
    footerBackground: '#f2e4ff',
    footerColor: '#5f5170',
    footerNote:
      'Use este shell quando a chamada para ação for a parte principal da mensagem.'
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
