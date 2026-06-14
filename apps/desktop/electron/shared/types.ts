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
} from '@otto-haus/core';

export type { CharterStatus };

export type PermissionResponse =
  | { behavior: 'allow'; updatedInput?: Record<string, unknown> | null }
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
  | 'error';

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
  cliPath: string;
  cliResolved: boolean;
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
}

export type { RoutineRecord, RoutineReference, CurationProposalRecord, CreateProposalFromCorrectionInput, DecideProposalInput };

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
}

/** A loosely-typed SDK message forwarded straight to the renderer. */
export interface OttoMessageEvent {
  message: { type: string; [k: string]: unknown };
}

/** Runtime status change pushed after reconnects or failed turns. */
export interface OttoStatusEvent {
  status: RuntimeStatus;
}

export type OttoEvent = OttoMessageEvent | OttoStatusEvent;

/** Local-first config at ~/.otto/config.json (shared with gen-readiness.mjs). */
export interface OttoConfig {
  agentId?: string | null;
  conversationId?: string | null;
  modelHandle?: string | null;
  effort?: EffortLevel;
  /** Letta base URL for local / self-hosted backends (cloud uses the default). */
  baseUrl?: string | null;
  /** Legacy / generated readiness shape; modelHandle is the v1 desktop control. */
  model?: { provider?: string; model?: string };
  mcpServers?: unknown[];
  functions?: unknown[];
  runtime?: { connected?: boolean };
}
