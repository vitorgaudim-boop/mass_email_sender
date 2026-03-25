import { startTransition, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SEND_CONFIG, DEFAULT_TEMPLATE_DRAFT } from '../../shared/constants.js';
import { Sidebar } from './components/Sidebar.jsx';
import { ContactsTable } from './components/ContactsTable.jsx';
import { TemplateStudio } from './components/TemplateStudio.jsx';
import { ConfigScreen } from './components/ConfigScreen.jsx';
import { DashboardScreen } from './components/DashboardScreen.jsx';
import { ReportScreen } from './components/ReportScreen.jsx';

const FINAL_STATUSES = new Set(['concluida', 'concluida_com_falhas', 'cancelada', 'interrompida']);

function buildAvailableFields(contacts) {
  const fieldSet = new Set(['email', 'name']);

  for (const contact of contacts) {
    Object.keys(contact.variables || {}).forEach((key) => fieldSet.add(key));
  }

  return Array.from(fieldSet).sort((left, right) => left.localeCompare(right));
}

export function App() {
  const [activeScreen, setActiveScreen] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [templateDraft, setTemplateDraft] = useState(DEFAULT_TEMPLATE_DRAFT);
  const [configDraft, setConfigDraft] = useState(DEFAULT_SEND_CONFIG);
  const [history, setHistory] = useState([]);
  const [campaignProgress, setCampaignProgress] = useState(null);
  const [campaignLogs, setCampaignLogs] = useState([]);
  const [reportDetails, setReportDetails] = useState({
    history: null,
    results: [],
    logs: []
  });
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [notice, setNotice] = useState(null);
  const [busyState, setBusyState] = useState({
    bootstrapping: true,
    importingContacts: false,
    importingTemplate: false,
    sendingTest: false,
    startingCampaign: false
  });
  const [testState, setTestState] = useState({
    recipientsText: '',
    preview: null,
    sampleContact: null,
    results: []
  });
  const availableFields = useMemo(() => buildAvailableFields(contacts), [contacts]);

  useEffect(() => {
    let isMounted = true;

    window.envioApi
      .getBootstrap()
      .then((bootstrap) => {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setContacts(bootstrap.contacts || []);
          setTemplateDraft(bootstrap.templateDraft || DEFAULT_TEMPLATE_DRAFT);
          setConfigDraft(bootstrap.configDraft || DEFAULT_SEND_CONFIG);
          setHistory(bootstrap.history || []);
          if (bootstrap.history?.[0]?.id) {
            setSelectedCampaignId(bootstrap.history[0].id);
          }
        });
      })
      .catch((error) => {
        setNotice({ type: 'error', message: error.message });
      })
      .finally(() => {
        if (isMounted) {
          setBusyState((current) => ({ ...current, bootstrapping: false }));
        }
      });

    const unsubscribeProgress = window.envioApi.onProgress((payload) => {
      setCampaignProgress(payload);

      if (FINAL_STATUSES.has(payload.status)) {
        refreshHistory(payload.campaignId);
        loadCampaignDetails(payload.campaignId);
        setActiveScreen('report');
        setBusyState((current) => ({ ...current, startingCampaign: false }));
      }
    });

    const unsubscribeLog = window.envioApi.onLog((payload) => {
      setCampaignLogs((current) => [payload, ...current].slice(0, 250));
    });

    const unsubscribeError = window.envioApi.onError((payload) => {
      setNotice({ type: 'error', message: payload.message });
      setBusyState((current) => ({ ...current, startingCampaign: false }));
    });

    return () => {
      isMounted = false;
      unsubscribeProgress();
      unsubscribeLog();
      unsubscribeError();
    };
  }, []);

  useEffect(() => {
    if (busyState.bootstrapping) {
      return undefined;
    }

    const timer = setTimeout(() => {
      window.envioApi.saveConfig(configDraft).catch(() => {});
    }, 500);

    return () => clearTimeout(timer);
  }, [configDraft, busyState.bootstrapping]);

  useEffect(() => {
    if (busyState.bootstrapping) {
      return undefined;
    }

    const timer = setTimeout(() => {
      window.envioApi.saveTemplate(templateDraft).catch(() => {});
    }, 600);

    return () => clearTimeout(timer);
  }, [templateDraft, busyState.bootstrapping]);

  async function refreshHistory(focusCampaignId = '') {
    const nextHistory = await window.envioApi.getHistory();
    startTransition(() => {
      setHistory(nextHistory);
      if (focusCampaignId) {
        setSelectedCampaignId(focusCampaignId);
      }
    });
  }

  async function loadCampaignDetails(campaignId) {
    if (!campaignId) {
      return;
    }

    const nextDetails = await window.envioApi.getCampaignResults(campaignId);
    startTransition(() => {
      setSelectedCampaignId(campaignId);
      setReportDetails(nextDetails);
    });
  }

  async function handleImportContacts() {
    setBusyState((current) => ({ ...current, importingContacts: true }));

    try {
      const payload = await window.envioApi.importContacts();
      if (!payload) {
        return;
      }

      startTransition(() => {
        setContacts(payload.contacts);
        setNotice({
          type: 'success',
          message: `${payload.summary.validRows} contato(s) validado(s), ${payload.summary.invalidRows} invalido(s).`
        });
        setActiveScreen('contacts');
      });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setBusyState((current) => ({ ...current, importingContacts: false }));
    }
  }

  async function handleImportTemplate() {
    setBusyState((current) => ({ ...current, importingTemplate: true }));

    try {
      const template = await window.envioApi.importTemplate();
      if (!template) {
        return;
      }

      startTransition(() => {
        setTemplateDraft(template);
        setActiveScreen('template');
        setNotice({
          type: 'success',
          message: `Template ${template.fileName} carregado com sucesso.`
        });
      });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setBusyState((current) => ({ ...current, importingTemplate: false }));
    }
  }

  async function handleContactMutation(action, successMessage) {
    try {
      const nextContacts = await action();
      startTransition(() => {
        setContacts(nextContacts);
      });
      setNotice({ type: 'success', message: successMessage });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  async function handlePreviewTemplate() {
    try {
      const preview = await window.envioApi.previewTemplate({
        template: templateDraft,
        config: configDraft
      });

      startTransition(() => {
        setTestState((current) => ({ ...current, preview }));
      });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  async function handleSendTest() {
    setBusyState((current) => ({ ...current, sendingTest: true }));

    try {
      const payload = await window.envioApi.sendTest({
        config: configDraft,
        template: templateDraft,
        recipientsText: testState.recipientsText
      });

      startTransition(() => {
        setTestState((current) => ({
          ...current,
          preview: payload.preview,
          sampleContact: payload.sampleContact,
          results: payload.results
        }));
      });
      setNotice({ type: 'success', message: 'Envio de teste concluido.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setBusyState((current) => ({ ...current, sendingTest: false }));
    }
  }

  async function handleStartCampaign() {
    setBusyState((current) => ({ ...current, startingCampaign: true }));
    setCampaignLogs([]);

    try {
      const response = await window.envioApi.startCampaign({
        config: configDraft,
        template: templateDraft
      });

      setNotice({
        type: 'success',
        message: `Campanha iniciada para ${response.totalContacts} contato(s).`
      });
      setActiveScreen('dashboard');
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
      setBusyState((current) => ({ ...current, startingCampaign: false }));
    }
  }

  async function handleExportReport(campaignId) {
    try {
      const filePath = await window.envioApi.exportReport(campaignId);
      if (!filePath) {
        return;
      }

      setNotice({ type: 'success', message: `Relatorio exportado para ${filePath}.` });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  async function handlePurgeCampaign(campaignId) {
    try {
      const nextHistory = await window.envioApi.purgeCampaignDetails(campaignId);
      startTransition(() => {
        setHistory(nextHistory);
        setReportDetails((current) => ({ ...current, results: [] }));
      });
      setNotice({ type: 'success', message: 'Dados detalhados removidos com sucesso.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        totalContacts={contacts.length}
        historyCount={history.length}
      />
      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Bulk Email Sender</p>
            <h1>Envio de Email</h1>
            <p className="workspace-copy">
              Campanhas com SendGrid, lotes controlados, feedback em tempo real e limpeza consciente
              de dados sensiveis.
            </p>
          </div>
          <div className="workspace-actions">
            <button className="ghost-button" onClick={handleImportContacts} disabled={busyState.importingContacts}>
              {busyState.importingContacts ? 'Importando...' : 'Importar contatos'}
            </button>
            <button className="primary-button" onClick={handleImportTemplate} disabled={busyState.importingTemplate}>
              {busyState.importingTemplate ? 'Carregando...' : 'Carregar template'}
            </button>
          </div>
        </header>

        {notice ? <div className={`notice notice-${notice.type}`}>{notice.message}</div> : null}

        <section className="screen-grid">
          {activeScreen === 'contacts' ? (
            <ContactsTable
              contacts={contacts}
              onImportContacts={handleImportContacts}
              onClearContacts={() =>
                handleContactMutation(() => window.envioApi.clearContacts(), 'Contatos temporarios removidos.')
              }
              onRemoveContacts={(ids) =>
                handleContactMutation(() => window.envioApi.removeContacts(ids), 'Linhas removidas com sucesso.')
              }
              onExcludeContacts={(ids, excluded) =>
                handleContactMutation(
                  () => window.envioApi.excludeContacts(ids, excluded),
                  excluded ? 'Linhas excluidas do envio.' : 'Linhas reativadas para envio.'
                )
              }
            />
          ) : null}

          {activeScreen === 'template' ? (
            <TemplateStudio
              templateDraft={templateDraft}
              availableFields={availableFields}
              onChangeTemplate={setTemplateDraft}
              onPreview={handlePreviewTemplate}
              preview={testState.preview}
              onImportTemplate={handleImportTemplate}
            />
          ) : null}

          {activeScreen === 'config' ? (
            <ConfigScreen
              configDraft={configDraft}
              onChangeConfig={setConfigDraft}
              campaignIsActive={Boolean(campaignProgress && !FINAL_STATUSES.has(campaignProgress.status))}
              onSendTest={handleSendTest}
              onStartCampaign={handleStartCampaign}
              testState={testState}
              setTestState={setTestState}
              sendingTest={busyState.sendingTest}
              startingCampaign={busyState.startingCampaign}
            />
          ) : null}

          {activeScreen === 'dashboard' ? (
            <DashboardScreen
              progress={campaignProgress}
              logs={campaignLogs}
              onPause={() => window.envioApi.pauseCampaign().catch((error) => setNotice({ type: 'error', message: error.message }))}
              onResume={() => window.envioApi.resumeCampaign().catch((error) => setNotice({ type: 'error', message: error.message }))}
              onCancel={() => window.envioApi.cancelCampaign().catch((error) => setNotice({ type: 'error', message: error.message }))}
            />
          ) : null}

          {activeScreen === 'report' ? (
            <ReportScreen
              history={history}
              selectedCampaignId={selectedCampaignId}
              reportDetails={reportDetails}
              onRefreshHistory={refreshHistory}
              onLoadCampaign={loadCampaignDetails}
              onExportReport={handleExportReport}
              onPurgeCampaign={handlePurgeCampaign}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}
