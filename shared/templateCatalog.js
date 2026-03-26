const DEFAULT_CTA_URL = 'https://rakutenadvertising.com/pt-br/';

function sectionBlock(title, paragraphs = [], listItems = []) {
  const paragraphHtml = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px; font-size:15px; line-height:1.72; color:#2a1f34;">${paragraph}</p>`
    )
    .join('');

  const listHtml = listItems.length
    ? `<ul style="margin:0 0 20px 20px; padding:0; color:#2a1f34;">${listItems
        .map(
          (item) =>
            `<li style="margin:0 0 8px; font-size:15px; line-height:1.6;">${item}</li>`
        )
        .join('')}</ul>`
    : '';

  return `
    <section style="margin:0 0 24px;">
      ${title ? `<h2 style="margin:0 0 14px; font-size:22px; line-height:1.25; color:#231530;">${title}</h2>` : ''}
      ${paragraphHtml}
      ${listHtml}
    </section>
  `;
}

function ctaBlock(label, url, supportText = '') {
  return `
    <section style="margin:8px 0 28px; padding:24px; border-radius:24px; background:linear-gradient(135deg,#8b34d0,#6d1fb0); color:#ffffff;">
      ${supportText ? `<p style="margin:0 0 14px; font-size:14px; line-height:1.7; color:rgba(255,255,255,0.88);">${supportText}</p>` : ''}
      <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 22px; border-radius:999px; background:#ffffff; color:#6d1fb0; font-weight:700; text-decoration:none;">
        ${label}
      </a>
    </section>
  `;
}

function buildEmailShell({ title, eyebrow, intro, bodyHtml, cta, closing }) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f0fb; font-family:Arial, Helvetica, sans-serif; color:#221833;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f0fb;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:640px; background:#ffffff; border-radius:28px; overflow:hidden;">
            <tr>
              <td align="center" style="padding:30px 36px 24px; background:linear-gradient(180deg,#f6ebff 0%, #ffffff 100%); border-bottom:1px solid #efe2fb;">
                <img
                  src="{{brand_logo_url}}"
                  alt="{{brand_name}}"
                  width="240"
                  style="display:block; width:100%; max-width:240px; height:auto; border:0;"
                />
                <p style="margin:20px 0 10px; font-size:12px; line-height:1.4; letter-spacing:0.18em; text-transform:uppercase; color:#7d61a1;">
                  ${eyebrow}
                </p>
                <h1 style="margin:0; font-size:30px; line-height:1.12; color:#21142d;">${title}</h1>
                ${intro ? `<p style="margin:16px 0 0; font-size:15px; line-height:1.7; color:#5c4b6b;">${intro}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px 20px;">
                ${bodyHtml}
                ${cta ? ctaBlock(cta.label, cta.url, cta.supportText) : ''}
                <div style="margin-top:8px; padding-top:18px; border-top:1px solid #eadcf8;">
                  <p style="margin:0; font-size:15px; line-height:1.7; color:#2d2340;">${closing}</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildInvoiceTemplate() {
  const bodyHtml = `
    ${sectionBlock('', [
      '<em style="font-size:12px; color:#7a6d77;">*english follows portuguese*</em>'
    ])}
    ${sectionBlock('Português', [
      'Prezado Afiliado,',
      '<strong>Observação:</strong> esta informação é válida somente para recebimento dos valores referentes à Brazil Network.',
      'Para reforçar nossos controles internos e atender às exigências de auditoria e às novas regras relacionadas à Reforma Tributária, implementamos recentemente um novo processo de validação das notas fiscais recebidas.',
      'Durante essa conferência, identificamos que algumas notas estão sendo emitidas com dados incorretos ou incompletos da Rakuten Marketing Brasil Ltda, como cidade, endereço ou outras informações cadastrais.',
      'Por isso, pedimos atenção redobrada: é muito importante que todos os dados do tomador do serviço estejam exatamente corretos no momento da emissão da nota fiscal. Caso seja identificada qualquer divergência, a nota fiscal não poderá seguir para aprovação e pagamento.'
    ], [
      '<strong>Razão Social:</strong> Rakuten Marketing Brasil Ltda',
      '<strong>CNPJ:</strong> 18.355.228/0001-60',
      '<strong>Endereço:</strong> Avenida Domingos Odalia Filho, 301',
      '<strong>Complemento:</strong> Andar 7 - Sala 7W103 - Edifício The Cittyplex',
      '<strong>Bairro:</strong> Centro',
      '<strong>Cidade:</strong> Osasco - SP',
      '<strong>CEP:</strong> 06010-067'
    ])}
    ${sectionBlock('', [
      'Antes de emitir a nota fiscal, pedimos por gentileza que todos os campos sejam conferidos para garantir total aderência aos dados acima.',
      'Essa verificação é essencial para que possamos seguir com a validação fiscal e realizar os pagamentos dentro do prazo.'
    ])}
    ${sectionBlock('English', [
      'Dear Affiliate,',
      '<strong>Note:</strong> this information is valid only for receipt of amounts related to Brazil Network.',
      'To strengthen our internal controls and comply with audit requirements and the new rules related to the Tax Reform, we have recently implemented a new process for validating received invoices.',
      'During this review, we identified that some invoices are being issued with incorrect or incomplete details for Rakuten Marketing Brasil Ltda, such as city, address or other registration information.',
      'Therefore, we ask everyone to pay attention: all payer details must be exactly correct when issuing the invoice. If any discrepancy is identified, the invoice cannot proceed for approval and payment and must be reissued with the correct information.'
    ], [
      '<strong>Company Name:</strong> Rakuten Marketing Brasil Ltda',
      '<strong>CNPJ:</strong> 18.355.228/0001-60',
      '<strong>Address:</strong> Avenida Domingos Odalia Filho, 301',
      '<strong>Complement:</strong> 7th floor - Room 7W103 - The Cittyplex Building',
      '<strong>Neighborhood:</strong> Centro',
      '<strong>City:</strong> Osasco - SP',
      '<strong>ZIP Code:</strong> 06010-067'
    ])}
    ${sectionBlock('', [
      'Please check all fields before issuing the invoice, ensuring that the information exactly matches the data above.',
      'This verification is essential for us to proceed with tax validation and process payments on time.'
    ])}
  `;

  return buildEmailShell({
    title: 'Atualização de dados para emissão de Nota Fiscal',
    eyebrow: 'Comunicado fiscal',
    intro: 'Modelo pronto para comunicados formais e bilíngues. O layout já vem completo; você só ajusta o texto, se quiser.',
    bodyHtml,
    closing: 'Atenciosamente / Sincerely,<br /><strong>Equipe {{brand_name}}</strong>'
  });
}

function buildPromotionalTemplate() {
  return buildEmailShell({
    title: 'Seu próximo clique pode render mais valor',
    eyebrow: 'Oferta especial',
    intro: 'Modelo ideal para campanhas de incentivo, cupom ou ativação. Troque o texto principal e dispare.',
    bodyHtml: `
      ${sectionBlock('', [
        'Olá {{name}},',
        'Preparamos uma comunicação pronta para uso. Você pode explicar a oferta em uma frase curta, destacar o benefício principal e manter o email limpo.',
        'Se quiser personalizar, use variáveis da planilha como <strong>{{name}}</strong>, <strong>{{coupon_code}}</strong>, <strong>{{city}}</strong> ou qualquer outra coluna importada.'
      ])}
      ${sectionBlock('Destaques da campanha', [], [
        '<strong>Benefício:</strong> desconto, cashback, frete grátis ou benefício exclusivo',
        '<strong>Código:</strong> {{coupon_code}}',
        '<strong>Prazo:</strong> 31/12/2026',
        '<strong>Observação:</strong> ajuste este bloco para a oferta atual'
      ])}
    `,
    cta: {
      label: 'Aproveitar agora',
      url: DEFAULT_CTA_URL,
      supportText: 'Use este botão para levar o destinatário direto para a landing page da campanha.'
    },
    closing: 'Boa campanha,<br /><strong>Equipe {{brand_name}}</strong>'
  });
}

function buildWelcomeTemplate() {
  return buildEmailShell({
    title: 'Bem-vindo à operação {{brand_name}}',
    eyebrow: 'Boas-vindas',
    intro: 'Template simples para onboarding, ativação de parceiro ou primeiro contato com um cliente.',
    bodyHtml: `
      ${sectionBlock('', [
        'Olá {{name}},',
        'É um prazer ter você conosco. Este modelo foi pensado para dar contexto, explicar próximos passos e manter uma primeira impressão forte.',
        'Use os blocos abaixo para mostrar o que acontece agora, quem será o ponto de contato e onde o destinatário encontra o material principal.'
      ])}
      ${sectionBlock('Próximos passos', [], [
        'Explique em uma frase o objetivo da parceria ou do programa',
        'Liste a primeira ação esperada',
        'Indique um canal claro para dúvidas'
      ])}
    `,
    cta: {
      label: 'Ver próximos passos',
      url: DEFAULT_CTA_URL,
      supportText: 'Se houver um portal, página inicial ou documento guia, use este CTA.'
    },
    closing: 'Conte com a gente,<br /><strong>Equipe {{brand_name}}</strong>'
  });
}

function buildReminderTemplate() {
  return buildEmailShell({
    title: 'Ainda precisamos de uma ação sua',
    eyebrow: 'Lembrete',
    intro: 'Use este modelo para cobrança gentil, atualização cadastral, documentação pendente ou follow-up.',
    bodyHtml: `
      ${sectionBlock('', [
        'Olá {{name}},',
        'Estamos entrando em contato para lembrar que ainda existe uma pendência em aberto. Ajuste o texto abaixo com a ação esperada, o prazo e o impacto em caso de não conclusão.',
        'A ideia é manter o email curto, claro e objetivo.'
      ])}
      ${sectionBlock('Checklist sugerido', [], [
        'O que precisa ser enviado, aprovado ou confirmado',
        'Prazo final: dd/mm/aaaa',
        'Canal de retorno ou responsável interno'
      ])}
    `,
    cta: {
      label: 'Concluir agora',
      url: DEFAULT_CTA_URL,
      supportText: 'O botão pode apontar para formulário, portal, pasta compartilhada ou página de suporte.'
    },
    closing: 'Obrigado pela atenção,<br /><strong>Equipe {{brand_name}}</strong>'
  });
}

function buildOperationalTemplate() {
  return buildEmailShell({
    title: 'O que mudou no processo e o que você precisa saber',
    eyebrow: 'Atualização operacional',
    intro: 'Modelo pensado para mudanças de fluxo, calendário, SLA, cadastro ou aviso interno.',
    bodyHtml: `
      ${sectionBlock('', [
        'Olá {{name}},',
        'Estamos compartilhando uma atualização operacional importante. Este modelo foi desenhado para explicar mudança de processo sem excesso de texto.',
        'Mantenha o email em três blocos: o que mudou, quando passa a valer e o que a pessoa precisa fazer agora.'
      ])}
      ${sectionBlock('Resumo executivo', [], [
        'Descreva a mudança principal em uma frase',
        'Explique quando ela entra em vigor',
        'Deixe claro quem é impactado'
      ])}
      ${sectionBlock('Próxima ação', [
        'Se houver uma ação imediata, detalhe aqui em linguagem objetiva. Se não houver ação, use este espaço para reforçar o canal de suporte.'
      ])}
    `,
    closing: 'Seguimos à disposição,<br /><strong>Equipe {{brand_name}}</strong>'
  });
}

export const BUILT_IN_TEMPLATES = [
  {
    id: 'nota_fiscal_bilingue',
    name: 'Comunicado fiscal bilíngue',
    category: 'Financeiro',
    description: 'Base pronta para comunicados formais em português e inglês, no estilo do template enviado.',
    tags: ['PT/EN', 'formal', 'sem CTA'],
    isDefault: true,
    subject: 'Atualização de dados para emissão de Nota Fiscal',
    html: buildInvoiceTemplate()
  },
  {
    id: 'cupom_promocional',
    name: 'Oferta com cupom',
    category: 'Promoção',
    description: 'Modelo para campanha promocional com benefício, código e botão de ação.',
    tags: ['cupom', 'CTA', 'promo'],
    subject: '{{name}}, seu benefício especial chegou',
    html: buildPromotionalTemplate()
  },
  {
    id: 'boas_vindas',
    name: 'Boas-vindas',
    category: 'Relacionamento',
    description: 'Ideal para onboarding, ativação de parceiro ou primeiro contato mais institucional.',
    tags: ['welcome', 'onboarding', 'parceria'],
    subject: 'Bem-vindo à {{brand_name}}, {{name}}',
    html: buildWelcomeTemplate()
  },
  {
    id: 'lembrete_acao',
    name: 'Lembrete com ação',
    category: 'Operação',
    description: 'Bom para cobrança gentil, pendência, atualização de cadastro ou follow-up.',
    tags: ['lembrete', 'follow-up', 'prazo'],
    subject: 'Lembrete: precisamos da sua ação até dd/mm/aaaa',
    html: buildReminderTemplate()
  },
  {
    id: 'comunicado_operacional',
    name: 'Comunicado operacional',
    category: 'Operação',
    description: 'Use para mudança de processo, calendário, SLA ou alinhamento com parceiros.',
    tags: ['processo', 'informativo', 'operação'],
    subject: 'Atualização operacional da {{brand_name}}',
    html: buildOperationalTemplate()
  }
];

export const DEFAULT_TEMPLATE_PRESET =
  BUILT_IN_TEMPLATES.find((template) => template.isDefault) || BUILT_IN_TEMPLATES[0];

export function createDraftFromPreset(template) {
  return {
    mode: 'local',
    sourceType: 'preset',
    fileName: template.name,
    html: template.html,
    text: '',
    subject: template.subject,
    templateId: '',
    variables: [],
    presetId: template.id
  };
}

export function getPresetById(templateId) {
  return BUILT_IN_TEMPLATES.find((template) => template.id === templateId) || null;
}
