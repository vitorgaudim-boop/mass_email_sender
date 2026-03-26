const ITEMS = [
  { id: 'contacts', label: 'Contatos' },
  { id: 'template', label: 'Template' },
  { id: 'config', label: 'Configuracao' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'report', label: 'Relatorio' }
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
          Filas previsiveis, personalizacao segura e governanca de envio para operacoes Rakuten em
          escala.
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
          <span>Campanhas no historico</span>
          <strong>{historyCount}</strong>
        </div>
      </div>
    </aside>
  );
}
