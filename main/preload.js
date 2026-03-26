import { contextBridge, ipcRenderer } from 'electron';

function subscribe(channel, handler) {
  const listener = (_event, payload) => handler(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('envioApi', {
  getBootstrap: () => ipcRenderer.invoke('app:get-bootstrap'),
  importContacts: () => ipcRenderer.invoke('contacts:import'),
  listContacts: () => ipcRenderer.invoke('contacts:list'),
  removeContacts: (ids) => ipcRenderer.invoke('contacts:remove', ids),
  excludeContacts: (ids, excluded) => ipcRenderer.invoke('contacts:exclude', ids, excluded),
  clearContacts: () => ipcRenderer.invoke('contacts:clear'),
  listGroups: () => ipcRenderer.invoke('groups:list'),
  createGroup: (payload) => ipcRenderer.invoke('groups:create', payload),
  deleteGroup: (groupId) => ipcRenderer.invoke('groups:delete', groupId),
  addGroupMembers: (groupId, contacts) => ipcRenderer.invoke('groups:add-members', groupId, contacts),
  removeGroupMembers: (groupId, contacts) =>
    ipcRenderer.invoke('groups:remove-members', groupId, contacts),
  importTemplate: () => ipcRenderer.invoke('template:import'),
  saveTemplate: (template) => ipcRenderer.invoke('template:save', template),
  previewTemplate: (payload) => ipcRenderer.invoke('template:preview', payload),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  sendTest: (payload) => ipcRenderer.invoke('campaign:send-test', payload),
  startCampaign: (payload) => ipcRenderer.invoke('campaign:start', payload),
  pauseCampaign: () => ipcRenderer.invoke('campaign:pause'),
  resumeCampaign: () => ipcRenderer.invoke('campaign:resume'),
  cancelCampaign: () => ipcRenderer.invoke('campaign:cancel'),
  getHistory: () => ipcRenderer.invoke('campaign:history'),
  getCampaignResults: (campaignId) => ipcRenderer.invoke('campaign:results', campaignId),
  purgeCampaignDetails: (campaignId) => ipcRenderer.invoke('campaign:purge-details', campaignId),
  exportReport: (campaignId) => ipcRenderer.invoke('campaign:export-report', campaignId),
  onProgress: (handler) => subscribe('campaign:progress', handler),
  onLog: (handler) => subscribe('campaign:log', handler),
  onError: (handler) => subscribe('campaign:error', handler)
});
