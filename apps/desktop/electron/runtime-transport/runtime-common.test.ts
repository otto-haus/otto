import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { BrowserWindow } from 'electron';
import { classify, friendly, modelSelectionForCli, nextActionFor, resolveCli, safeWebContentsSend } from './runtime-common';

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

describe('friendly invalid model', () => {
  test('shortens invalid model errors', () => {
    expect(friendly('error', "Invalid model 'gpt-5.5-plus-pro-xhigh'")).toMatch(/isn't available/i);
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

  test('friendly and nextActionFor align with StatusCode', () => {
    expect(friendly('unreachable', 'ECONNREFUSED')).toMatch(/Can't reach the Letta backend/i);
    expect(nextActionFor('no-agent')).toMatch(/Agent ID/i);
    expect(nextActionFor('stale')).toMatch(/stale override/i);
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
