import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { BrowserWindow } from 'electron';
import { classify, friendly, isInvalidModelError, modelInitAttempts, modelSelectionForCli, nextActionFor, normalizeRuntimeError, parseUsageLimitResetHint, promptWithRuntimeContext, resolveCli, runtimeContextForPrompt, safeWebContentsSend } from './runtime-common';

describe('resolveCli connectionMode', () => {
  test('embedded prefers bundled resources path', () => {
    const dir = join(tmpdir(), `otto-cli-${Date.now()}`);
    const lettaDir = join(dir, 'app', 'node_modules', '@letta-ai', 'letta-code');
    mkdirSync(lettaDir, { recursive: true });
    const bundled = join(lettaDir, 'letta.js');
    writeFileSync(bundled, '// smoke stub');
    const prevResources = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
    const prevCli = process.env.LETTA_CLI_PATH;
    delete process.env.LETTA_CLI_PATH;
    (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath = dir;
    try {
      const embedded = resolveCli('embedded');
      expect(embedded.cliResolved).toBe(true);
      expect(embedded.cliPath).toBe(bundled);
      expect(embedded.cliFallbackReason).toBeUndefined();
    } finally {
      (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath = prevResources;
      if (prevCli === undefined) delete process.env.LETTA_CLI_PATH;
      else process.env.LETTA_CLI_PATH = prevCli;
    }
  });
});

describe('modelSelectionForCli', () => {
  test('maps max ChatGPT effort to high preset when xhigh is unavailable', () => {
    expect(modelSelectionForCli('chatgpt-plus-pro/gpt-5.5', 'max')).toBe('gpt-5.5-plus-pro-high');
    expect(modelSelectionForCli('chatgpt-plus-pro/gpt-5.5', 'high')).toBe('gpt-5.5-plus-pro-high');
  });

  test('passes through unknown handles', () => {
    expect(modelSelectionForCli('openai-codex/gpt-5.5', 'max')).toBe('openai-codex/gpt-5.5');
  });
});

describe('modelInitAttempts', () => {
  test('steps down effort presets before trying direct handle and alternates', () => {
    const attempts = modelInitAttempts('chatgpt-plus-pro/gpt-5.5', 'high');
    expect(attempts[0]?.cliModel).toBe('gpt-5.5-plus-pro-high');
    expect(attempts.map((a) => a.cliModel)).toContain('gpt-5.5-plus-pro-medium');
    expect(attempts.map((a) => a.cliModel)).toContain('chatgpt-plus-pro/gpt-5.5');
    expect(attempts.some((a) => a.modelHandle === 'openai-codex/gpt-5.5')).toBe(true);
  });

  test('never retries above the selected effort', () => {
    const lowAttempts = modelInitAttempts('chatgpt-plus-pro/gpt-5.5', 'low');
    expect(lowAttempts.every((a) => a.effort === 'low' || a.effort === 'off')).toBe(true);
    expect(lowAttempts.map((a) => a.cliModel)).not.toContain('gpt-5.5-plus-pro-medium');
    expect(lowAttempts.map((a) => a.cliModel)).not.toContain('gpt-5.5-plus-pro-high');

    const offAttempts = modelInitAttempts('chatgpt-plus-pro/gpt-5.5', 'off');
    expect(offAttempts.every((a) => a.effort === 'off')).toBe(true);
    expect(offAttempts.map((a) => a.cliModel)).not.toContain('gpt-5.5-plus-pro-low');
    expect(offAttempts.map((a) => a.cliModel)).not.toContain('gpt-5.5-plus-pro-medium');
    expect(offAttempts.map((a) => a.cliModel)).not.toContain('gpt-5.5-plus-pro-high');
  });
});

describe('isInvalidModelError', () => {
  test('detects invalid model failures', () => {
    expect(isInvalidModelError(new Error("Invalid model 'gpt-5.5-plus-pro-high'"))).toBe(true);
    expect(isInvalidModelError(new Error('ECONNREFUSED'))).toBe(false);
  });
});

describe('runtime prompt context', () => {
  test('names selected model, effort, and provider boundary', () => {
    const context = runtimeContextForPrompt({
      modelHandle: 'anthropic/claude-opus-4-8',
      effort: 'max',
      transportMode: 'ws',
    });
    expect(context).toContain('selected_model_handle: anthropic/claude-opus-4-8');
    expect(context).toContain('reasoning_effort: max');
    expect(context).toContain('transport_mode: ws');
    expect(context).toContain('otto does not call OpenAI or Anthropic provider APIs directly');
  });

  test('wraps the user text without replacing it', () => {
    const prompt = promptWithRuntimeContext('What model are you?', { modelHandle: 'openai/gpt-5.5', effort: 'high' });
    expect(prompt).toContain('selected_model_handle: openai/gpt-5.5');
    expect(prompt.endsWith('What model are you?')).toBe(true);
  });
});

describe('friendly invalid model', () => {
  test('shortens invalid model errors', () => {
    expect(friendly('error', "Invalid model 'gpt-5.5-plus-pro-xhigh'")).toMatch(/isn't available/i);
  });

  test('shortens provider usage limit json errors', () => {
    const raw = 'Codex error: {"type":"error","error":{"type":"usage_limit_reached","message":"limit"},"status_code":429}';
    expect(friendly('error', raw)).toMatch(/usage limit reached/i);
    expect(friendly('error', raw)).not.toContain('status_code');
  });
});

describe('runtime-common status mapping', () => {
  test('classify maps connection failures to StatusCode', () => {
    expect(classify('ECONNREFUSED localhost:8283', false)).toBe('unreachable');
    expect(classify('agent-not-found for profile', false)).toBe('no-agent');
    expect(classify('401 unauthorized letta_api_key', false)).toBe('no-api-key');
    expect(classify('conversation not-found', false)).toBe('stale');
    expect(classify('something else broke', false)).toBe('error');
  });

  test('classify maps provider usage-limit errors', () => {
    const raw =
      'Codex error: {"type":"error","error":{"type":"usage_limit_reached","message":"limit hit"},"status_code":429,"resets_in":4140}';
    expect(classify(raw, false)).toBe('usage-limit');
  });

  test('friendly usage-limit hides raw JSON and includes reset hint', () => {
    const raw =
      'Codex error: {"type":"error","error":{"type":"usage_limit_reached"},"status_code":429,"resets_in":4140}';
    const message = friendly('usage-limit', raw);
    expect(message).toMatch(/Codex usage limit reached/i);
    expect(message).toMatch(/Resets in about 69 minutes/i);
    expect(message).toMatch(/switch provider\/model/i);
    expect(message).not.toMatch(/status_code/);
  });

  test('normalizeRuntimeError preserves raw payload as details', () => {
    const raw =
      'Codex error: {"type":"error","error":{"type":"usage_limit_reached"},"status_code":429,"resets_in":120}';
    const normalized = normalizeRuntimeError(raw, false);
    expect(normalized.code).toBe('usage-limit');
    expect(normalized.message).toMatch(/Codex usage limit reached/i);
    expect(normalized.details).toBe(raw);
  });

  test('parseUsageLimitResetHint reads nested retry metadata', () => {
    expect(parseUsageLimitResetHint('{"error":{"resets_in":180}}')).toBe('Resets in about 3 minutes.');
  });

  test('friendly and nextActionFor align with StatusCode', () => {
    expect(friendly('unreachable', 'ECONNREFUSED')).toMatch(/Can't reach the Letta backend/i);
    expect(nextActionFor('no-agent')).toMatch(/Agent ID/i);
    expect(nextActionFor('stale')).toMatch(/stale override/i);
    expect(nextActionFor('usage-limit')).toMatch(/Switch to Auto\/Fast/i);
  });
});

describe('safeWebContentsSend', () => {
  test('returns false when window is destroyed or missing', () => {
    expect(safeWebContentsSend(undefined, 'otto:event', {})).toBe(false);
    expect(safeWebContentsSend({ isDestroyed: () => true } as BrowserWindow, 'otto:event', {})).toBe(false);
    expect(
      safeWebContentsSend(
        { isDestroyed: () => false, webContents: { isDestroyed: () => true } } as BrowserWindow,
        'otto:event',
        {},
      ),
    ).toBe(false);
  });

  test('sends when webContents is live', () => {
    const sends: unknown[] = [];
    const win = {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        send: (_channel: string, payload: unknown) => {
          sends.push(payload);
        },
      },
    } as BrowserWindow;
    expect(safeWebContentsSend(win, 'otto:event', { status: { ready: true } })).toBe(true);
    expect(sends).toHaveLength(1);
  });
});
