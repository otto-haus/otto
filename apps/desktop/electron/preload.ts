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
  LabsConfig,
  OttoConfig,
  DreamSettings,
  OttoEvent,
  PermissionRequest,
  PermissionResponse,
  ReceiptDetail,
  ReceiptListResult,
  RuntimePreferences,
  RuntimeStatus,
  AppBuildInfo,
  LettaModelOption,
  SavedAttachment,
  StandardCitation,
  StandardListResult,
  StandardRecord,
  StandardConflictResult,
  MemoryListResult,
  MemoryBlockRecord,
  PracticeListResult,
  PracticeMetricsSnapshot,
  PracticeRunInput,
  PracticeRunResult,
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
  ProposalTarget,
  ProposalClassification,
  AutonomyPolicyResult,
  EvaluateAutonomyActionResult,
  KnowledgeListResult,
  SkillListResult,
  SkillRecord,
  ChannelListResult,
  CogneeHealth,
  CogneeCaptureReceipt,
  CogneeRecallSmokeResult,
  PgvectorStatus,
  TicketListResult,
  TicketCompileInput,
  TicketRecord,
  WorkerListResult,
  WorkerStatus,
  RunListResult,
  ApprovalListResult,
  TicketReviewRecord,
  ChatThreadRecord,
  ThreadListResult,
  ThreadSwitchResult,
  ProviderMirrorSnapshot,
  WorkspaceInfo,
} from './shared/types';
import type { CheckListResult, CheckRunResult } from '@otto-haus/core';
import type {
  BehaviorChangelogResult,
  ConstitutionResult,
  CultureExportResult,
  CultureImportPreview,
  DiagnosticsExportResult,
} from '@otto-haus/core';

const emptyChangelog = (windowDays: number): BehaviorChangelogResult => ({
  dir: '',
  entries: [],
  window_days: windowDays,
  empty_message: 'No behavior changes this week.',
});

const emptyMemory = (): MemoryListResult => ({
  agentId: null,
  baseUrl: null,
  blocks: [],
  apiPath: '/v1/agents/{agent_id}/core-memory/blocks',
  error: 'Could not load memory blocks from Letta.',
});

const emptyConstitution = (): ConstitutionResult => ({
  dir: '',
  yamlPath: '',
  mdPath: '',
  rawYaml: '',
  storage: 'files',
  document: {
    schema: 'otto.constitution.v1',
    version: '0.0.0',
    values: [],
    forbidden_actions: [],
    approval_rules: [],
    standards_refs: [],
    writeback_policy: {
      mode: 'proposal_only',
      requires_curation_accept: true,
      silent_apply_forbidden: true,
    },
    ratification_requirements: [],
  },
});

const api = {
  runtime: {
    init: (): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:init'),
    newChat: (): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:new-chat'),
    status: (): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:status'),
    send: (text: string): Promise<void> => ipcRenderer.invoke('otto:send', text),
    abort: (): Promise<void> => ipcRenderer.invoke('otto:abort'),
    configure: (input: RuntimePreferences): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:configure', input),
    openLetta: (): Promise<string> => ipcRenderer.invoke('otto:open-letta'),
  },
  terminal: {
    workspaceRoot: (): Promise<string> => ipcRenderer.invoke('otto:terminal:workspace-root'),
    open: (): Promise<{ ok: boolean; cwd: string; error?: string }> => ipcRenderer.invoke('otto:terminal:open'),
  },
  app: {
    buildInfo: (): Promise<AppBuildInfo> => ipcRenderer.invoke('otto:app:build-info'),
  },
  models: {
    list: (): Promise<LettaModelOption[]> => ipcRenderer.invoke('otto:models:list'),
  },
  config: {
    get: (): Promise<OttoConfig> => ipcRenderer.invoke('otto:config:get'),
    set: (patch: Partial<OttoConfig>): Promise<OttoConfig> => ipcRenderer.invoke('otto:config:set', patch),
  },
  /** Labs gate — same shape as Settings → Labs (`{ enabled, features }`). See `docs/v1/labs.md`. */
  labs: {
    /** Read master + per-feature toggles from `~/.otto/config.json`. */
    get: (): Promise<LabsConfig> => ipcRenderer.invoke('otto:labs:get'),
    /**
     * Patch Labs config (partial ok). Settings passes the full merged object; agents may patch
     * `{ enabled: true, features: { knowledge_cognee: true } }` without opening Settings.
     */
    set: (patch: Partial<LabsConfig>): Promise<LabsConfig> => ipcRenderer.invoke('otto:labs:set', patch),
  },
  /** Sleep-time reflection ("dreaming") — mirrors Letta /sleeptime; persisted to ~/.otto/config.json + Letta settings. */
  dreaming: {
    get: (): Promise<DreamSettings> => ipcRenderer.invoke('otto:dreaming:get'),
    set: (patch: Partial<DreamSettings>): Promise<DreamSettings> => ipcRenderer.invoke('otto:dreaming:set', patch),
  },
  attachments: {
    save: (input: AttachmentInput): Promise<SavedAttachment> => ipcRenderer.invoke('otto:attachment:save', input),
  },
  connection: {
    get: (): Promise<ConnectionInfo> => ipcRenderer.invoke('otto:connection:get'),
    save: (input: ConnectionInput): Promise<RuntimeStatus> => ipcRenderer.invoke('otto:connection:save', input),
  },
  workspace: {
    get: (): Promise<WorkspaceInfo> => ipcRenderer.invoke('otto:workspace:get'),
    reveal: (): Promise<string> => ipcRenderer.invoke('otto:workspace:reveal'),
  },
  permissionSession: {
    list: (): Promise<string[]> => ipcRenderer.invoke('otto:permission-session:list'),
    clear: (): Promise<{ ok: true }> => ipcRenderer.invoke('otto:permission-session:clear'),
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
    linkRunReceipt: (
      slug: string,
      input: { runId?: string; receiptId?: string; acId?: string; summary?: string },
    ): Promise<CharterMutationResult> =>
      ipcRenderer.invoke('otto:charters:link-run-receipt', slug, input),
  },
  standards: {
    list: (): Promise<StandardListResult> => ipcRenderer.invoke('otto:standards:list'),
    get: (slug: string): Promise<StandardRecord | null> => ipcRenderer.invoke('otto:standards:get', slug),
    citationsForText: (text: string): Promise<StandardCitation[]> => ipcRenderer.invoke('otto:standards:citations-for-text', text),
    conflictForStandard: (slug: string): Promise<StandardConflictResult | null> =>
      ipcRenderer.invoke('otto:standards:conflict-for-standard', slug).catch(() => null),
  },
  practices: {
    list: (): Promise<PracticeListResult> => ipcRenderer.invoke('otto:practices:list'),
    get: (slug: string): Promise<PracticeRecord | null> => ipcRenderer.invoke('otto:practices:get', slug),
    resolveForText: (text: string): Promise<PracticeReference | null> => ipcRenderer.invoke('otto:practices:resolve-for-text', text),
    metrics: (slug: string): Promise<PracticeMetricsSnapshot> => ipcRenderer.invoke('otto:practices:metrics', slug),
    run: (input: PracticeRunInput): Promise<PracticeRunResult> => ipcRenderer.invoke('otto:practices:run', input),
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
      classify: (input: { target: ProposalTarget; correction: string }): Promise<ProposalClassification> =>
        ipcRenderer.invoke('otto:curation:proposals:classify', input),
      decide: (id: string, input: DecideProposalInput): Promise<DecideProposalResult> =>
        ipcRenderer.invoke('otto:curation:proposals:decide', id, input),
    },
    approvals: {
      list: (): Promise<ApprovalListResult> => ipcRenderer.invoke('otto:curation:approvals:list'),
    },
  },
  knowledge: {
    list: (): Promise<KnowledgeListResult> => ipcRenderer.invoke('otto:knowledge:list'),
    resolveRole: (role: string) => ipcRenderer.invoke('otto:knowledge:resolve-role', role),
  },
  cognee: {
    health: (): Promise<CogneeHealth> => ipcRenderer.invoke('otto:cognee:health'),
    settings: {
      get: (): Promise<{ enabled: boolean; baseUrl: string }> => ipcRenderer.invoke('otto:cognee:settings:get'),
      set: (patch: { enabled?: boolean; baseUrl?: string }): Promise<CogneeHealth> =>
        ipcRenderer.invoke('otto:cognee:settings:set', patch),
    },
    start: (): Promise<CogneeHealth> => ipcRenderer.invoke('otto:cognee:start'),
    stop: (): Promise<CogneeHealth> => ipcRenderer.invoke('otto:cognee:stop'),
    latestCapture: (): Promise<CogneeCaptureReceipt | null> => ipcRenderer.invoke('otto:cognee:latest-capture'),
    captureDryRun: (): Promise<{ paths: string[]; count: number }> =>
      ipcRenderer.invoke('otto:cognee:capture-dry-run'),
    captureApply: (): Promise<CogneeCaptureReceipt | null> => ipcRenderer.invoke('otto:cognee:capture-apply'),
    recallSmoke: (query?: string): Promise<CogneeRecallSmokeResult> =>
      ipcRenderer.invoke('otto:cognee:recall-smoke', query),
  },
  pgvector: {
    status: (): Promise<PgvectorStatus> => ipcRenderer.invoke('otto:pgvector:status'),
  },
  skills: {
    list: (): Promise<SkillListResult> => ipcRenderer.invoke('otto:skills:list'),
    get: (slug: string): Promise<SkillRecord | null> => ipcRenderer.invoke('otto:skills:get', slug),
  },
  channels: {
    list: (): Promise<ChannelListResult> => ipcRenderer.invoke('otto:channels:list'),
  },
  tickets: {
    list: (): Promise<TicketListResult> => ipcRenderer.invoke('otto:tickets:list'),
    get: (ticketId: string): Promise<TicketRecord | null> => ipcRenderer.invoke('otto:tickets:get', ticketId),
    compile: (input: TicketCompileInput) => ipcRenderer.invoke('otto:tickets:compile', input),
    orchestrate: (input: TicketCompileInput & { repoRoot?: string }) => ipcRenderer.invoke('otto:tickets:orchestrate', input),
    orchestrateExisting: (ticketId: string, repoRoot?: string) =>
      ipcRenderer.invoke('otto:tickets:orchestrate-existing', ticketId, repoRoot),
    updateStatus: (
      ticketId: string,
      patch: Partial<Pick<TicketRecord, 'status' | 'owner' | 'model'>> & { review?: TicketReviewRecord },
    ) => ipcRenderer.invoke('otto:tickets:update-status', ticketId, patch),
  },
  checks: {
    list: (): Promise<CheckListResult> => ipcRenderer.invoke('otto:checks:list'),
    get: (id: string) => ipcRenderer.invoke('otto:checks:get', id),
    evaluateDoneClaim: (context: unknown): Promise<CheckRunResult[]> =>
      ipcRenderer.invoke('otto:checks:evaluate-done-claim', context),
    evaluateOneWayDoor: (context: unknown): Promise<CheckRunResult[]> =>
      ipcRenderer.invoke('otto:checks:evaluate-one-way-door', context),
  },
  provider: {
    mirror: (): Promise<ProviderMirrorSnapshot> => ipcRenderer.invoke('otto:provider:mirror'),
    setApiKey: (value: string): Promise<{ ok: boolean; hasApiKey: boolean }> =>
      ipcRenderer.invoke('otto:provider:set-api-key', value),
  },
  workers: {
    list: (): Promise<WorkerListResult> => ipcRenderer.invoke('otto:workers:list'),
    updateStatus: (id: string, status: WorkerStatus, receiptId?: string) =>
      ipcRenderer.invoke('otto:workers:update-status', id, status, receiptId),
    runBounded: (workerId: string, opts?: { maxTurns?: number }) =>
      ipcRenderer.invoke('otto:workers:run-bounded', workerId, opts),
  },
  runs: {
    list: (): Promise<RunListResult> => ipcRenderer.invoke('otto:runs:list'),
  },
  autonomy: {
    policy: (): Promise<AutonomyPolicyResult> => ipcRenderer.invoke('otto:autonomy:policy'),
    evaluateAction: (input: {
      action: string;
      context?: string;
      approved?: boolean;
      session_allowed?: boolean;
    }): Promise<EvaluateAutonomyActionResult> =>
      ipcRenderer.invoke('otto:autonomy:evaluate-action', input),
  },
  changelog: {
    list: (windowDays: number): Promise<BehaviorChangelogResult> =>
      ipcRenderer.invoke('otto:changelog:list', windowDays).catch(() => emptyChangelog(windowDays)),
  },
  memory: {
    list: (): Promise<MemoryListResult> =>
      ipcRenderer.invoke('otto:memory:list').catch(() => emptyMemory()),
  },
  constitution: {
    get: (): Promise<ConstitutionResult> =>
      ipcRenderer.invoke('otto:constitution:get').catch(() => emptyConstitution()),
    amend: (yamlDraft: string, amendedBy: string) =>
      ipcRenderer.invoke('otto:constitution:amend', yamlDraft, amendedBy),
    open: (): Promise<string> => ipcRenderer.invoke('otto:constitution:open'),
  },
  culture: {
    export: (): Promise<CultureExportResult> => ipcRenderer.invoke('otto:culture:export'),
    importPreview: (bundlePath: string): Promise<CultureImportPreview> =>
      ipcRenderer.invoke('otto:culture:import-preview', bundlePath),
  },
  diagnostics: {
    export: (): Promise<DiagnosticsExportResult> => ipcRenderer.invoke('otto:diagnostics:export'),
    reveal: (bundlePath: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('otto:diagnostics:reveal', bundlePath),
  },
  permission: {
    respond: (requestId: string, response: PermissionResponse): void =>
      ipcRenderer.send('otto:permission:respond', requestId, response),
    denyReceipt: (input: { requestId: string; toolName: string; message: string }): Promise<{ id: string; path: string }> =>
      ipcRenderer.invoke('otto:permission:deny-receipt', input),
  },
  smoke: {
    triggerPermission: (input?: { toolName?: string; requestId?: string; interactive?: boolean }) =>
      ipcRenderer.invoke('otto:smoke:trigger-permission', input),
  },
  threads: {
    list: (includeArchived?: boolean): Promise<ThreadListResult> =>
      ipcRenderer.invoke('otto:threads:list', includeArchived),
    create: (input?: { title?: string; agentId?: string | null }): Promise<ThreadSwitchResult> =>
      ipcRenderer.invoke('otto:threads:create', input),
    switch: (threadId: string): Promise<ThreadSwitchResult> =>
      ipcRenderer.invoke('otto:threads:switch', threadId),
    archive: (threadId: string): Promise<ChatThreadRecord> =>
      ipcRenderer.invoke('otto:threads:archive', threadId),
    unarchive: (threadId: string): Promise<ChatThreadRecord> =>
      ipcRenderer.invoke('otto:threads:unarchive', threadId),
    pin: (threadId: string, pinned: boolean): Promise<ChatThreadRecord> =>
      ipcRenderer.invoke('otto:threads:pin', threadId, pinned),
    move: (threadId: string, targetId: string): Promise<ThreadListResult> =>
      ipcRenderer.invoke('otto:threads:move', threadId, targetId),
    touch: (input: { title?: string; lettaConversationId?: string | null; agentId?: string | null }): Promise<ChatThreadRecord | null> =>
      ipcRenderer.invoke('otto:threads:touch', input),
  },
  onEvent: (cb: (e: OttoEvent) => void): (() => void) => {
    const h = (_: unknown, e: OttoEvent) => cb(e);
    ipcRenderer.on('otto:event', h);
    return () => ipcRenderer.removeListener('otto:event', h);
  },
  onActiveThread: (cb: (payload: { threadId: string; status: RuntimeStatus }) => void): (() => void) => {
    const h = (_: unknown, payload: { threadId: string; status: RuntimeStatus }) => cb(payload);
    ipcRenderer.on('otto:threads:active', h);
    return () => ipcRenderer.removeListener('otto:threads:active', h);
  },
  onPermission: (cb: (req: PermissionRequest) => void): (() => void) => {
    const h = (_: unknown, req: PermissionRequest) => cb(req);
    ipcRenderer.on('otto:permission', h);
    return () => ipcRenderer.removeListener('otto:permission', h);
  },
};

contextBridge.exposeInMainWorld('otto', api);

export type OttoApi = typeof api;
