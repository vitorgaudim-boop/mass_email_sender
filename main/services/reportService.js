import fs from 'node:fs/promises';

function escapeCsv(value) {
  const normalized = String(value ?? '');
  if (/[",\n;]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

export async function exportCampaignResultsCsv(filePath, campaign, results) {
  const header = [
    'campaign_id',
    'status',
    'email',
    'name',
    'reason',
    'request_strategy',
    'attempts',
    'created_at'
  ];
  const rows = results.map((result) => [
    campaign.id,
    result.status,
    result.email,
    result.name,
    result.reason,
    result.requestStrategy,
    result.metadata?.attempts ?? '',
    result.createdAt
  ]);
  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');

  await fs.writeFile(filePath, csv, 'utf8');
}
