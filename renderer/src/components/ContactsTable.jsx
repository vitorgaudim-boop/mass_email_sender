import { useDeferredValue, useMemo, useState } from 'react';

function countByStatus(contacts) {
  return {
    valid: contacts.filter((contact) => contact.isValid && !contact.excluded).length,
    invalid: contacts.filter((contact) => !contact.isValid).length,
    excluded: contacts.filter((contact) => contact.excluded).length
  };
}

export function ContactsTable({
  contacts,
  onImportContacts,
  onClearContacts,
  onRemoveContacts,
  onExcludeContacts
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const deferredSearch = useDeferredValue(searchTerm);
  const metrics = useMemo(() => countByStatus(contacts), [contacts]);
  const filteredContacts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const variableString = Object.values(contact.variables || {}).join(' ').toLowerCase();
      return [contact.email, contact.name, variableString].join(' ').toLowerCase().includes(query);
    });
  }, [contacts, deferredSearch]);

  function toggleSelection(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="panel panel-wide">
      <div className="panel-header">
        <div>
          <p className="eyebrow">1. Contact Upload</p>
          <h3>Planilha, validacao e buffer temporario</h3>
        </div>
        <div className="panel-actions">
          <button className="ghost-button" onClick={onImportContacts}>
            Reimportar XLSX
          </button>
          <button className="ghost-button" onClick={onClearContacts} disabled={!contacts.length}>
            Limpar buffer
          </button>
        </div>
      </div>

      <div className="stats-row">
        <article className="stat-chip">
          <span>Validos</span>
          <strong>{metrics.valid}</strong>
        </article>
        <article className="stat-chip">
          <span>Invalidos</span>
          <strong>{metrics.invalid}</strong>
        </article>
        <article className="stat-chip">
          <span>Excluidos do envio</span>
          <strong>{metrics.excluded}</strong>
        </article>
      </div>

      <div className="table-toolbar">
        <input
          className="input-field"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar email, nome ou variavel"
        />
        <div className="inline-actions">
          <button className="ghost-button" disabled={!selectedIds.length} onClick={() => onExcludeContacts(selectedIds, true)}>
            Excluir do envio
          </button>
          <button className="ghost-button" disabled={!selectedIds.length} onClick={() => onExcludeContacts(selectedIds, false)}>
            Reativar
          </button>
          <button className="ghost-button" disabled={!selectedIds.length} onClick={() => onRemoveContacts(selectedIds)}>
            Remover linhas
          </button>
        </div>
      </div>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th />
              <th>Linha</th>
              <th>Email</th>
              <th>Nome</th>
              <th>Variaveis</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr
                key={contact.id}
                className={!contact.isValid ? 'row-invalid' : contact.excluded ? 'row-muted' : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(contact.id)}
                    onChange={() => toggleSelection(contact.id)}
                  />
                </td>
                <td>{contact.rowNumber}</td>
                <td>{contact.email}</td>
                <td>{contact.name || '—'}</td>
                <td>{Object.keys(contact.variables || {}).join(', ') || '—'}</td>
                <td>
                  {!contact.isValid
                    ? contact.validationError
                    : contact.excluded
                      ? 'Excluido manualmente'
                      : 'Pronto para envio'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
