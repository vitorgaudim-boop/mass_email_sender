export function ReportScreen({
  history,
  selectedCampaignId,
  reportDetails,
  onRefreshHistory,
  onLoadCampaign,
  onExportReport,
  onPurgeCampaign
}) {
  return (
    <section className="report-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">6. Relatório</p>
            <h3>Histórico de campanhas</h3>
          </div>
          <button className="ghost-button" onClick={() => onRefreshHistory(selectedCampaignId)}>
            Atualizar
          </button>
        </div>

        {history.length ? (
          <div className="history-list">
            {history.map((item) => (
              <button
                key={item.id}
                className={item.id === selectedCampaignId ? 'history-item active' : 'history-item'}
                onClick={() => onLoadCampaign(item.id)}
              >
                <div>
                  <strong>{item.subject || 'Campanha sem assunto'}</strong>
                  <span>{item.senderEmail}</span>
                </div>
                <div>
                  <strong>
                    {item.acceptedCount}/{item.totalContacts}
                  </strong>
                  <span>{item.status}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>Sem campanhas no histórico</strong>
            <p>Quando a primeira campanha terminar, ela aparecerá aqui.</p>
          </div>
        )}
      </article>

      <article className="panel panel-wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Detalhes</p>
            <h3>Resultado por destinatário</h3>
          </div>
          <div className="panel-actions">
            <button
              className="ghost-button"
              onClick={() => onExportReport(selectedCampaignId)}
              disabled={!selectedCampaignId}
            >
              Exportar CSV
            </button>
            <button
              className="ghost-button"
              onClick={() => onPurgeCampaign(selectedCampaignId)}
              disabled={!selectedCampaignId}
            >
              Apagar detalhes
            </button>
          </div>
        </div>

        {selectedCampaignId ? (
          <>
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Motivo</th>
                    <th>Estratégia</th>
                    <th>Tentativas</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDetails.results.map((result) => (
                    <tr key={result.id}>
                      <td>{result.email}</td>
                      <td>{result.status}</td>
                      <td>{result.reason || '—'}</td>
                      <td>{result.requestStrategy}</td>
                      <td>{result.metadata?.attempts ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="log-list compact">
              {reportDetails.logs.map((entry) => (
                <div key={entry.id} className={`log-entry ${entry.level}`}>
                  <span>{entry.level}</span>
                  <p>{entry.message}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>Selecione uma campanha</strong>
            <p>Escolha um item do histórico para ver os detalhes do envio e exportar o CSV.</p>
          </div>
        )}
      </article>
    </section>
  );
}
