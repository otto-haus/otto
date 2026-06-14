import { existsSync } from 'node:fs';
import type { StatusCode } from '../shared/types';

export const SMOKE_MODE = process.env.OTTO_SMOKE === '1' || process.env.OTTO_SMOKE === 'true';
export const WANT_MEMFS = process.env.OTTO_MEMFS === '1' || process.env.OTTO_MEMFS === 'true';

const LETTA_DESKTOP_CLI = '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';

export function resolveCli(): { cliPath: string; cliResolved: boolean } {
  const explicit = process.env.LETTA_CLI_PATH;
  if (explicit) return { cliPath: explicit, cliResolved: true };
  if (existsSync(LETTA_DESKTOP_CLI)) return { cliPath: LETTA_DESKTOP_CLI, cliResolved: true };
  return { cliPath: '(bundled @letta-ai/letta-code)', cliResolved: false };
}

export function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
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

export function modelSelectionForCli(modelHandle: string, effort: string): string {
  const e = effort === 'max' ? 'xhigh' : effort;
  const presets: Record<string, Partial<Record<string, string>>> = {
    'chatgpt-plus-pro/gpt-5.5': {
      off: 'gpt-5.5-plus-pro-none',
      low: 'gpt-5.5-plus-pro-low',
      medium: 'gpt-5.5-plus-pro-medium',
      high: 'gpt-5.5-plus-pro-high',
      xhigh: 'gpt-5.5-plus-pro-xhigh',
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
  return presets[modelHandle]?.[e] ?? modelHandle;
}
