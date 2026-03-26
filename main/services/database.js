import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

function now() {
  return new Date().toISOString();
}

function parseJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stringify(value) {
  return JSON.stringify(value ?? null);
}

export class DatabaseService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  initialize() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS import_sessions (
        id TEXT PRIMARY KEY,
        source_path TEXT,
        file_name TEXT,
        total_rows INTEGER NOT NULL,
        valid_rows INTEGER NOT NULL,
        invalid_rows INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS temp_contacts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        variables_json TEXT NOT NULL,
        is_valid INTEGER NOT NULL,
        validation_error TEXT,
        excluded INTEGER NOT NULL DEFAULT 0,
        row_number INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contact_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contact_group_members (
        group_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        created_at TEXT NOT NULL,
        PRIMARY KEY (group_id, email)
      );

      CREATE TABLE IF NOT EXISTS campaign_runs (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        template_mode TEXT NOT NULL,
        send_mode TEXT NOT NULL,
        subject TEXT,
        sender_email TEXT NOT NULL,
        sender_name TEXT,
        batch_size INTEGER NOT NULL,
        delay_ms INTEGER NOT NULL,
        total_contacts INTEGER NOT NULL,
        accepted_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        pending_count INTEGER NOT NULL DEFAULT 0,
        cancelled_count INTEGER NOT NULL DEFAULT 0,
        success_rate REAL NOT NULL DEFAULT 0,
        auto_delete_temp_contacts INTEGER NOT NULL DEFAULT 1,
        details_purged_at TEXT,
        config_json TEXT NOT NULL,
        template_summary_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS campaign_batches (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        batch_index INTEGER NOT NULL,
        total_batches INTEGER NOT NULL,
        recipient_count INTEGER NOT NULL,
        request_count INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        last_error TEXT,
        started_at TEXT,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS campaign_results (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        batch_id TEXT,
        email TEXT NOT NULL,
        name TEXT,
        status TEXT NOT NULL,
        reason TEXT,
        request_strategy TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        finalized_at TEXT
      );

      CREATE TABLE IF NOT EXISTS campaign_logs (
        id TEXT PRIMARY KEY,
        campaign_id TEXT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        context_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    this.db.exec(`
      UPDATE campaign_runs
      SET status = 'interrompida', completed_at = '${now()}'
      WHERE status IN ('executando', 'pausada');
    `);
  }

  setSetting(key, value) {
    const statement = this.db.prepare(`
      INSERT INTO settings (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `);
    statement.run(key, stringify(value), now());
  }

  getSetting(key, fallback = null) {
    const row = this.db.prepare(`SELECT value_json FROM settings WHERE key = ?`).get(key);
    return row ? parseJson(row.value_json, fallback) : fallback;
  }

  saveTemplateDraft(template) {
    this.setSetting('templateDraft', template);
  }

  getTemplateDraft() {
    return this.getSetting('templateDraft', null);
  }

  saveConfigDraft(config) {
    this.setSetting('configDraft', config);
  }

  getConfigDraft() {
    return this.getSetting('configDraft', null);
  }

  replaceTempContacts(parsedWorkbook) {
    const sessionId = randomUUID();
    const createdAt = now();

    this.db.exec('DELETE FROM temp_contacts;');
    this.db.exec('DELETE FROM import_sessions;');

    this.db.prepare(`
      INSERT INTO import_sessions (id, source_path, file_name, total_rows, valid_rows, invalid_rows, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      parsedWorkbook.sourcePath,
      parsedWorkbook.fileName,
      parsedWorkbook.totalRows,
      parsedWorkbook.validRows,
      parsedWorkbook.invalidRows,
      createdAt
    );

    const insert = this.db.prepare(`
      INSERT INTO temp_contacts (
        id, session_id, email, name, variables_json, is_valid, validation_error, excluded, row_number, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const contact of parsedWorkbook.contacts) {
      insert.run(
        randomUUID(),
        sessionId,
        contact.email,
        contact.name,
        stringify(contact.variables),
        contact.isValid ? 1 : 0,
        contact.validationError,
        0,
        contact.rowNumber,
        createdAt
      );
    }

    return this.listTempContacts();
  }

  listTempContacts() {
    const rows = this.db.prepare(`
      SELECT id, email, name, variables_json, is_valid, validation_error, excluded, row_number, created_at
      FROM temp_contacts
      ORDER BY row_number ASC
    `).all();
    const membershipMap = this.getContactGroupMap(rows.map((row) => row.email));

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name || '',
      variables: parseJson(row.variables_json, {}),
      groups: membershipMap.get(row.email) || [],
      isValid: Boolean(row.is_valid),
      validationError: row.validation_error || '',
      excluded: Boolean(row.excluded),
      rowNumber: row.row_number,
      createdAt: row.created_at
    }));
  }

  removeTempContacts(ids = []) {
    const statement = this.db.prepare(`DELETE FROM temp_contacts WHERE id = ?`);
    for (const id of ids) {
      statement.run(id);
    }
    return this.listTempContacts();
  }

  toggleTempContactExclusion(ids = [], excluded = true) {
    const statement = this.db.prepare(`UPDATE temp_contacts SET excluded = ? WHERE id = ?`);
    for (const id of ids) {
      statement.run(excluded ? 1 : 0, id);
    }
    return this.listTempContacts();
  }

  clearTempContacts() {
    this.db.exec('DELETE FROM temp_contacts;');
    this.db.exec('DELETE FROM import_sessions;');
  }

  getEligibleContacts(groupIds = []) {
    const allowedEmails =
      Array.isArray(groupIds) && groupIds.length ? this.listGroupMemberEmails(groupIds) : null;

    return this.listTempContacts()
      .filter((contact) => contact.isValid && !contact.excluded)
      .filter((contact) => (allowedEmails ? allowedEmails.has(contact.email) : true))
      .map((contact) => ({
        id: contact.id,
        email: contact.email,
        name: contact.name || '',
        variables: contact.variables || {}
      }));
  }

  listContactGroups() {
    const groups = this.db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM contact_groups
      ORDER BY name COLLATE NOCASE ASC
    `).all();
    const currentEmails = new Set(this.listTempContacts().map((contact) => contact.email));
    const memberCounts = this.db.prepare(`
      SELECT group_id, email
      FROM contact_group_members
      ORDER BY created_at ASC
    `).all();
    const summaryMap = new Map();

    for (const membership of memberCounts) {
      const current = summaryMap.get(membership.group_id) || {
        memberCount: 0,
        currentContactsCount: 0
      };
      current.memberCount += 1;
      if (currentEmails.has(membership.email)) {
        current.currentContactsCount += 1;
      }
      summaryMap.set(membership.group_id, current);
    }

    return groups.map((group) => {
      const summary = summaryMap.get(group.id) || {
        memberCount: 0,
        currentContactsCount: 0
      };

      return {
        id: group.id,
        name: group.name,
        description: group.description || '',
        memberCount: summary.memberCount,
        currentContactsCount: summary.currentContactsCount,
        createdAt: group.created_at,
        updatedAt: group.updated_at
      };
    });
  }

  createContactGroup({ name, description = '' }) {
    const id = randomUUID();
    const timestamp = now();

    this.db.prepare(`
      INSERT INTO contact_groups (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, description, timestamp, timestamp);

    return this.listContactGroups();
  }

  deleteContactGroup(groupId) {
    this.db.prepare(`DELETE FROM contact_group_members WHERE group_id = ?`).run(groupId);
    this.db.prepare(`DELETE FROM contact_groups WHERE id = ?`).run(groupId);
    return this.listContactGroups();
  }

  addContactsToGroup(groupId, contacts = []) {
    const insert = this.db.prepare(`
      INSERT INTO contact_group_members (group_id, email, name, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(group_id, email) DO UPDATE SET name = excluded.name
    `);
    const timestamp = now();

    for (const contact of contacts) {
      if (!contact?.email) {
        continue;
      }

      insert.run(groupId, contact.email, contact.name || '', timestamp);
    }

    this.db.prepare(`UPDATE contact_groups SET updated_at = ? WHERE id = ?`).run(timestamp, groupId);

    return {
      groups: this.listContactGroups(),
      contacts: this.listTempContacts()
    };
  }

  removeContactsFromGroup(groupId, contacts = []) {
    const remove = this.db.prepare(`
      DELETE FROM contact_group_members
      WHERE group_id = ? AND email = ?
    `);
    const timestamp = now();

    for (const contact of contacts) {
      if (!contact?.email) {
        continue;
      }

      remove.run(groupId, contact.email);
    }

    this.db.prepare(`UPDATE contact_groups SET updated_at = ? WHERE id = ?`).run(timestamp, groupId);

    return {
      groups: this.listContactGroups(),
      contacts: this.listTempContacts()
    };
  }

  listGroupMemberEmails(groupIds = []) {
    if (!groupIds.length) {
      return new Set();
    }

    const placeholders = groupIds.map(() => '?').join(', ');
    const rows = this.db.prepare(`
      SELECT DISTINCT email
      FROM contact_group_members
      WHERE group_id IN (${placeholders})
    `).all(...groupIds);

    return new Set(rows.map((row) => row.email));
  }

  getContactGroupMap(emails = []) {
    const filteredEmails = Array.from(new Set(emails.filter(Boolean)));
    const map = new Map();

    if (!filteredEmails.length) {
      return map;
    }

    const placeholders = filteredEmails.map(() => '?').join(', ');
    const rows = this.db.prepare(`
      SELECT members.email, groups.id AS group_id, groups.name
      FROM contact_group_members members
      INNER JOIN contact_groups groups ON groups.id = members.group_id
      WHERE members.email IN (${placeholders})
      ORDER BY groups.name COLLATE NOCASE ASC
    `).all(...filteredEmails);

    for (const row of rows) {
      const current = map.get(row.email) || [];
      current.push({
        id: row.group_id,
        name: row.name
      });
      map.set(row.email, current);
    }

    return map;
  }

  createCampaignRun(config, templateSummary, totalContacts) {
    const id = randomUUID();
    const createdAt = now();

    this.db.prepare(`
      INSERT INTO campaign_runs (
        id, status, created_at, started_at, template_mode, send_mode, subject, sender_email, sender_name, batch_size,
        delay_ms, total_contacts, accepted_count, failed_count, pending_count, cancelled_count, success_rate,
        auto_delete_temp_contacts, config_json, template_summary_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 0, 0, ?, ?, ?)
    `).run(
      id,
      'executando',
      createdAt,
      createdAt,
      templateSummary.mode,
      config.sendMode,
      config.subject,
      config.senderEmail,
      config.senderName || '',
      config.batchSize,
      config.delayMs,
      totalContacts,
      totalContacts,
      config.autoDeleteTempContacts ? 1 : 0,
      stringify(config),
      stringify(templateSummary)
    );

    return id;
  }

  updateCampaignMetrics(campaignId, metrics) {
    this.db.prepare(`
      UPDATE campaign_runs
      SET accepted_count = ?, failed_count = ?, pending_count = ?, cancelled_count = ?, success_rate = ?
      WHERE id = ?
    `).run(
      metrics.acceptedCount,
      metrics.failedCount,
      metrics.pendingCount,
      metrics.cancelledCount,
      metrics.successRate,
      campaignId
    );
  }

  finalizeCampaign(campaignId, status, metrics) {
    this.db.prepare(`
      UPDATE campaign_runs
      SET status = ?, completed_at = ?, accepted_count = ?, failed_count = ?, pending_count = ?, cancelled_count = ?, success_rate = ?
      WHERE id = ?
    `).run(
      status,
      now(),
      metrics.acceptedCount,
      metrics.failedCount,
      metrics.pendingCount,
      metrics.cancelledCount,
      metrics.successRate,
      campaignId
    );
  }

  createBatch(campaignId, batchIndex, totalBatches, recipientCount, requestCount) {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO campaign_batches (
        id, campaign_id, batch_index, total_batches, recipient_count, request_count, attempts, status
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, campaignId, batchIndex, totalBatches, recipientCount, requestCount, 'pendente');
    return id;
  }

  updateBatch(batchId, payload) {
    this.db.prepare(`
      UPDATE campaign_batches
      SET attempts = ?, status = ?, last_error = ?, started_at = COALESCE(started_at, ?), completed_at = ?
      WHERE id = ?
    `).run(
      payload.attempts,
      payload.status,
      payload.lastError || null,
      payload.startedAt || now(),
      payload.completedAt || null,
      batchId
    );
  }

  addCampaignLog(campaignId, level, message, context = {}) {
    this.db.prepare(`
      INSERT INTO campaign_logs (id, campaign_id, level, message, context_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), campaignId, level, message, stringify(context), now());
  }

  listCampaignLogs(campaignId, limit = 250) {
    return this.db.prepare(`
      SELECT id, level, message, context_json, created_at
      FROM campaign_logs
      WHERE campaign_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(campaignId, limit).map((row) => ({
      id: row.id,
      level: row.level,
      message: row.message,
      context: parseJson(row.context_json, {}),
      createdAt: row.created_at
    }));
  }

  insertCampaignResults(campaignId, batchId, rows) {
    const statement = this.db.prepare(`
      INSERT INTO campaign_results (
        id, campaign_id, batch_id, email, name, status, reason, request_strategy, metadata_json, created_at, finalized_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const row of rows) {
      statement.run(
        randomUUID(),
        campaignId,
        batchId,
        row.email,
        row.name || '',
        row.status,
        row.reason || '',
        row.requestStrategy,
        stringify(row.metadata || {}),
        now(),
        row.finalizedAt || now()
      );
    }
  }

  listCampaignResults(campaignId) {
    return this.db.prepare(`
      SELECT id, email, name, status, reason, request_strategy, metadata_json, created_at, finalized_at
      FROM campaign_results
      WHERE campaign_id = ?
      ORDER BY email ASC, created_at ASC
    `).all(campaignId).map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name || '',
      status: row.status,
      reason: row.reason || '',
      requestStrategy: row.request_strategy,
      metadata: parseJson(row.metadata_json, {}),
      createdAt: row.created_at,
      finalizedAt: row.finalized_at
    }));
  }

  purgeCampaignDetails(campaignId) {
    this.db.prepare(`DELETE FROM campaign_results WHERE campaign_id = ?`).run(campaignId);
    this.db.prepare(`
      UPDATE campaign_runs
      SET details_purged_at = ?
      WHERE id = ?
    `).run(now(), campaignId);
  }

  listCampaignHistory(limit = 30) {
    return this.db.prepare(`
      SELECT
        run.id,
        run.status,
        run.created_at,
        run.started_at,
        run.completed_at,
        run.template_mode,
        run.send_mode,
        run.subject,
        run.sender_email,
        run.sender_name,
        run.batch_size,
        run.delay_ms,
        run.total_contacts,
        run.accepted_count,
        run.failed_count,
        run.pending_count,
        run.cancelled_count,
        run.success_rate,
        run.details_purged_at,
        run.config_json,
        run.template_summary_json,
        EXISTS(SELECT 1 FROM campaign_results results WHERE results.campaign_id = run.id LIMIT 1) AS details_available
      FROM campaign_runs run
      ORDER BY run.created_at DESC
      LIMIT ?
    `).all(limit).map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      templateMode: row.template_mode,
      sendMode: row.send_mode,
      subject: row.subject,
      senderEmail: row.sender_email,
      senderName: row.sender_name || '',
      batchSize: row.batch_size,
      delayMs: row.delay_ms,
      totalContacts: row.total_contacts,
      acceptedCount: row.accepted_count,
      failedCount: row.failed_count,
      pendingCount: row.pending_count,
      cancelledCount: row.cancelled_count,
      successRate: row.success_rate,
      detailsPurgedAt: row.details_purged_at,
      detailsAvailable: Boolean(row.details_available),
      config: parseJson(row.config_json, {}),
      templateSummary: parseJson(row.template_summary_json, {})
    }));
  }
}
