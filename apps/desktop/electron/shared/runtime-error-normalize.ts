import type { StatusCode } from './types';
import type { ConnectionMode } from './runtime-status-ui';

export function isUsageLimitReason(reason: string): boolean {
  const r = reason.toLowerCase();
  return (
    r.includes('429') ||
    r.includes('usage_limit') ||
    r.includes('usage limit') ||
    r.includes('rate_limit') ||
    r.includes('rate limit') ||
    r.includes('quota') ||
    r.includes('too many requests') ||
    r.includes('overloaded') ||
    r.includes('insufficient_quota')
  );
}

function usageLimitProviderLabel(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes('codex')) return 'Codex';
  return 'Provider';
}

/** Best-effort reset hint from provider JSON or retry metadata (seconds → minutes). */
export function parseUsageLimitResetHint(reason: string): string | null {
  const secondsFromValue = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
    return null;
  };

  const scanObject = (obj: unknown, depth = 0): number | null => {
    if (!obj || depth > 6) return null;
    if (typeof obj !== 'object') return null;
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const k = key.toLowerCase();
      if (
        k.includes('resets_in') ||
        k.includes('reset_in') ||
        k.includes('retry_after') ||
        k.includes('retry_in') ||
        k.includes('cooldown')
      ) {
        const parsed = secondsFromValue(value);
        if (parsed != null) return parsed;
      }
      if (value && typeof value === 'object') {
        const nested = scanObject(value, depth + 1);
        if (nested != null) return nested;
      }
    }
    return null;
  };

  let seconds: number | null = scanObject(reason);
  if (seconds == null) {
    const jsonMatch = reason.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      try {
        seconds = scanObject(JSON.parse(jsonMatch[0]));
      } catch {
        // ignore malformed JSON fragments
      }
    }
  }
  if (seconds == null) {
    const inline = reason.match(/(?:resets?_in|retry_after|retry_in)[^0-9]{0,24}(\d+)/i);
    if (inline) seconds = Number(inline[1]);
  }
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `Resets in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

export function classify(reason: string, hasKey: boolean): StatusCode {
  const r = reason.toLowerCase();
  void hasKey;
  if (r.includes('letta_api_key') || r.includes('api key') || r.includes('unauthorized') || r.includes('401'))
    return 'no-api-key';
  if (
    r.includes('no agent') ||
    r.includes('agent candidate') ||
    r.includes('agent selector') ||
    r.includes('agent-not-found') ||
    r.includes('profile')
  )
    return 'no-agent';
  if (r.includes('not found') || r.includes('not-found')) return 'stale';
  if (isUsageLimitReason(reason)) return 'usage-limit';
  if (
    r.includes('econnrefused') ||
    r.includes('enotfound') ||
    r.includes('fetch failed') ||
    r.includes('network') ||
    r.includes('socket') ||
    r.includes('timed out')
  )
    return 'unreachable';
  return 'error';
}

export function parseUsageLimitError(reason: string): { message: string; resetHint?: string } | null {
  const lower = reason.toLowerCase();
  if (!lower.includes('usage_limit_reached') && !lower.includes('usage limit reached') && !lower.includes('status_code:429')) {
    return null;
  }
  const resetMatch = reason.match(/resets?\s+(?:at|in)\s+([0-9T:+-Z]+)/i)
    ?? reason.match(/resets?\s+in\s+about\s+(\d+)\s+minutes?/i)
    ?? reason.match(/resets?\s+in\s+(\d+)\s+minutes?/i);
  let resetHint: string | undefined;
  if (resetMatch?.[1]) {
    resetHint = resetMatch[0].toLowerCase().includes('minute')
      ? `Resets in about ${resetMatch[1]} minutes.`
      : `Resets at ${resetMatch[1]}.`;
  }
  return {
    message: 'Provider usage limit reached. Try Auto/Fast, switch provider/model, or wait for the reset.',
    resetHint,
  };
}

export type FriendlyOptions = { connectionMode?: ConnectionMode; lettaSettingsPath?: string };

/** User-facing runtime error copy — shared by main process transports and renderer init catch (#586). */
export function friendlyMessage(code: StatusCode, reason: string, opts?: FriendlyOptions): string {
  if (code === 'error') {
    const usageLimit = parseUsageLimitError(reason);
    if (usageLimit) {
      return usageLimit.resetHint ? `${usageLimit.message} ${usageLimit.resetHint}` : usageLimit.message;
    }
  }
  const lower = reason.toLowerCase();
  if (lower.includes('invalid model')) {
    const match = reason.match(/Invalid model '([^']+)'/i);
    const preset = match?.[1];
    return preset
      ? `Model preset "${preset}" isn't available in your Letta build. Choose another model or lower reasoning effort.`
      : "Model preset isn't available in your Letta build. Choose another model or lower reasoning effort.";
  }
  switch (code) {
    case 'no-api-key':
      if (opts?.connectionMode === 'embedded') {
        const embeddedLower = reason.toLowerCase();
        if (embeddedLower.includes('missing letta_api_key') || embeddedLower.includes('letta_api_key')) {
          return 'Embedded Letta still needs provider auth in ~/.otto/letta — not your dev ~/.letta install. Connect in Settings, then open the Letta web UI to sign in.';
        }
        return 'Provider auth missing in embedded Letta (~/.otto/letta). Connect in Settings, then Settings → Model providers → Open Letta web UI to add ChatGPT or an API key.';
      }
      return 'Letta auth failed. For local v1, configure provider auth inside Letta; otto does not need its own API key.';
    case 'unreachable':
      if (reason.includes('Local Letta backend is not running')) return reason;
      if (opts?.connectionMode === 'embedded') {
        if (reason.includes('timed out after')) {
          return 'Embedded Letta did not connect in time. Retry Connect, or add a provider key in Letta settings.';
        }
        return 'Embedded Letta did not start. Retry Connect, or add a provider key in Letta settings.';
      }
      if (reason.includes('timed out after')) {
        return 'Letta did not connect in time. Open Letta Desktop or switch to Embedded mode in Settings, then retry.';
      }
      return "Can't reach the Letta backend — check the base URL in Settings.";
    case 'no-agent':
      return "Can't find a default local Letta agent — open Letta once or choose an Agent ID override in Settings.";
    case 'stale':
      return 'Saved Letta agent or conversation was stale — choose a valid Agent ID override in Settings or clear the override.';
    case 'usage-limit': {
      const provider = usageLimitProviderLabel(reason);
      const reset = parseUsageLimitResetHint(reason);
      const parts = [
        `${provider} usage limit reached.`,
        reset,
        'Try Auto/Fast, switch provider/model in Settings, or wait until reset.',
      ].filter(Boolean);
      return parts.join(' ');
    }
    default:
      if (reason.includes('{') && reason.length > 180) {
        return 'Runtime error — open diagnostics or retry after fixing provider setup.';
      }
      return reason;
  }
}

export type NormalizedRuntimeError = {
  code: StatusCode;
  message: string;
  details?: string;
};

/** Map raw provider/runtime errors to user-facing copy; preserve raw payload for diagnostics. */
export function normalizeRuntimeError(
  raw: string,
  hasKey: boolean,
  opts?: FriendlyOptions,
): NormalizedRuntimeError {
  const code = classify(raw, hasKey);
  const message = friendlyMessage(code, raw, opts);
  const details = message !== raw.trim() ? raw : undefined;
  return { code, message, details };
}

export function runtimeStatusFromInitError(e: unknown, hasKey = false, opts?: FriendlyOptions) {
  const raw = e instanceof Error ? e.message : String(e);
  const normalized = normalizeRuntimeError(raw, hasKey, opts);
  return {
    ready: false as const,
    code: normalized.code,
    reason: normalized.message,
    cliPath: '',
    cliResolved: false,
  };
}
