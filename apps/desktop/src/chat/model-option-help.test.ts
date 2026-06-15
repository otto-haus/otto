import { describe, expect, test } from 'bun:test';
import { formatResolvedModelLabel, helpTextForModelOption, isAutoModelOption } from './model-option-help';

describe('model-option-help', () => {
  test('identifies auto presets by handle and label', () => {
    expect(isAutoModelOption({ handle: 'letta/auto', label: 'Auto' })).toBe(true);
    expect(isAutoModelOption({ handle: 'letta/auto-fast', label: 'Auto Fast' })).toBe(true);
    expect(isAutoModelOption({ handle: 'openai/gpt-5.5', label: 'GPT-5.5' })).toBe(false);
  });

  test('returns specific help for auto variants', () => {
    expect(helpTextForModelOption({ handle: 'letta/auto-fast', label: 'Auto Fast' })).toMatch(/fastest/i);
    expect(helpTextForModelOption({ handle: 'letta/auto-memory', label: 'Auto Memory' })).toMatch(/memory/i);
    expect(helpTextForModelOption({ handle: 'letta/auto-chat', label: 'Auto Chat' })).toMatch(/conversational/i);
    expect(helpTextForModelOption({ handle: 'openai/gpt-5.5', label: 'GPT-5.5' })).toBeNull();
  });

  test('formats resolved auto model labels', () => {
    const options = [
      { handle: 'letta/auto', label: 'Auto' },
      { handle: 'openai/gpt-5.5', label: 'GPT-5.5 (OpenAI)' },
    ];
    const labelFor = (value?: string | null) =>
      options.find((option) => option.handle === value)?.label ?? value ?? 'Agent default';

    expect(formatResolvedModelLabel('letta/auto', 'openai/gpt-5.5', options, labelFor)).toBe('GPT-5.5 (OpenAI)');
    expect(formatResolvedModelLabel('openai/gpt-5.5', 'openai/gpt-5.5', options, labelFor)).toBeNull();
  });
});
