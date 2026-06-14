import { contextBridge, ipcRenderer } from 'electron';
import type { CurationProposal } from '@otto-haus/core';
import type {
  OttoConfig,
  OttoEvent,
  PermissionRequest,
  PermissionResponse,
  RuntimeStatus,
} from './shared/types';

const api = {
  runtime: {
    init: (): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:init'),
    status: (): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:status'),
    send: (text: string): Promise<void> => ipcRenderer.invoke('otto:send', text),
    abort: (): Promise<void> => ipcRenderer.invoke('otto:abort'),
  },
  config: {
    get: (): Promise<OttoConfig> => ipcRenderer.invoke('otto:config:get'),
    set: (patch: Partial<OttoConfig>): Promise<OttoConfig> => ipcRenderer.invoke('otto:config:set', patch),
  },
  permission: {
    respond: (requestId: string, response: PermissionResponse): void =>
      ipcRenderer.send('otto:permission:respond', requestId, response),
  },
  curation: {
    list: (): Promise<CurationProposal[]> => ipcRenderer.invoke('otto:curation:list'),
    propose: (payload: Omit<CurationProposal, 'id' | 'status' | 'created_at'>): Promise<CurationProposal> =>
      ipcRenderer.invoke('otto:curation:propose', payload),
    ratify: (id: string, decision: 'approved' | 'rejected'): Promise<CurationProposal> =>
      ipcRenderer.invoke('otto:curation:ratify', id, decision),
    apply: (id: string): Promise<CurationProposal> =>
      ipcRenderer.invoke('otto:curation:apply', id),
  },
  onEvent: (cb: (e: OttoEvent) => void): (() => void) => {
    const h = (_: unknown, e: OttoEvent) => cb(e);
    ipcRenderer.on('otto:event', h);
    return () => ipcRenderer.removeListener('otto:event', h);
  },
  onPermission: (cb: (req: PermissionRequest) => void): (() => void) => {
    const h = (_: unknown, req: PermissionRequest) => cb(req);
    ipcRenderer.on('otto:permission', h);
    return () => ipcRenderer.removeListener('otto:permission', h);
  },
};

contextBridge.exposeInMainWorld('otto', api);

export type OttoApi = typeof api;

