function formatDuration(milliseconds) {
  if (!milliseconds) {
    return '—';
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export function DashboardScreen({ progress, logs, onPause, onResume, onCancel }) {
  const metrics = progress?.metrics;

  return (
    <section className="dashboard-grid">
      <article className="panel panel-wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">5. Live Dashboard</p>
            <h3>Fila, ETA e lote em andamento</h3>
          </div>
          <div className="panel-actions">
            <button className="ghost-button" onClick={onPause} disabled={progress?.status !== 'executando'}>
              Pausar
            </button>
            <button className="ghost-button" onClick={onResume} disabled={progress?.status !== 'pausada'}>
              Retomar
            </button>
            <button className="ghost-button danger-text" onClick={onCancel} disabled={!progress}>
              Cancelar
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <article className="metric-card">
            <span>Total</span>
            <strong>{metrics?.totalContacts ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span>Aceitos</span>
            <strong>{metrics?.acceptedCount ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span>Falhos</span>
            <strong>{metrics?.failedCount ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span>Pendentes</span>
            <strong>{metrics?.pendingCount ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span>Taxa de sucesso</span>
            <strong>{metrics?.successRate ?? 0}%</strong>
          </article>
          <article className="metric-card">
            <span>ETA</span>
            <strong>{formatDuration(progress?.etaMs)}</strong>
          </article>
        </div>

        <div className="progress-shell">
          <div className="progress-labels">
            <span>
              Lote {progress?.currentBatch?.batchIndex ?? 0} de {progress?.currentBatch?.totalBatches ?? 0}
            </span>
            <strong>
              {progress?.currentBatch?.completedRequests ?? 0}/{progress?.currentBatch?.totalRequests ?? 0} requisicoes
            </strong>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  progress?.currentBatch?.totalRequests
                    ? (progress.currentBatch.completedRequests / progress.currentBatch.totalRequests) * 100
                    : 0
                }%`
              }}
            />
          </div>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Logging</p>
            <h3>Console operacional</h3>
          </div>
        </div>
        <div className="log-list">
          {logs.map((entry, index) => (
            <div key={`${entry.createdAt}-${index}`} className={`log-entry ${entry.level}`}>
              <span>{entry.level}</span>
              <p>{entry.message}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
