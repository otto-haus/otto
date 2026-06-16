import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { BrowserWindow } from 'electron';
import type { EffortLevel, OttoConfig, RuntimeStatus, StatusCode } from '../shared/types';
import {
  classify,
  friendlyMessage,
  isUsageLimitReason,
  parseUsageLimitError,
  parseUsageLimitResetHint,
  type FriendlyOptions,
  type NormalizedRuntimeError,
} from '../shared/runtime-error-normalize';

export {
  classify,
  isUsageLimitReason,
  parseUsageLimitError,
  parseUsageLimitResetHint,
  type FriendlyOptions,
  type NormalizedRuntimeError,
};

export function smokeMode(): boolean {
  return process.env.OTTO_SMOKE === '1' || process.env.OTTO_SMOKE === 'true';
}

export const SMOKE_MODE = smokeMode();
export const WANT_MEMFS = process.env.OTTO_MEMFS === '1' || process.env.OTTO_MEMFS === 'true';

/** Matches WS connect timeout — bounds SDK session.initialize() so IPC cannot hang forever. */
export const DEFAULT_SESSION_INIT_TIMEOUT_MS = 45_000;

export function sessionInitTimeoutMs(): number {
  const raw = process.env.OTTO_SESSION_INIT_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_INIT_TIMEOUT_MS;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const LETTA_DESKTOP_CLI =
  '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';

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


function tildePath(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

/** Rewrite host ~/.letta paths in Letta CLI stderr for embedded mode (#605). */
export function rewriteEmbeddedLettaPaths(reason: string, opts?: FriendlyOptions): string {
  if (opts?.connectionMode !== 'embedded') return reason;
  const embedded = tildePath(opts.lettaSettingsPath ?? join(homedir(), '.otto', 'letta', 'settings.json'));
  const host = join(homedir(), '.letta', 'settings.json');
  return reason.replaceAll('~/.letta/settings.json', embedded).replaceAll(host, embedded);
}

export function friendly(code: StatusCode, reason: string, opts?: FriendlyOptions): string {
  return friendlyMessage(code, rewriteEmbeddedLettaPaths(reason, opts), opts);
}

/** Map raw provider/runtime errors to user-facing copy; preserve raw payload for diagnostics. */
export function normalizeRuntimeError(
  raw: string,
  hasKey: boolean,
  opts?: FriendlyOptions,
): NormalizedRuntimeError {
  const code = classify(raw, hasKey);
  const message = friendly(code, raw, opts);
  const details = message !== raw.trim() ? raw : undefined;
  return { code, message, details };
}

export type { NextActionOptions } from '../shared/runtime-status-ui';
export { nextActionFor } from '../shared/runtime-status-ui';

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

import type { MessageContentItem } from '@letta-ai/letta-code-sdk';

/** Prepend runtime context to multimodal user content for Letta transports. */
export function promptContentWithRuntimeContext(
  content: MessageContentItem[],
  status: PromptRuntimeContext,
): MessageContentItem[] {
  return [{ type: 'text', text: runtimeContextForPrompt(status) }, ...content];
}
