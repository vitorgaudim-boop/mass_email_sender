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
      <div className="sidebar-brand">
        <p className="sidebar-tag">Rakuten Advertising</p>
        <div className="brand-wordmark">
          <span className="brand-rakuten">Rakuten</span>
          <span className="brand-advertising">Advertising</span>
        </div>
        <h2>Envio de Email</h2>
        <p>
          Importe a base, escolha um modelo pronto, valide e acompanhe o disparo sem precisar
          navegar por uma interface confusa.
        </p>
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
          <span>Contatos no buffer</span>
          <strong>{totalContacts}</strong>
        </div>
        <div>
          <span>Campanhas no histórico</span>
          <strong>{historyCount}</strong>
        </div>
      </div>
    </aside>
  );
}
