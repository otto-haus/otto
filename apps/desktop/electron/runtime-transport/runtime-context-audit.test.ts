/**
 * #568 — Letta session context API audit receipt (static).
 * Documents SDK version audited and confirms prefix contract unchanged.
 */
import { describe, expect, test } from 'bun:test';
import { promptWithRuntimeContext, runtimeContextForPrompt } from './runtime-common';

/** Bundled SDK version at audit time; update when re-auditing upstream. */
const AUDITED_LETTA_CODE_SDK = '0.1.14';

describe('runtime context audit (#568)', () => {
  test('records audited letta-code-sdk version', () => {
    expect(AUDITED_LETTA_CODE_SDK).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('prefix uses otto_runtime_context envelope', () => {
    const context = runtimeContextForPrompt({
      modelHandle: 'chatgpt-plus-pro/gpt-5.5',
      effort: 'high',
      transportMode: 'sdk',
    });
    expect(context.startsWith('<otto_runtime_context>')).toBe(true);
    expect(context.endsWith('</otto_runtime_context>')).toBe(true);
    expect(context).toContain('provider_path: local Letta runtime');
  });

  test('user text preserved after prefix (no migration yet)', () => {
    const prompt = promptWithRuntimeContext('hello', {
      modelHandle: 'anthropic/claude-sonnet-4-6',
      effort: 'medium',
    });
    expect(prompt).toContain('selected_model_handle: anthropic/claude-sonnet-4-6');
    expect(prompt.endsWith('hello')).toBe(true);
  });
});
