// Shared types across the Electron main process and the renderer (type-only, erased at runtime).

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
  memfsEnabled?: boolean;
  tools?: string[];
  cliPath: string;
  cliResolved: boolean;
}

/** What the Settings "Connect Letta" card reads (never includes the API key value). */
export interface ConnectionInfo {
  baseUrl: string | null;
  agentId: string | null;
  hasApiKey: boolean;
}

/** What the card sends on save. apiKey is present only when the user enters/changes it. */
export interface ConnectionInput {
  baseUrl?: string | null;
  agentId?: string | null;
  apiKey?: string | null;
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
  /** Letta base URL for local / self-hosted backends (cloud uses the default). */
  baseUrl?: string | null;
  model?: { provider?: string; model?: string };
  mcpServers?: unknown[];
  functions?: unknown[];
  runtime?: { connected?: boolean };
}
