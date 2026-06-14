import { contextBridge, ipcRenderer } from 'electron';
import type {
  ConnectionInfo,
  ConnectionInput,
  AttachmentInput,
  CharterCreateInput,
  CharterDetail,
  CharterListResult,
  CharterMutationResult,
  CharterStatus,
  OttoConfig,
  OttoEvent,
  PermissionRequest,
  PermissionResponse,
  ReceiptDetail,
  ReceiptListResult,
  RuntimePreferences,
  RuntimeStatus,
  SavedAttachment,
  StandardCitation,
  StandardListResult,
  StandardRecord,
  PracticeListResult,
  PracticeRecord,
  PracticeReference,
  RoutineActivationGate,
  RoutineListResult,
  RoutineManualRunResult,
  RoutineRecord,
  CreateProposalFromCorrectionInput,
  CreateProposalResult,
  DecideProposalInput,
  DecideProposalResult,
  ProposalListResult,
  CurationProposalRecord,
  AutonomyPolicyResult,
  EvaluateAutonomyActionResult,
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
  receipts: {
    list: (): Promise<ReceiptListResult> => ipcRenderer.invoke('otto:receipts:list'),
    get: (id: string): Promise<ReceiptDetail | null> => ipcRenderer.invoke('otto:receipts:get', id),
  },
  charters: {
    list: (): Promise<CharterListResult> => ipcRenderer.invoke('otto:charters:list'),
    get: (slug: string): Promise<CharterDetail | null> => ipcRenderer.invoke('otto:charters:get', slug),
    create: (input: CharterCreateInput): Promise<CharterMutationResult> => ipcRenderer.invoke('otto:charters:create', input),
    updateStatus: (slug: string, status: CharterStatus, summary?: string): Promise<CharterMutationResult> =>
      ipcRenderer.invoke('otto:charters:update-status', slug, status, summary),
    linkRunReceipt: (slug: string, input: { runId?: string; receiptId?: string; summary?: string }): Promise<CharterMutationResult> =>
      ipcRenderer.invoke('otto:charters:link-run-receipt', slug, input),
  },
  standards: {
    list: (): Promise<StandardListResult> => ipcRenderer.invoke('otto:standards:list'),
    get: (slug: string): Promise<StandardRecord | null> => ipcRenderer.invoke('otto:standards:get', slug),
    citationsForText: (text: string): Promise<StandardCitation[]> => ipcRenderer.invoke('otto:standards:citations-for-text', text),
  },
  practices: {
    list: (): Promise<PracticeListResult> => ipcRenderer.invoke('otto:practices:list'),
    get: (slug: string): Promise<PracticeRecord | null> => ipcRenderer.invoke('otto:practices:get', slug),
    resolveForText: (text: string): Promise<PracticeReference | null> => ipcRenderer.invoke('otto:practices:resolve-for-text', text),
  },
  routines: {
    list: (): Promise<RoutineListResult> => ipcRenderer.invoke('otto:routines:list'),
    get: (slug: string): Promise<RoutineRecord | null> => ipcRenderer.invoke('otto:routines:get', slug),
    activationGate: (slug: string): Promise<RoutineActivationGate> => ipcRenderer.invoke('otto:routines:activation-gate', slug),
    runManual: (slug: string): Promise<RoutineManualRunResult> => ipcRenderer.invoke('otto:routines:run-manual', slug),
  },
  curation: {
    proposals: {
      list: (): Promise<ProposalListResult> => ipcRenderer.invoke('otto:curation:proposals:list'),
      get: (id: string): Promise<CurationProposalRecord | null> => ipcRenderer.invoke('otto:curation:proposals:get', id),
      createFromCorrection: (input: CreateProposalFromCorrectionInput): Promise<CreateProposalResult> =>
        ipcRenderer.invoke('otto:curation:proposals:create-from-correction', input),
      decide: (id: string, input: DecideProposalInput): Promise<DecideProposalResult> =>
        ipcRenderer.invoke('otto:curation:proposals:decide', id, input),
    },
  },
  autonomy: {
    policy: (): Promise<AutonomyPolicyResult> => ipcRenderer.invoke('otto:autonomy:policy'),
    evaluateAction: (input: { action: string; context?: string }): Promise<EvaluateAutonomyActionResult> =>
      ipcRenderer.invoke('otto:autonomy:evaluate-action', input),
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
