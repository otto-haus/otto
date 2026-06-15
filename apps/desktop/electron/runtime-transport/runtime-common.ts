import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BrowserWindow } from 'electron';
import type { EffortLevel, OttoConfig, RuntimeStatus, StatusCode } from '../shared/types';

export function smokeMode(): boolean {
  return process.env.OTTO_SMOKE === '1' || process.env.OTTO_SMOKE === 'true';
}

export const SMOKE_MODE = smokeMode();
export const WANT_MEMFS = process.env.OTTO_MEMFS === '1' || process.env.OTTO_MEMFS === 'true';

const LETTA_DESKTOP_CLI = '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';

export type ConnectionMode = NonNullable<OttoConfig['connectionMode']>;

export type CliResolution = {
  cliPath: string;
  cliResolved: boolean;
  /** Set when embedded mode could not resolve bundled CLI, or existing mode fell back from Letta.app. */
  cliFallbackReason?: string;
};

function bundledCliCandidates(): string[] {
  const candidates: string[] = [];
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  if (resourcesPath) {
    candidates.push(join(resourcesPath, 'app', 'node_modules', '@letta-ai', 'letta-code', 'letta.js'));
    candidates.push(join(resourcesPath, 'app.asar.unpacked', 'node_modules', '@letta-ai', 'letta-code', 'letta.js'));
  }
  candidates.push(join(process.cwd(), 'node_modules', '@letta-ai', 'letta-code', 'letta.js'));
  candidates.push(join(process.cwd(), 'apps', 'desktop', 'node_modules', '@letta-ai', 'letta-code', 'letta.js'));
  try {
    const req = createRequire(__filename);
    candidates.push(req.resolve('@letta-ai/letta-code/letta.js'));
  } catch {
    // package not installed on this machine
  }
  return candidates;
}

function firstExisting(paths: string[]): string | null {
  for (const path of paths) {
    if (existsSync(path)) return path;
  }
  return null;
}

/**
 * Resolve Letta Code CLI path honoring Settings connection mode (076).
 * - embedded: bundled app resources / node_modules only (never prefers Letta.app)
 * - existing | cloud: Letta Desktop CLI first, then bundled with explicit fallback reason
 * LETTA_CLI_PATH always wins when set.
 */
export function resolveCli(connectionMode: ConnectionMode = 'embedded'): CliResolution {
  const explicit = process.env.LETTA_CLI_PATH?.trim();
  if (explicit) return { cliPath: explicit, cliResolved: true };

  const bundled = firstExisting(bundledCliCandidates());

  if (connectionMode === 'embedded') {
    if (bundled) return { cliPath: bundled, cliResolved: true };
    return {
      cliPath: '(bundled @letta-ai/letta-code — not found)',
      cliResolved: false,
      cliFallbackReason:
        'Embedded mode: bundled letta.js not found under app resources or node_modules. Rebuild otto.app or set LETTA_CLI_PATH.',
    };
  }

  if (existsSync(LETTA_DESKTOP_CLI)) {
    return { cliPath: LETTA_DESKTOP_CLI, cliResolved: true };
  }

  if (bundled) {
    return {
      cliPath: bundled,
      cliResolved: true,
      cliFallbackReason:
        connectionMode === 'existing'
          ? 'Existing mode: Letta Desktop CLI not at /Applications/Letta.app — using bundled letta.js from otto dependencies.'
          : 'Cloud mode: using bundled letta.js locally; remote URL comes from Settings/env.',
    };
  }

  return {
    cliPath: '(letta.js not resolved)',
    cliResolved: false,
    cliFallbackReason:
      connectionMode === 'existing'
        ? 'Existing mode: install Letta Desktop, rebuild otto with @letta-ai/letta-code, or set LETTA_CLI_PATH.'
        : 'Cloud mode: set LETTA_BASE_URL and LETTA_CLI_PATH, or install Letta Desktop for local CLI.',
  };
}

export function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Skip IPC when the BrowserWindow or webContents is destroyed (058). */
export function safeWebContentsSend(
  win: BrowserWindow | null | undefined,
  channel: string,
  payload: unknown,
): boolean {
  if (!win) return false;
  if (typeof win.isDestroyed === 'function' && win.isDestroyed()) return false;
  const wc = win.webContents;
  if (!wc) return false;
  if (typeof wc.isDestroyed === 'function' && wc.isDestroyed()) return false;
  try {
    wc.send(channel, payload);
    return true;
  } catch {
    return false;
  }
}

export const isNotFound = (e: unknown) => {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return m.includes('not found') || m.includes('not-found') || m.includes('agent-not-found');
};

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

export function friendly(code: StatusCode, reason: string): string {
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
      return `Letta auth failed. For local v1, configure provider auth inside Letta; otto does not need its own API key. (${reason})`;
    case 'unreachable':
      return `Can't reach the Letta backend — check the base URL in Settings. (${reason})`;
    case 'no-agent':
      return `Can't find a default local Letta agent — open Letta once or choose an Agent ID override in Settings. (${reason})`;
    case 'stale':
      return `Saved Letta agent or conversation was stale — choose a valid Agent ID override in Settings or clear the override. (${reason})`;
    default:
      return reason;
  }
}

export function nextActionFor(code: StatusCode): string {
  switch (code) {
    case 'no-api-key':
      return 'Configure provider auth inside Letta for local v1.';
    case 'unreachable':
      return 'Check the local Letta runtime and URL override in Settings.';
    case 'no-agent':
      return 'Open Letta once or choose an Agent ID override in Settings.';
    case 'stale':
      return 'Clear the stale override or choose a valid Agent ID in Settings.';
    case 'sdk-missing':
      return 'Install or repair the Letta Code SDK dependency.';
    default:
      return 'Review the trace and retry after fixing the runtime error.';
  }
}

export function isInvalidModelError(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return m.includes('invalid model');
}

export type ModelInitAttempt = {
  effort: EffortLevel;
  cliModel: string;
  /** When set, persist this handle after a successful connect (alternate provider path). */
  modelHandle?: string | null;
};

const EFFORT_FALLBACK_ORDER: EffortLevel[] = ['max', 'high', 'medium', 'low', 'off'];
const ALTERNATE_EFFORT_CEILING = new Set<EffortLevel>(['medium', 'low', 'off']);

/** Ordered model/effort attempts when the user's preset is rejected by their Letta build. */
export function modelInitAttempts(modelHandle: string | null, effort: EffortLevel): ModelInitAttempt[] {
  if (!modelHandle) return [];

  const attempts: ModelInitAttempt[] = [];
  const seenCli = new Set<string>();

  const push = (attempt: ModelInitAttempt) => {
    if (!attempt.cliModel || seenCli.has(attempt.cliModel)) return;
    seenCli.add(attempt.cliModel);
    attempts.push(attempt);
  };

  for (const e of fallbackEffortsFrom(effort)) {
    push({ effort: e, cliModel: modelSelectionForCli(modelHandle, e), modelHandle });
  }

  // Some Letta builds accept the provider handle but not named presets.
  push({ effort, cliModel: modelHandle, modelHandle });

  const alternates: Record<string, string[]> = {
    'chatgpt-plus-pro/gpt-5.5': ['openai-codex/gpt-5.5', 'anthropic/claude-sonnet-4-6'],
  };
  for (const alt of alternates[modelHandle] ?? []) {
    const alternateEfforts = alternateFallbackEffortsFrom(effort);
    for (const e of alternateEfforts) {
      push({ effort: e, cliModel: modelSelectionForCli(alt, e), modelHandle: alt });
    }
    push({ effort: alternateEfforts[0] ?? 'off', cliModel: alt, modelHandle: alt });
  }

  return attempts;
}

function fallbackEffortsFrom(effort: EffortLevel): EffortLevel[] {
  const start = EFFORT_FALLBACK_ORDER.indexOf(effort);
  return EFFORT_FALLBACK_ORDER.slice(start >= 0 ? start : 0);
}

function alternateFallbackEffortsFrom(effort: EffortLevel): EffortLevel[] {
  return fallbackEffortsFrom(effort).filter((candidate) => ALTERNATE_EFFORT_CEILING.has(candidate));
}

export function modelSelectionForCli(modelHandle: string, effort: string): string {
  const effortKey = effort === 'max' ? 'xhigh' : effort;
  const presets: Record<string, Partial<Record<string, string>>> = {
    'chatgpt-plus-pro/gpt-5.5': {
      off: 'gpt-5.5-plus-pro-none',
      low: 'gpt-5.5-plus-pro-low',
      medium: 'gpt-5.5-plus-pro-medium',
      high: 'gpt-5.5-plus-pro-high',
      // Not every Letta CLI build registers a distinct xhigh preset — fall back to high.
      xhigh: 'gpt-5.5-plus-pro-high',
    },
    'anthropic/claude-opus-4-8': {
      low: 'opus-4.8-low',
      medium: 'opus-4.8-medium',
      high: 'opus-4.8-high',
      xhigh: 'opus-4.8-max',
    },
    'anthropic/claude-sonnet-4-6': {
      off: 'sonnet-4.6-no-reasoning',
      low: 'sonnet-4.6-low',
      medium: 'sonnet-4.6-medium',
      high: 'sonnet',
      xhigh: 'sonnet-4.6-xhigh',
    },
  };

  const table = presets[modelHandle];
  if (!table) return modelHandle;
  return table[effortKey] ?? table.high ?? table.medium ?? table.off ?? modelHandle;
}

type PromptRuntimeContext = Partial<Pick<
  RuntimeStatus,
  'model' | 'modelHandle' | 'effort' | 'transportMode' | 'effectiveTransport' | 'sessionMode'
>>;

export function runtimeContextForPrompt(status: PromptRuntimeContext): string {
  const selectedModel = status.modelHandle ?? status.model ?? 'agent-default';
  const effort = status.effort ?? 'unknown';
  const mode = status.transportMode ?? status.effectiveTransport ?? status.sessionMode ?? 'unknown';
  return [
    '<otto_runtime_context>',
    'Use this context only when it is relevant or when the user asks about model, effort, provider path, or runtime setup.',
    `selected_model_handle: ${selectedModel}`,
    `reasoning_effort: ${effort}`,
    `transport_mode: ${mode}`,
    'provider_path: local Letta runtime owns provider auth/subscription; otto does not call OpenAI or Anthropic provider APIs directly.',
    '</otto_runtime_context>',
  ].join('\n');
}

export function promptWithRuntimeContext(
  text: string,
  status: PromptRuntimeContext,
): string {
  return `${runtimeContextForPrompt(status)}\n\n${text}`;
}
