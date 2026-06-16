import { existsSync } from 'node:fs';
import type { ConnectionMode } from './runtime-transport/runtime-common';

/** Installed Letta Desktop bundle path (advanced / existing-Letta path only). */
export const LETTA_APP_PATH = '/Applications/Letta.app';
/** Public Letta docs — opened when no Letta Desktop is installed for the existing/cloud path. */
export const LETTA_DOCS_URL = 'https://docs.letta.com';

/**
 * What `otto:open-letta` should do for the active connection mode.
 * - `reveal`        → reveal a local folder (embedded runtime home — otto-owned, no Letta.app).
 * - `open-app`      → open an installed macOS app bundle (existing Letta Desktop).
 * - `open-external` → open a URL (docs) when Letta Desktop is not installed.
 */
export type OpenLettaTarget =
  | { kind: 'reveal'; target: string; reason: string }
  | { kind: 'open-app'; target: string; reason: string }
  | { kind: 'open-external'; target: string; reason: string };

export interface PlanOpenLettaOptions {
  connectionMode: ConnectionMode;
  /** Embedded "This Mac" runtime state dir (e.g. ~/.otto/letta). */
  lettaStateDir: string;
  /** Live loopback base URL from runtime discovery — opens embedded Letta web UI for provider auth. */
  baseUrl?: string | null;
  /** Override Letta.app presence (defaults to a filesystem check) — injectable for tests. */
  lettaAppExists?: boolean;
}

function embeddedLoopbackWebUi(baseUrl: string | null | undefined): string | null {
  const trimmed = baseUrl?.trim();
  if (!trimmed || !/^https?:\/\/(127\.0\.0\.1|localhost)(:[0-9]+)?/i.test(trimmed)) return null;
  return trimmed.replace(/\/+$/, '');
}

/**
 * Decide where the "Open Letta" / "Connect" affordance should point (#607).
 *
 * Embedded ("This Mac") is otto-owned: when the bundled backend is up, open its loopback web UI
 * so provider auth (ChatGPT/API keys) lands in ~/.otto/letta — never ~/.letta or otto secrets.
 * Before the backend is live, reveal the isolated runtime home for diagnostics.
 * Existing/cloud (advanced) prefers installed Letta Desktop and falls back to docs.
 */
export function planOpenLettaTarget(opts: PlanOpenLettaOptions): OpenLettaTarget {
  if (opts.connectionMode === 'embedded') {
    const webUi = embeddedLoopbackWebUi(opts.baseUrl);
    if (webUi) {
      return {
        kind: 'open-external',
        target: webUi,
        reason:
          'Opening embedded Letta web UI — add or rotate provider auth here; otto never stores keys.',
      };
    }
    return {
      kind: 'reveal',
      target: opts.lettaStateDir,
      reason:
        'Embedded runtime not live yet — revealing ~/.otto/letta. Connect in Settings first, then Open Letta web UI for provider auth.',
    };
  }

  const lettaAppExists = opts.lettaAppExists ?? existsSync(LETTA_APP_PATH);
  if (lettaAppExists) {
    return {
      kind: 'open-app',
      target: LETTA_APP_PATH,
      reason: 'Opening installed Letta Desktop for the existing-Letta path.',
    };
  }

  return {
    kind: 'open-external',
    target: LETTA_DOCS_URL,
    reason: 'Letta Desktop is not installed — opening Letta docs.',
  };
}
