import { contextBridge, ipcRenderer } from 'electron';
import type {
  ConnectionInfo,
  ConnectionInput,
  AttachmentInput,
  OttoConfig,
  OttoEvent,
  PermissionRequest,
  PermissionResponse,
  RuntimePreferences,
  RuntimeStatus,
  SavedAttachment,
} from './shared/types';

const api = {
  runtime: {
    init: (): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:init'),
    status: (): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:status'),
    send: (text: string): Promise<void> => ipcRenderer.invoke('otto:send', text),
    abort: (): Promise<void> => ipcRenderer.invoke('otto:abort'),
    configure: (input: RuntimePreferences): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:configure', input),
    openLetta: (): Promise<string> => ipcRenderer.invoke('otto:open-letta'),
  },
  config: {
    get: (): Promise<OttoConfig> => ipcRenderer.invoke('otto:config:get'),
    set: (patch: Partial<OttoConfig>): Promise<OttoConfig> => ipcRenderer.invoke('otto:config:set', patch),
  },
  attachments: {
    save: (input: AttachmentInput): Promise<SavedAttachment> => ipcRenderer.invoke('otto:attachment:save', input),
  },
  connection: {
    get: (): Promise<ConnectionInfo> => ipcRenderer.invoke('otto:connection:get'),
    save: (input: ConnectionInput): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:connection:save', input),
  },
  permission: {
    respond: (requestId: string, response: PermissionResponse): void =>
      ipcRenderer.send('otto:permission:respond', requestId, response),
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
