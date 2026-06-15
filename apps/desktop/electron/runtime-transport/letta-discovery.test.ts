import { describe, expect, test } from 'bun:test';
import { resolveModelHandle } from './letta-discovery';
import type { LettaModelOption } from '../shared/types';

const MODELS: LettaModelOption[] = [
  { handle: 'letta/auto', label: 'Auto' },
  { handle: 'openai/gpt-5.5', label: 'GPT 5.5' },
  { handle: 'anthropic/claude-opus-4-8', label: 'Claude Opus 4.8' },
];

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
