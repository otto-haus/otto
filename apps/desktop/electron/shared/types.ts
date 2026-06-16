// Shared types across the Electron main process and the renderer (type-only, erased at runtime).
import type {
  Charter,
  CharterRef,
  CharterStatus,
  Receipt,
  ReceiptStatus,
  StandardCitation,
  StandardRecord,
  StandardsRegistry,
  PracticeRecord,
  PracticeReference,
  RoutineRecord,
  RoutineReference,
  CurationProposalRecord,
  CreateProposalFromCorrectionInput,
  DecideProposalInput,
  ProposalClassification,
  ProposalTarget,
  RunSummary,
} from '@otto-haus/core';

export type { CharterStatus };

export type PermissionScope = 'once' | 'session';

export type PermissionResponse =
  | { behavior: 'allow'; scope?: PermissionScope; updatedInput?: Record<string, unknown> | null }
  | { behavior: 'deny'; message: string };

export interface PermissionRequest {
  requestId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  /** AskUserQuestion / ExitPlanMode need richer rendering than a yes/no gate. */
  interactive: boolean;
}

/** Connection diagnosis categories — drive the Settings guidance + the not-ready CTA. */
export type StatusCode =
  | 'ready'
  | 'no-agent'
  | 'no-api-key'
  | 'unreachable'
  | 'sdk-missing'
  | 'stale'
  | 'usage-limit'
  | 'error';

export type RuntimeTransportMode = 'sdk' | 'ws' | 'auto';
export type EffectiveTransport = 'sdk subprocess' | 'websocket local';

/** The single source of truth for whether chat may be enabled. */
export interface RuntimeStatus {
  ready: boolean;
  /** Human diagnosis when not ready (shown cleanly, never as a raw stack). */
  reason?: string;
  /** Machine-readable diagnosis so the UI can show the right next step. */
  code?: StatusCode;
  agentId?: string | null;
  conversationId?: string | null;
  model?: string;
  modelHandle?: string | null;
  effort?: EffortLevel;
  sessionMode?: 'default' | 'smoke';
  memfsEnabled?: boolean;
  tools?: string[];
  /** Effective local/self-hosted base URL used after discovery/config. */
  baseUrl?: string | null;
  /** Human-readable source for runtime/agent discovery. */
  discoverySource?: string;
  /** Configured transport mode (sdk | ws | auto). */
  transportMode?: RuntimeTransportMode;
  /** Active transport after selection/fallback. */
  effectiveTransport?: EffectiveTransport;
  /** Visible reason when auto mode fell back to SDK. */
  transportFallbackReason?: string | null;
  /** Human-readable reason when session model differs from requested handle (BYOK discovery gap). */
  modelFallbackReason?: string | null;
  /** ISO timestamp of last runtime socket reconnect. */
  lastReconnectAt?: string | null;
  /** Loopback BYOR listener port when WS transport is active. */
  wsListenerPort?: number | null;
  cliPath: string;
  cliResolved: boolean;
}

export type AppChannel = 'release' | 'staging' | 'dev' | 'disposable';

/** Packaged app provenance — stamped by deploy-staging.sh, release install, or dev fallback. */
export interface AppBuildInfo {
  sha: string | null;
  shortSha: string | null;
  builtAt: string | null;
  branch: string | null;
  channel: AppChannel | null;
  version: string | null;
  appPath: string | null;
  profilePath: string | null;
  homePath: string | null;
  mainSha: string | null;
  mainShortSha: string | null;
  /** null when mainSha or sha is unknown; false when staging build is not at origin/main. */
  matchesMain: boolean | null;
}

export type WorkspaceRepoRootSource = 'otto_root' | 'cwd';
export type OttoHomeSource = 'otto_home' | 'otto_config_dir' | 'default';

/** Resolved workspace paths for Settings (281). */
export interface WorkspaceInfo {
  repoRoot: string;
  ottoHome: string;
  repoRootSource: WorkspaceRepoRootSource;
  ottoHomeSource: OttoHomeSource;
}

/** What the Settings "Connect Letta" card reads. v1 is local-only; provider auth lives in Letta. */
export interface ConnectionInfo {
  baseUrl: string | null;
  agentId: string | null;
}

/** What the card sends on save. */
export interface ConnectionInput {
  baseUrl?: string | null;
  agentId?: string | null;
}

export type EffortLevel = 'off' | 'low' | 'medium' | 'high' | 'max';

export interface RuntimePreferences {
  modelHandle?: string | null;
  effort?: EffortLevel;
}

export interface LettaModelOption {
  handle: string;
  label: string;
  provider?: string | null;
  displayName?: string | null;
  deprecated?: boolean;
  /** Letta `provider_category` when present — `byok` rows get a picker badge (#459). */
  providerCategory?: 'base' | 'byok' | null;
}

/** Renderer-provided pasted/dropped image. Saved locally before being referenced in chat. */
export interface AttachmentInput {
  name: string;
  mime: string;
  dataUrl: string;
}

/** Local attachment persisted under ~/.otto/attachments. */
export interface SavedAttachment {
  id: string;
  name: string;
  mime: string;
  path: string;
  url: string;
  size: number;
}

export interface ReceiptSummary {
  id: string;
  timestamp: string;
  status: ReceiptStatus;
  action: string;
  subjectType: Receipt['subject']['type'];
  subjectId: string | null;
  summary: string;
  blockerCode: string | null;
  evidenceCount: number;
  practiceSlug: string | null;
  routineSlug: string | null;
  path: string;
}

export type ReceiptDetail = Receipt & { path: string };

export interface ReceiptListResult {
  dir: string;
  receipts: ReceiptSummary[];
  skipped: number;
}

export type ReceiptPreviewKind = 'markdown' | 'html' | 'image';

export type ReceiptPreviewBodyResult = {
  eligible: boolean;
  reason?: string;
  content?: {
    title: string;
    kind: ReceiptPreviewKind;
    body: string;
    sourceId?: string;
  };
};

export interface CharterCreateInput {
  slug: string;
  objective: string;
  title?: string;
  status?: CharterStatus;
  acceptanceCriteria: Array<{ id: string; text: string; receipts?: string[] }>;
  runIds?: string[];
  receiptIds?: string[];
}

export type CharterDetail = Charter & { root: string; path: string };

export interface CharterListResult {
  dir: string;
  charters: CharterRef[];
}

export interface CharterMutationResult {
  charter: Charter;
  path: string;
  receipt: Receipt & { path: string };
}

export interface StandardListResult {
  dir: string;
  registryPath: string;
  registry: StandardsRegistry;
  standards: StandardRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
}

export type { StandardCitation, StandardRecord, StandardsRegistry, PracticeRecord, PracticeReference };

export interface PracticeListResult {
  dir: string;
  practices: PracticeRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
}

export interface PracticeMetricsSnapshot {
  slug: string;
  uses: number;
  last_used_at: string | null;
  successful_runs: number;
  blocked_runs: number;
  last_run_id?: string;
  last_receipt_id?: string;
  last_receipt_path?: string;
}

export interface PracticeRunPayload {
  note?: string;
  raw_note?: string;
  source?: { who?: string; role?: string; where?: string; when?: string };
  acceptance_criteria?: Array<{ id: string; text: string; proof?: string; receipts?: string[] }>;
  review?: { verdict?: string; evidence?: string[]; reviewed_at?: string };
  evidence?: string[];
  artifacts?: string[];
  intent?: string;
}

export interface PracticeRunInput {
  slug: string;
  invocation?: string;
  payload?: PracticeRunPayload;
  approved?: boolean;
}

export interface PracticeRunResult {
  practice: PracticeRecord;
  invocation: string;
  run: RunSummary;
  receipt: Receipt & { path: string };
  artifactPath?: string;
  blocked: boolean;
}

export interface RoutineListResult {
  dir: string;
  routines: RoutineRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
}

export interface RoutineActivationGate {
  slug: string;
  requiresApproval: boolean;
  scheduled: boolean;
  allowed: boolean;
  reason: string;
}

export interface RoutineManualRunResult {
  routine: RoutineRecord;
  receipt: Receipt & { path: string };
  knowledgeReceiptId?: string;
  observeReceiptId?: string;
  proposalIds?: string[];
}

export type { RoutineRecord, RoutineReference, CurationProposalRecord, CreateProposalFromCorrectionInput, DecideProposalInput, ProposalClassification, ProposalTarget };

export interface ProposalListResult {
  dir: string;
  proposals: CurationProposalRecord[];
  skipped: number;
  storage: 'files';
}

export interface CreateProposalResult {
  proposal: CurationProposalRecord;
  receipt: Receipt & { path: string };
}

export interface DecideProposalResult {
  proposal: CurationProposalRecord;
  receipt: Receipt & { path: string };
  blocked?: boolean;
  compiledCheckId?: string | null;
}

export type { StandardConflictResult } from '@otto-haus/core';

/** Default sidebar ordering for threads without manual sortOrder (164). */
export type ConversationSortMode = 'recent' | 'created';

/** Chat composer send/queue shortcut — default Tab keeps Enter for steering/newlines (#48). */
export type ComposerSendShortcut = 'tab' | 'enter';

/** Local chat thread index (046). */
export interface ChatThreadRecord {
  id: string;
  lettaConversationId: string | null;
  agentId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** Manual drag order within pinned or recents group; null falls back to conversationSortMode. */
  sortOrder?: number | null;
  pinned: boolean;
  archived: boolean;
}

export interface ThreadListResult {
  dir: string;
  activeThreadId: string | null;
  threads: ChatThreadRecord[];
}

/** Provider capability mirror — boolean presence only (078). */
export interface ProviderMirrorSnapshot {
  /** True only when a live runtime session has initialized (session.initialize success). */
  lettaConnected: boolean;
  /** True when a Letta base URL is configured/discovered but liveness was not probed. */
  lettaConfigured: boolean;
  hasApiKey: boolean;
  modelHandle: string | null;
  agentId: string | null;
  note: string;
}

/** Letta core-memory block (047) — read-only observatory. */
export interface MemoryBlockRecord {
  id: string;
  label: string;
  value: string;
  limit: number | null;
  updated_at: string | null;
  description: string | null;
}

export interface MemoryListResult {
  agentId: string | null;
  baseUrl: string | null;
  blocks: MemoryBlockRecord[];
  apiPath: string;
  error?: string;
}

/** Result of PATCHing a Letta core-memory block via MemoryStore.updateBlock. */
export interface MemoryUpdateResult {
  agentId: string | null;
  baseUrl: string | null;
  block: MemoryBlockRecord | null;
  apiPath: string;
  error?: string;
}

export type {
  AutonomyPolicy,
  AutonomyPolicyResult,
  AutonomyActionEvaluation,
  EvaluateAutonomyActionInput,
} from '@otto-haus/core';

export interface EvaluateAutonomyActionResult {
  evaluation: import('@otto-haus/core').AutonomyActionEvaluation;
  receipt: Receipt & { path: string };
  check_results?: import('@otto-haus/core').CheckRunResult[];
}

export type {
  KnowledgeListResult,
  KnowledgeRegistrySummary,
  KnowledgeModelEntry,
  KnowledgeRoutingHint,
  CogneeHealth,
  CogneeHealthStatus,
  CogneeCaptureReceipt,
  SkillListResult,
  SkillRecord,
  ChannelListResult,
  ChannelRecord,
  TicketListResult,
  TicketRecord,
  TicketCompileInput,
  WorkerListResult,
  WorkerRecord,
  WorkerStatus,
  RunListResult,
  RunSummary,
  ApprovalListResult,
  ApprovalRecord,
} from '@otto-haus/core';

export type { PgvectorStatus } from '../pgvector-store';

export type CogneeRecallSmokeResult = {
  ok: boolean;
  query: string;
  citations: Array<{ path: string; snippet: string }>;
  error: string | null;
};

/** A loosely-typed SDK message forwarded straight to the renderer. */
export interface OttoMessageEvent {
  message: { type: string; [k: string]: unknown };
}

/** Runtime status change pushed after reconnects or failed turns. */
export interface OttoStatusEvent {
  status: RuntimeStatus;
}

export type OttoEvent = OttoMessageEvent | OttoStatusEvent;

/** Local thread index row — persisted under ~/.otto/threads/index.json (046). */
export interface ChatThreadRecord {
  id: string;
  lettaConversationId: string | null;
  agentId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  sortOrder?: number | null;
  pinned: boolean;
  archived: boolean;
}

export interface ThreadListResult {
  dir: string;
  activeThreadId: string | null;
  threads: ChatThreadRecord[];
}

export interface ThreadSwitchResult {
  thread: ChatThreadRecord;
  status: RuntimeStatus;
}

export interface TicketReviewRecord {
  verdict?: '+1' | '-1' | 'blocked';
  evidence?: string[];
  reviewed_at?: string;
  blocker?: string;
}

/** ADR 093 boundary reason ids — see `isolated-agent.ts` / docs/v1/adr/093-multi-agent-workspace-policy.md */
export type IsolationBoundaryReason =
  | 'different_owner'
  | 'different_authority'
  | 'different_secrets_tools'
  | 'different_schedule_channel'
  | 'different_mission'
  | 'strong_isolation';

export interface IsolatedAgentRecord {
  agentId: string;
  boundaryReason: IsolationBoundaryReason;
  label?: string | null;
  createdAt: string;
  configPath?: string | null;
  /** v1 blocks shared Standards canon ratify for isolated secondaries (#120). */
  standardsRatifyBlocked?: boolean;
}

export interface IsolatedAgentListResult {
  agents: IsolatedAgentRecord[];
}

export interface IsolatedAgentCreateResult {
  agent: IsolatedAgentRecord;
  receipt: { id: string; path: string };
}

/** Local-first config at ~/.otto/config.json (shared with gen-readiness.mjs). */
export type DisplayTheme = 'light' | 'dark' | 'system';

export interface OttoConfig {
  /** UI theme preference — light, dark, or follow system. */
  theme?: DisplayTheme;
  agentId?: string | null;
  conversationId?: string | null;
  /** Active local thread id from ~/.otto/threads/index.json (046). */
  activeThreadId?: string | null;
  modelHandle?: string | null;
  effort?: EffortLevel;
  /** Letta base URL for local / self-hosted backends (cloud uses the default). */
  baseUrl?: string | null;
  /** Preferred default agent when multiple are available (119). */
  primaryAgentId?: string | null;
  /** Connection UX mode — embedded vs bring-your-own vs cloud. */
  connectionMode?: 'embedded' | 'existing' | 'cloud';
  /** Sidebar default for threads without manual sortOrder (164). */
  conversationSortMode?: ConversationSortMode;
  /** Chat composer keyboard send shortcut (#48). Default tab when unset. */
  composerSendShortcut?: ComposerSendShortcut;
  /** Legacy / generated readiness shape; modelHandle is the v1 desktop control. */
  model?: { provider?: string; model?: string };
  mcpServers?: unknown[];
  functions?: unknown[];
  runtime?: { connected?: boolean };
  /** Local Cognee sidecar (041) — env vars still override when set. */
  cognee?: {
    enabled?: boolean;
    baseUrl?: string | null;
  };
  /** Labs gate — master off by default; per-feature opt-in (137). */
  labs?: LabsConfig;
  /** Sleep-time reflection ("dreaming") trigger — synced to Letta settings for the active agent. */
  dreaming?: DreamSettings;
  /** Secondary agents created via Settings → Advanced (#120). Chat stays on primaryAgentId. */
  isolatedAgents?: IsolatedAgentRecord[];
}

/** Letta sleep-time reflection trigger (mirrors letta-code SleeptimeSelector). */
export type DreamTrigger = 'off' | 'step-count' | 'compaction-event';

export interface DreamSettings {
  trigger: DreamTrigger;
  stepCount: number;
}

/** Lab feature ids — must match docs/v1/ship-tier-matrix.md */
export type LabFeatureId =
  | 'knowledge_cognee'
  | 'pgvector_recall'
  | 'channels_outbound'
  | 'memory_observatory'
  | 'worker_autonomous_loop'
  | 'practice_mining'
  | 'culture_export'
  | 'remote_letta_cloud'
  | 'turn_phase_timeline'
  | 'voice_realtime'
  | 'image_gen';

export type LabsConfig = {
  /** Master Labs switch — default false on fresh profile. */
  enabled?: boolean;
  features?: Partial<Record<LabFeatureId, boolean>>;
};

export type CogneeSettings = {
  enabled: boolean;
  baseUrl: string;
};

/** Single health probe — machine + human readable. */
export type HealthCheckStatus = 'ok' | 'warn' | 'fail' | 'unknown' | 'skip';

export interface HealthCheck {
  id: string;
  label: string;
  status: HealthCheckStatus;
  summary: string;
  impact?: string;
  nextAction?: string;
  data?: Record<string, unknown>;
}

/** Aggregated live/offline health for agents, CI, and Settings UI. */
export interface SystemHealthReport {
  ok: boolean;
  checkedAt: string;
  scope: 'live' | 'offline';
  build: AppBuildInfo;
  checks: HealthCheck[];
}

/** Paperclip intake (074) — display-only work_state; never otto Done. */
export type PaperclipConnectionState = 'not_connected' | 'connected' | 'sync_error';

export interface PaperclipTaskRow {
  id: string;
  title: string;
  status: string;
  url: string;
  blocked?: boolean;
}

export interface PaperclipArtifactRow {
  id: string;
  label: string;
  url: string;
}

export interface PaperclipIntakeSnapshot {
  dir: string;
  connection: PaperclipConnectionState;
  enabled: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  sourceBaseUrl: string | null;
  activeTasks: PaperclipTaskRow[];
  blockedTasks: PaperclipTaskRow[];
  recentArtifacts: PaperclipArtifactRow[];
}

export interface PaperclipConnectResult {
  ok: boolean;
  needsApproval?: boolean;
  message?: string;
  snapshot: PaperclipIntakeSnapshot;
  receipt: Receipt & { path: string };
}

export interface PaperclipSyncResult {
  ok: boolean;
  error?: string;
  snapshot: PaperclipIntakeSnapshot;
  receipt?: Receipt & { path: string };
}


/** Active project / workspace paths and session context (#316). */
export type WorkspaceContext = {
  projectRoot: string;
  ottoHome: string;
  profileHome: string;
  lettaStateDir: string;
  activeThread: {
    id: string;
    title: string;
    conversationId: string | null;
    agentId: string | null;
  } | null;
  runtime: {
    ready: boolean;
    agentId: string | null;
    conversationId: string | null;
    transportMode: RuntimeTransportMode | null;
    effectiveTransport: EffectiveTransport | null;
    model: string | null;
  } | null;
  projectSwitch: {
    allowed: boolean;
    reason: string;
  };
};

export type PermissionDecisionKind = 'allow-once' | 'allow-session' | 'deny' | 'timeout';

export type PermissionLogEntry = {
  id: string;
  at: string;
  requestId: string;
  toolName: string;
  status: 'pending' | PermissionDecisionKind;
  message?: string;
  receiptId?: string;
  risk: 'low' | 'medium' | 'high';
};

/** Permission route/mode + session allowlist + recent decisions (#316). */
export type PermissionState = {
  mode: 'default';
  route: string;
  sessionAllowed: string[];
  recent: PermissionLogEntry[];
};

export interface ShutdownStatus {
  dirtyShutdown: boolean;
  lastCleanShutdownAt: string | null;
}

export interface SafeResetResult {
  ok: true;
  clearedQueueKeys: string[];
  reconnected: boolean;
  reason: string;
}
