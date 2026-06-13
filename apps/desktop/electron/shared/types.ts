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

/** The single source of truth for whether chat may be enabled. */
export interface RuntimeStatus {
  ready: boolean;
  /** Human diagnosis when not ready (shown cleanly, never as a raw stack). */
  reason?: string;
  agentId?: string | null;
  conversationId?: string | null;
  model?: string;
  memfsEnabled?: boolean;
  tools?: string[];
  cliPath: string;
  cliResolved: boolean;
}

/** A loosely-typed SDK message forwarded straight to the renderer. */
export interface OttoEvent {
  message: { type: string; [k: string]: unknown };
}

/** Local-first config at ~/.otto/config.json (shared with gen-readiness.mjs). */
export interface OttoConfig {
  agentId?: string | null;
  conversationId?: string | null;
  model?: { provider?: string; model?: string };
  mcpServers?: unknown[];
  functions?: unknown[];
  runtime?: { connected?: boolean };
}
