const ITEMS = [
  { id: 'contacts', label: 'Contatos' },
  { id: 'template', label: 'Template' },
  { id: 'config', label: 'Configuração' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'report', label: 'Relatório' }
];

export function Sidebar({ activeScreen, onSelectScreen, totalContacts, historyCount }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand compact-brand">
        <div className="brand-wordmark compact-wordmark">
          <span className="brand-rakuten">Rakuten</span>
          <span className="brand-advertising">Advertising</span>
        </div>
        <h2>Envio de Email</h2>
        <p>Operação de campanhas em lote com SendGrid, em um fluxo único e direto.</p>
      </div>

      <nav className="sidebar-nav">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className={item.id === activeScreen ? 'nav-link active' : 'nav-link'}
            onClick={() => onSelectScreen(item.id)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-summary">
        <div>
          <span>Contatos</span>
          <strong>{totalContacts}</strong>
        </div>
        <div>
          <span>Histórico</span>
          <strong>{historyCount}</strong>
        </div>
      </div>
    </aside>
  );
}
