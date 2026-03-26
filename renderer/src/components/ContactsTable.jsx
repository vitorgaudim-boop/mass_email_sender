import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

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
  contactGroups,
  selectedGroupIds,
  onToggleGroupSelection,
  onImportContacts,
  onClearContacts,
  onRemoveContacts,
  onExcludeContacts,
  onCreateGroup,
  onDeleteGroup,
  onAddSelectedToGroup,
  onRemoveSelectedFromGroup
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const headerCheckboxRef = useRef(null);
  const deferredSearch = useDeferredValue(searchTerm);
  const metrics = useMemo(() => countByStatus(contacts), [contacts]);

  const filteredContacts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const variableString = Object.values(contact.variables || {}).join(' ').toLowerCase();
      const groupsString = (contact.groups || [])
        .map((group) => group.name)
        .join(' ')
        .toLowerCase();

      return [contact.email, contact.name, variableString, groupsString]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [contacts, deferredSearch]);

  const filteredIds = useMemo(
    () => filteredContacts.map((contact) => contact.id),
    [filteredContacts]
  );
  const selectedContacts = useMemo(
    () => contacts.filter((contact) => selectedIds.includes(contact.id)),
    [contacts, selectedIds]
  );
  const selectedFilteredCount = useMemo(
    () => filteredIds.filter((id) => selectedIds.includes(id)).length,
    [filteredIds, selectedIds]
  );
  const allFilteredSelected = Boolean(filteredIds.length) && selectedFilteredCount === filteredIds.length;
  const hasPartialFilteredSelection =
    selectedFilteredCount > 0 && selectedFilteredCount < filteredIds.length;

  useEffect(() => {
    if (!headerCheckboxRef.current) {
      return;
    }

    headerCheckboxRef.current.indeterminate = hasPartialFilteredSelection;
  }, [hasPartialFilteredSelection]);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => contacts.some((contact) => contact.id === id))
    );
  }, [contacts]);

  function toggleSelection(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleFilteredSelection() {
    if (!filteredIds.length) {
      return;
    }

    setSelectedIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }

      return Array.from(new Set([...current, ...filteredIds]));
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function runBulkAction(action) {
    await action();
    clearSelection();
  }

  async function runRowAction(action) {
    await action();
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) {
      return;
    }

    await onCreateGroup(newGroupName.trim());
    setNewGroupName('');
  }

  return (
    <section className="panel panel-wide">
      <div className="panel-header">
        <div>
          <p className="eyebrow">1. Contatos</p>
          <h3>Base local, grupos e lista atual de envio</h3>
          <p className="section-copy">
            O app já usa uma base local em SQLite. A planilha continua entrando aqui, mas agora você
            também consegue montar grupos persistentes para decidir quem entra no disparo.
          </p>
        </div>
        <div className="panel-actions">
          <button className="primary-button" onClick={onImportContacts}>
            Importar XLSX
          </button>
          <button className="ghost-button" onClick={onClearContacts} disabled={!contacts.length}>
            Limpar lista atual
          </button>
        </div>
      </div>

      <div className="contacts-layout">
        <aside className="groups-panel">
          <div className="panel-header compact">
            <div>
              <p className="eyebrow">Grupos</p>
              <h3>Gerenciar grupos de contatos</h3>
            </div>
          </div>

          <div className="group-create-row">
            <input
              className="input-field"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="Novo grupo"
            />
            <button className="ghost-button" onClick={handleCreateGroup}>
              Criar
            </button>
          </div>

          <label>
            <span>Grupo alvo para operações em massa</span>
            <select
              className="input-field"
              value={targetGroupId}
              onChange={(event) => setTargetGroupId(event.target.value)}
            >
              <option value="">Escolha um grupo</option>
              {contactGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <div className="selection-summary compact">
            <strong>{selectedIds.length} marcado(s)</strong>
            <span>{filteredContacts.length} contato(s) visíveis na busca atual</span>
          </div>

          <div className="inline-actions">
            <button
              className="ghost-button"
              disabled={!filteredContacts.length}
              onClick={toggleFilteredSelection}
            >
              {allFilteredSelected ? 'Desmarcar visíveis' : 'Marcar visíveis'}
            </button>
            <button className="ghost-button" disabled={!selectedIds.length} onClick={clearSelection}>
              Limpar seleção
            </button>
          </div>

          <div className="group-action-grid">
            <button
              className="ghost-button"
              disabled={!selectedContacts.length || !targetGroupId}
              onClick={() => runBulkAction(() => onAddSelectedToGroup(targetGroupId, selectedContacts))}
            >
              Adicionar marcados
            </button>
            <button
              className="ghost-button"
              disabled={!filteredContacts.length || !targetGroupId}
              onClick={() => runBulkAction(() => onAddSelectedToGroup(targetGroupId, filteredContacts))}
            >
              Adicionar todos da busca
            </button>
            <button
              className="ghost-button"
              disabled={!selectedContacts.length || !targetGroupId}
              onClick={() =>
                runBulkAction(() => onRemoveSelectedFromGroup(targetGroupId, selectedContacts))
              }
            >
              Remover marcados
            </button>
            <button
              className="ghost-button"
              disabled={!filteredContacts.length || !targetGroupId}
              onClick={() =>
                runBulkAction(() => onRemoveSelectedFromGroup(targetGroupId, filteredContacts))
              }
            >
              Remover todos da busca
            </button>
          </div>

          <div className="group-list">
            {contactGroups.map((group) => {
              const active = selectedGroupIds.includes(group.id);

              return (
                <article key={group.id} className={active ? 'group-card active' : 'group-card'}>
                  <div className="group-card-header">
                    <div>
                      <strong>{group.name}</strong>
                      <span>
                        {group.currentContactsCount} na base atual · {group.memberCount} no grupo
                      </span>
                    </div>
                    <button className="ghost-button danger-text" onClick={() => onDeleteGroup(group.id)}>
                      Excluir
                    </button>
                  </div>

                  <label className="group-toggle">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => onToggleGroupSelection(group.id)}
                    />
                    <span>Usar este grupo no disparo</span>
                  </label>
                </article>
              );
            })}

            {!contactGroups.length ? (
              <div className="empty-state compact-empty-state">
                <strong>Nenhum grupo criado ainda</strong>
                <p>Crie grupos para separar públicos e escolher quais entram no disparo.</p>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="contacts-main">
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
              placeholder="Buscar por email, nome, variável ou grupo"
            />
            <div className="inline-actions">
              <button
                className="ghost-button"
                disabled={!filteredContacts.length}
                onClick={toggleFilteredSelection}
              >
                {allFilteredSelected ? 'Desmarcar tudo' : 'Marcar tudo'}
              </button>
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

          <div className="selection-summary">
            <strong>{selectedIds.length} contato(s) marcado(s)</strong>
            <span>
              Use o checkbox do cabeçalho para selecionar todos os contatos visíveis na busca atual.
            </span>
          </div>

          {filteredContacts.length ? (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="table-checkbox-cell">
                      <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleFilteredSelection}
                        aria-label="Selecionar todos os contatos visíveis"
                      />
                    </th>
                    <th>Linha</th>
                    <th>Email</th>
                    <th>Nome</th>
                    <th>Grupos</th>
                    <th>Variáveis</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={!contact.isValid ? 'row-invalid' : contact.excluded ? 'row-muted' : ''}
                    >
                      <td className="table-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(contact.id)}
                          onChange={() => toggleSelection(contact.id)}
                        />
                      </td>
                      <td>{contact.rowNumber}</td>
                      <td>{contact.email}</td>
                      <td>{contact.name || '—'}</td>
                      <td>
                        {(contact.groups || []).length ? (
                          <div className="group-chip-list">
                            {(contact.groups || []).map((group) => (
                              <span key={group.id} className="group-chip">
                                {group.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{Object.keys(contact.variables || {}).join(', ') || '—'}</td>
                      <td>
                        {!contact.isValid
                          ? contact.validationError
                          : contact.excluded
                            ? 'Removido desta campanha'
                            : 'Pronto para envio'}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="ghost-button mini-button"
                            onClick={() =>
                              runRowAction(() => onExcludeContacts([contact.id], !contact.excluded))
                            }
                          >
                            {contact.excluded ? 'Reativar' : 'Tirar do envio'}
                          </button>
                          <button
                            className="ghost-button mini-button danger-text"
                            onClick={() => runRowAction(() => onRemoveContacts([contact.id]))}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <strong>Nenhuma lista temporária carregada agora</strong>
              <p>
                Importe um arquivo `.xlsx` para visualizar a base atual. Os grupos persistidos
                continuam salvos e ainda podem ser usados no disparo.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
