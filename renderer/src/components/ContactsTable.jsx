import { useDeferredValue, useMemo, useState } from 'react';

function countByStatus(contacts) {
  return {
    total: contacts.length,
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
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function runBulkAction(action) {
    await action();
    setSelectedIds([]);
  }

  return (
    <section className="panel panel-wide">
      <div className="panel-header">
        <div>
          <p className="eyebrow">1. Contatos</p>
          <h3>Importe a planilha e confira exatamente quem vai receber</h3>
          <p className="section-copy">
            O formato esperado é simples: a coluna obrigatória é <code>email</code>. Você também
            pode usar <code>name</code> e qualquer outra coluna como variável de personalização.
          </p>
        </div>
        <div className="panel-actions">
          <button className="primary-button" onClick={onImportContacts}>
            Importar XLSX
          </button>
          <button className="ghost-button" onClick={onClearContacts} disabled={!contacts.length}>
            Limpar lista
          </button>
        </div>
      </div>

      <div className="pill-row helper-pills">
        <span className="variable-pill">email</span>
        <span className="variable-pill">name</span>
        <span className="variable-pill">coupon_code</span>
        <span className="variable-pill">city</span>
      </div>

      <div className="stats-row contact-stats-row">
        <article className="stat-chip">
          <span>Total importado</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="stat-chip">
          <span>Prontos para envio</span>
          <strong>{metrics.valid}</strong>
        </article>
        <article className="stat-chip">
          <span>Inválidos</span>
          <strong>{metrics.invalid}</strong>
        </article>
        <article className="stat-chip">
          <span>Fora da campanha</span>
          <strong>{metrics.excluded}</strong>
        </article>
      </div>

      <div className="table-toolbar contact-toolbar">
        <input
          className="input-field"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por email, nome ou qualquer variável"
        />
        <div className="inline-actions">
          <button
            className="ghost-button"
            disabled={!selectedIds.length}
            onClick={() => runBulkAction(() => onExcludeContacts(selectedIds, true))}
          >
            Tirar do envio
          </button>
          <button
            className="ghost-button"
            disabled={!selectedIds.length}
            onClick={() => runBulkAction(() => onExcludeContacts(selectedIds, false))}
          >
            Reativar
          </button>
          <button
            className="ghost-button"
            disabled={!selectedIds.length}
            onClick={() => runBulkAction(() => onRemoveContacts(selectedIds))}
          >
            Remover linhas
          </button>
        </div>
      </div>

      {filteredContacts.length ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>Linha</th>
                <th>Email</th>
                <th>Nome</th>
                <th>Variáveis</th>
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
                        ? 'Removido desta campanha'
                        : 'Pronto para envio'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <strong>Nenhum contato carregado ainda</strong>
          <p>Importe um arquivo `.xlsx` para visualizar a prévia da campanha.</p>
        </div>
      )}
    </section>
  );
}
