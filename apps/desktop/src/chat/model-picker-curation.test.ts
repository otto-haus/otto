import { describe, expect, test } from 'bun:test';
import {
  curateModelOptions,
  isLegacyModelHandle,
  isPrimaryModelHandle,
  modelProviderSubtitle,
  visiblePickerModels,
} from './model-picker-curation';

describe('model-picker-curation', () => {
  test('marks recommended handles as primary', () => {
    expect(isPrimaryModelHandle('letta/auto')).toBe(true);
    expect(isPrimaryModelHandle('chatgpt-plus-pro/gpt-5.5')).toBe(true);
    expect(isPrimaryModelHandle('anthropic/claude-sonnet-4-6')).toBe(true);
  });

  test('marks stale handles as legacy', () => {
    expect(isLegacyModelHandle('openai/gpt-3.5-turbo')).toBe(true);
    expect(isLegacyModelHandle('anthropic/claude-2.1')).toBe(true);
    expect(isLegacyModelHandle('openai/gpt-4-turbo')).toBe(true);
    expect(isLegacyModelHandle('provider/custom', true)).toBe(true);
  });

  test('curates mixed model list into tiers', () => {
    const curated = curateModelOptions([
      { handle: 'letta/auto', label: 'Auto' },
      { handle: 'openai/gpt-5.5', label: 'GPT-5.5' },
      { handle: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { handle: 'byok/custom-model', label: 'Custom BYOK' },
    ]);
    expect(curated.map((m) => [m.handle, m.tier])).toEqual([
      ['letta/auto', 'primary'],
      ['openai/gpt-5.5', 'primary'],
      ['openai/gpt-3.5-turbo', 'legacy'],
      ['byok/custom-model', 'other'],
    ]);
  });

  test('hides legacy models unless expanded or selected', () => {
    const curated = curateModelOptions([
      { handle: 'letta/auto', label: 'Auto' },
      { handle: 'openai/gpt-5.5', label: 'GPT-5.5' },
      { handle: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { handle: 'byok/custom-model', label: 'Custom BYOK' },
    ]);

    expect(visiblePickerModels(curated, false).map((m) => m.handle)).toEqual([
      'letta/auto',
      'openai/gpt-5.5',
    ]);

    expect(visiblePickerModels(curated, false, 'openai/gpt-3.5-turbo').map((m) => m.handle)).toEqual([
      'letta/auto',
      'openai/gpt-5.5',
      'openai/gpt-3.5-turbo',
    ]);

    expect(visiblePickerModels(curated, true).map((m) => m.handle)).toEqual([
      'letta/auto',
      'openai/gpt-5.5',
      'openai/gpt-3.5-turbo',
      'byok/custom-model',
    ]);
  });

  test('preserves providerCategory for BYOK rows (#459)', () => {
    const curated = curateModelOptions([
      { handle: 'my-vllm/custom', label: 'Custom', providerCategory: 'byok', provider: 'My vLLM' },
      { handle: 'openai/gpt-5.5', label: 'GPT-5.5', providerCategory: 'base', provider: 'openai' },
    ]);
    expect(curated[0]?.providerCategory).toBe('byok');
    expect(curated[1]?.providerCategory).toBe('base');
  });

  test('modelProviderSubtitle shows provider when distinct from handle prefix', () => {
    expect(modelProviderSubtitle({ handle: 'openrouter/foo', provider: 'OpenRouter' })).toBeNull();
    expect(modelProviderSubtitle({ handle: 'openai/gpt-5.5', provider: 'openai' })).toBeNull();
    expect(modelProviderSubtitle({ handle: 'my-vllm/custom', provider: 'My vLLM' })).toBe('My vLLM');
  });
});
