import { describe, expect, test } from 'bun:test';
import { isLocalLettaBackendListening, resolveInitBaseUrl, resolveModelHandle } from './letta-discovery';
import type { LettaModelOption } from '../shared/types';

const MODELS: LettaModelOption[] = [
  { handle: 'letta/auto', label: 'Auto' },
  { handle: 'openai/gpt-5.5', label: 'GPT 5.5' },
  { handle: 'anthropic/claude-opus-4-8', label: 'Claude Opus 4.8' },
];

describe('resolveInitBaseUrl', () => {
  const prevSkip = process.env.OTTO_SKIP_LETTA_LSOF;

  test('blocks existing mode when local: backend is down', () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const result = resolveInitBaseUrl('local:/Users/seb/.letta/lc-local-backend', 'existing');
    expect(result.blockReason).toMatch(/Local Letta backend is not running/i);
    expect(result.baseUrl).toBe('local:/Users/seb/.letta/lc-local-backend');
  });

  test('omits base URL in embedded mode so bundled CLI can spawn standalone backend', () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const result = resolveInitBaseUrl('local:/Users/seb/.letta/lc-local-backend', 'embedded');
    expect(result.blockReason).toBeUndefined();
    expect(result.baseUrl).toBeNull();
  });

  test('passes through http URL for cloud mode when listener check is skipped', () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    expect(resolveInitBaseUrl('http://127.0.0.1:8283', 'cloud').baseUrl).toBe('http://127.0.0.1:8283');
  });

  test('isLocalLettaBackendListening respects OTTO_SKIP_LETTA_LSOF', () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    expect(isLocalLettaBackendListening()).toBe(false);
    if (prevSkip === undefined) delete process.env.OTTO_SKIP_LETTA_LSOF;
    else process.env.OTTO_SKIP_LETTA_LSOF = prevSkip;
  });
});

describe('resolveModelHandle', () => {
  test('keeps requested handle when present in discovered models', () => {
    const resolved = resolveModelHandle('anthropic/claude-opus-4-8', MODELS);
    expect(resolved).toEqual({
      requested: 'anthropic/claude-opus-4-8',
      active: 'anthropic/claude-opus-4-8',
      fallbackReason: null,
    });
  });

  test('does not mutate requested when absent from discovery — falls back for active only', () => {
    const resolved = resolveModelHandle('anthropic/claude-sonnet-4', MODELS);
    expect(resolved.requested).toBe('anthropic/claude-sonnet-4');
    expect(resolved.active).toBe('letta/auto');
    expect(resolved.fallbackReason).toContain('anthropic/claude-sonnet-4');
    expect(resolved.fallbackReason).toContain('letta/auto');
  });

  test('returns null active when no models and no preference', () => {
    expect(resolveModelHandle(null, [])).toEqual({
      requested: null,
      active: null,
      fallbackReason: null,
    });
  });

  test('uses default chain when preference is null', () => {
    const resolved = resolveModelHandle(null, MODELS);
    expect(resolved).toEqual({
      requested: null,
      active: 'letta/auto',
      fallbackReason: null,
    });
  });
});
