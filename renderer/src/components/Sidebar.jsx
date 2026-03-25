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
        <p className="sidebar-tag">Rakuten-inspired desktop flow</p>
        <h2>Envio de Email</h2>
        <p>
          Operacao limpa, filas previsiveis e um ritmo de campanha pensado para listas grandes sem
          perder controle.
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
