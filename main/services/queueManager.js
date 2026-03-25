import { EventEmitter } from 'node:events';
import { CAMPAIGN_STATUS, RESULT_STATUS } from '../../shared/constants.js';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateSuccessRate(acceptedCount, totalContacts) {
  if (!totalContacts) {
    return 0;
  }

  return Number(((acceptedCount / totalContacts) * 100).toFixed(2));
}

function createMetrics(totalContacts) {
  return {
    totalContacts,
    acceptedCount: 0,
    failedCount: 0,
    pendingCount: totalContacts,
    cancelledCount: 0,
    successRate: 0,
    processedRequestUnits: 0
  };
}

export class QueueManager extends EventEmitter {
  constructor({ database, emailService }) {
    super();
    this.database = database;
    this.emailService = emailService;
    this.currentCampaign = null;
    this.resumeResolver = null;
  }

  getCurrentCampaign() {
    return this.currentCampaign;
  }

  log(level, message, context = {}) {
    const campaignId = this.currentCampaign?.campaignId || null;
    this.database.addCampaignLog(campaignId, level, message, context);
    this.emit('log', {
      level,
      message,
      context,
      campaignId,
      createdAt: new Date().toISOString()
    });
  }

  emitProgress() {
    if (!this.currentCampaign) {
      return;
    }

    const { metrics, totalRequestUnits, currentBatch, startedAt } = this.currentCampaign;
    const elapsedMs = Date.now() - startedAt;
    const averageUnitMs = metrics.processedRequestUnits
      ? elapsedMs / metrics.processedRequestUnits
      : 0;
    const remainingUnits = Math.max(totalRequestUnits - metrics.processedRequestUnits, 0);
    const etaMs = averageUnitMs ? Math.round(averageUnitMs * remainingUnits) : 0;

    this.emit('progress', {
      campaignId: this.currentCampaign.campaignId,
      status: this.currentCampaign.status,
      metrics: {
        ...metrics,
        successRate: calculateSuccessRate(metrics.acceptedCount, metrics.totalContacts)
      },
      totalRequestUnits,
      etaMs,
      currentBatch
    });
  }

  async waitIfPaused() {
    while (this.currentCampaign?.status === CAMPAIGN_STATUS.PAUSED) {
      await new Promise((resolve) => {
        this.resumeResolver = resolve;
      });
    }
  }

  pauseCampaign() {
    if (!this.currentCampaign || this.currentCampaign.status !== CAMPAIGN_STATUS.RUNNING) {
      throw new Error('Nenhuma campanha em execucao para pausar.');
    }

    this.currentCampaign.status = CAMPAIGN_STATUS.PAUSED;
    this.log('info', 'Campanha pausada pelo usuario.');
    this.emitProgress();
  }

  resumeCampaign() {
    if (!this.currentCampaign || this.currentCampaign.status !== CAMPAIGN_STATUS.PAUSED) {
      throw new Error('Nenhuma campanha pausada para retomar.');
    }

    this.currentCampaign.status = CAMPAIGN_STATUS.RUNNING;
    this.log('info', 'Campanha retomada pelo usuario.');
    this.resumeResolver?.();
    this.resumeResolver = null;
    this.emitProgress();
  }

  cancelCampaign() {
    if (!this.currentCampaign || ![CAMPAIGN_STATUS.RUNNING, CAMPAIGN_STATUS.PAUSED].includes(this.currentCampaign.status)) {
      throw new Error('Nenhuma campanha ativa para cancelar.');
    }

    this.currentCampaign.cancelRequested = true;
    this.currentCampaign.status = CAMPAIGN_STATUS.CANCELLED;
    this.log('warn', 'Cancelamento solicitado. Somente lotes ainda nao enviados serao interrompidos.');
    this.resumeResolver?.();
    this.resumeResolver = null;
    this.emitProgress();
  }

  async sendTest({ config, template, testRecipients, sampleContact }) {
    this.emailService.validateConfig(config, template, [{ email: sampleContact.email || config.senderEmail }]);
    const syntheticContacts = testRecipients.map((recipient, index) => ({
      id: `test-${index + 1}`,
      email: recipient.email,
      name: recipient.name || '',
      variables: sampleContact.variables || {}
    }));
    const templateForSend =
      template.mode === 'sendgrid_dynamic'
        ? template
        : {
            ...template,
            subject: template.subject || config.subject
          };
    const requestUnits = this.emailService.buildBatchRequests({
      contacts: syntheticContacts,
      template: templateForSend,
      config: {
        ...config,
        sendMode: 'individual',
        enablePersonalization: config.enablePersonalization
      },
      campaignId: 'test-mode',
      batchIndex: 1
    });
    const results = [];

    for (const requestUnit of requestUnits) {
      const outcome = await this.emailService.sendWithRetry(requestUnit, config);
      for (const contact of requestUnit.contacts) {
        results.push({
          email: contact.email,
          status: outcome.ok ? RESULT_STATUS.ACCEPTED : RESULT_STATUS.FAILED,
          reason: outcome.ok ? '' : outcome.error.message,
          attempts: outcome.attempt
        });
      }
    }

    return results;
  }

  async startCampaign({ config, template, contacts }) {
    if (this.currentCampaign) {
      throw new Error('Ja existe uma campanha em andamento.');
    }

    this.emailService.validateConfig(config, template, contacts);
    const batches = this.emailService.getLogicalBatches(contacts, config.batchSize);
    const totalRequestUnits = this.emailService.countRequestUnits(contacts, template, config);
    const templateSummary = this.emailService.summarizeTemplate(template);
    const campaignId = this.database.createCampaignRun(config, templateSummary, contacts.length);
    const metrics = createMetrics(contacts.length);

    this.currentCampaign = {
      campaignId,
      status: CAMPAIGN_STATUS.RUNNING,
      metrics,
      totalRequestUnits,
      currentBatch: null,
      cancelRequested: false,
      startedAt: Date.now()
    };

    this.log('info', 'Campanha iniciada.', {
      campaignId,
      totalContacts: contacts.length,
      batches: batches.length
    });
    this.emitProgress();

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      await this.waitIfPaused();

      if (this.currentCampaign.cancelRequested) {
        break;
      }

      const batchContacts = batches[batchIndex];
      const requestUnits = this.emailService.buildBatchRequests({
        contacts: batchContacts,
        template,
        config,
        campaignId,
        batchIndex: batchIndex + 1
      });
      const batchId = this.database.createBatch(
        campaignId,
        batchIndex + 1,
        batches.length,
        batchContacts.length,
        requestUnits.length
      );

      this.currentCampaign.currentBatch = {
        batchIndex: batchIndex + 1,
        totalBatches: batches.length,
        totalRecipients: batchContacts.length,
        completedRequests: 0,
        totalRequests: requestUnits.length
      };
      this.database.updateBatch(batchId, {
        attempts: 0,
        status: 'executando',
        startedAt: new Date().toISOString()
      });
      this.emitProgress();

      let batchFailureCount = 0;

      for (const requestUnit of requestUnits) {
        await this.waitIfPaused();

        if (this.currentCampaign.cancelRequested) {
          const cancelledResults = requestUnit.contacts.map((contact) => ({
            email: contact.email,
            name: contact.name,
            status: RESULT_STATUS.CANCELLED,
            reason: 'Cancelado antes do envio.',
            requestStrategy: requestUnit.requestStrategy
          }));
          this.database.insertCampaignResults(campaignId, batchId, cancelledResults);
          metrics.cancelledCount += requestUnit.contacts.length;
          metrics.pendingCount -= requestUnit.contacts.length;
          metrics.processedRequestUnits += 1;
          this.currentCampaign.currentBatch.completedRequests += 1;
          this.emitProgress();
          continue;
        }

        const outcome = await this.emailService.sendWithRetry(requestUnit, config, (level, message, context) =>
          this.log(level, message, context)
        );
        const isAccepted = outcome.ok;
        const resultRows = requestUnit.contacts.map((contact) => ({
          email: contact.email,
          name: contact.name,
          status: isAccepted ? RESULT_STATUS.ACCEPTED : RESULT_STATUS.FAILED,
          reason: isAccepted ? '' : outcome.error.message,
          requestStrategy: requestUnit.requestStrategy,
          metadata: {
            attempts: outcome.attempt
          }
        }));

        this.database.insertCampaignResults(campaignId, batchId, resultRows);

        if (isAccepted) {
          metrics.acceptedCount += requestUnit.contacts.length;
          this.log('info', requestUnit.description, {
            requestUnitId: requestUnit.id,
            recipients: requestUnit.contacts.length
          });
        } else {
          metrics.failedCount += requestUnit.contacts.length;
          batchFailureCount += requestUnit.contacts.length;
          this.log('error', outcome.error.message, {
            requestUnitId: requestUnit.id,
            recipients: requestUnit.contacts.length
          });
        }

        metrics.pendingCount -= requestUnit.contacts.length;
        metrics.processedRequestUnits += 1;
        metrics.successRate = calculateSuccessRate(metrics.acceptedCount, metrics.totalContacts);
        this.database.updateCampaignMetrics(campaignId, metrics);
        this.currentCampaign.currentBatch.completedRequests += 1;
        this.emitProgress();
      }

      this.database.updateBatch(batchId, {
        attempts: requestUnits.length,
        status:
          batchFailureCount === 0
            ? 'concluido'
            : batchFailureCount === batchContacts.length
              ? 'falhou'
              : 'parcial',
        completedAt: new Date().toISOString(),
        lastError: batchFailureCount ? 'Uma ou mais requisicoes falharam.' : ''
      });

      if (
        batchIndex < batches.length - 1 &&
        config.delayMs > 0 &&
        !this.currentCampaign.cancelRequested
      ) {
        await wait(config.delayMs);
      }
    }

    const finalStatus = this.currentCampaign.cancelRequested
      ? CAMPAIGN_STATUS.CANCELLED
      : metrics.failedCount > 0
        ? CAMPAIGN_STATUS.COMPLETED_WITH_FAILURES
        : CAMPAIGN_STATUS.COMPLETED;

    this.currentCampaign.status = finalStatus;
    metrics.successRate = calculateSuccessRate(metrics.acceptedCount, metrics.totalContacts);
    this.database.finalizeCampaign(campaignId, finalStatus, metrics);

    if (config.autoDeleteTempContacts) {
      this.database.clearTempContacts();
    }

    this.log(
      'info',
      finalStatus === CAMPAIGN_STATUS.CANCELLED
        ? 'Campanha encerrada com cancelamento.'
        : 'Campanha finalizada.',
      { finalStatus }
    );
    this.emitProgress();

    const result = {
      campaignId,
      status: finalStatus,
      metrics
    };

    this.currentCampaign = null;
    return result;
  }
}
