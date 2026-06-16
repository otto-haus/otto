import type { StatusCode } from './types';

export type ConnectionMode = 'embedded' | 'existing' | 'cloud';

export type NextActionOptions = { connectionMode?: ConnectionMode };

/** Ink-block title when runtime is not ready (#585). */
export function runtimeSetupTitle(code: StatusCode | undefined): string {
  switch (code) {
    case 'no-agent':
      return 'Set up a local Letta agent';
    case 'no-api-key':
      return 'Provider auth needed in Letta';
    case 'unreachable':
      return "Can't reach Letta";
    case 'stale':
      return 'Saved session is stale';
    case 'sdk-missing':
      return 'Letta SDK not found';
    case 'usage-limit':
      return 'Provider usage limit reached';
    case 'error':
    default:
      return "otto can't connect yet";
  }
}

/** Product next-step hint — shared with main-process receipts (#585). */
export function nextActionFor(code: StatusCode, opts?: NextActionOptions): string {
  switch (code) {
    case 'no-api-key':
      if (opts?.connectionMode === 'embedded') {
        return 'Settings → General → Connect, then Settings → Model providers → Open Letta web UI to add provider auth in Letta.';
      }
      return 'Configure provider auth inside Letta for local v1.';
    case 'unreachable':
      if (opts?.connectionMode === 'embedded') {
        return 'Retry Connect in Settings. If it keeps failing, add a provider key in Letta settings.';
      }
      return 'Check the local Letta runtime and URL override in Settings.';
    case 'no-agent':
      return 'Open Letta once or choose an Agent ID override in Settings.';
    case 'stale':
      return 'Clear the stale override or choose a valid Agent ID in Settings.';
    case 'sdk-missing':
      return 'Install or repair the Letta Code SDK dependency.';
    case 'usage-limit':
      return 'Switch to Auto/Fast, pick another provider/model in Settings, or wait for the limit to reset.';
    default:
      return 'Review the trace and retry after fixing the runtime error.';
  }
}

export type RuntimeSetupBodyFallbacks = {
  noAgentBody: string;
  defaultBody: string;
};

/** Body copy for Chat setup ink block — prefers friendly runtime reason (#583, #585). */
export function runtimeSetupBody(
  code: StatusCode | undefined,
  reason: string | undefined,
  fallbacks: RuntimeSetupBodyFallbacks,
): string {
  if (code === 'no-agent') return fallbacks.noAgentBody;
  const trimmed = reason?.trim();
  if (trimmed) return trimmed;
  return fallbacks.defaultBody;
}
