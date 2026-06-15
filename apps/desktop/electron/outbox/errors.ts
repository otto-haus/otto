/**
 * Pure, testable mapping from runtime status / thrown send errors to a durable disposition.
 *
 * Honesty rule (#754): failed means failed with an honest reason; blocked means the runtime can't
 * accept the turn right now (unavailable / usage limit) and the row should survive for retry after
 * the operator changes something (model, key, runtime). Never silent loss.
 */
export type RuntimeStatusLike = { ready: boolean; code?: string | null; reason?: string | null };
export type Disposition = { kind: 'blocked' | 'failed'; errorCode: string; errorMessage?: string };

/** Why a not-ready runtime can't accept this turn → always `blocked` (retryable after change). */
export function classifyUnavailable(status: RuntimeStatusLike): Disposition {
  const reason = status.reason ?? undefined;
  switch (status.code) {
    case 'usage-limit':
      return { kind: 'blocked', errorCode: 'usage_limit', errorMessage: reason };
    case 'no-agent':
      return { kind: 'blocked', errorCode: 'no_agent', errorMessage: reason };
    case 'no-api-key':
      return { kind: 'blocked', errorCode: 'no_api_key', errorMessage: reason };
    case 'stale':
      return { kind: 'blocked', errorCode: 'stale', errorMessage: reason };
    case 'unreachable':
    case 'sdk-missing':
      return { kind: 'blocked', errorCode: 'runtime_unavailable', errorMessage: reason };
    default:
      return { kind: 'blocked', errorCode: 'runtime_unavailable', errorMessage: reason };
  }
}

/** Classify an error thrown while sending. */
export function classifySendError(err: unknown): Disposition {
  const message = err instanceof Error ? err.message : String(err);
  const m = message.toLowerCase();

  if (/usage|quota|rate.?limit|limit reached|too many requests|\b429\b/.test(m)) {
    // Usage/model limit: failed with an exact code so the UI can offer "change model" → retry.
    return { kind: 'failed', errorCode: 'usage_limit', errorMessage: message };
  }
  if (/invalid model|unsupported model|model not found|unknown model/.test(m)) {
    return { kind: 'failed', errorCode: 'model_error', errorMessage: message };
  }
  if (/unreachable|econnrefused|enotfound|socket hang|network|disconnect|timed? ?out|etimedout/.test(m)) {
    // Transient runtime/network loss → blocked (survives for retry), not a hard failure.
    return { kind: 'blocked', errorCode: 'runtime_unavailable', errorMessage: message };
  }
  if (/abort|cancell?ed/.test(m)) {
    return { kind: 'failed', errorCode: 'aborted', errorMessage: message };
  }
  return { kind: 'failed', errorCode: 'send_failed', errorMessage: message };
}
