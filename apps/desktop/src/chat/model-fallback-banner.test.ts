import { describe, expect, it } from 'bun:test';
import {
  modelFallbackBannerBody,
  modelFallbackBannerSummary,
  shouldShowModelFallbackBanner,
} from './model-fallback-banner';

const labelFor = (handle: string) => handle;

describe('shouldShowModelFallbackBanner', () => {
  it('shows when ready and requested differs from active', () => {
    expect(shouldShowModelFallbackBanner({
      ready: true,
      requested: 'my-byok/mistral-7b',
      active: 'letta/auto',
      fallbackReason: 'Requested my-byok/mistral-7b is unavailable; running letta/auto for this session.',
    })).toBe(true);
  });

  it('hides when handles match or runtime is not ready', () => {
    expect(shouldShowModelFallbackBanner({
      ready: true,
      requested: 'openai/gpt-5.5',
      active: 'openai/gpt-5.5',
      fallbackReason: null,
    })).toBe(false);
    expect(shouldShowModelFallbackBanner({
      ready: false,
      requested: 'my-byok/mistral-7b',
      active: 'letta/auto',
      fallbackReason: 'fallback',
    })).toBe(false);
  });
});

describe('modelFallbackBannerBody', () => {
  it('uses fallbackReason when provided', () => {
    const reason = 'Requested anthropic/claude-sonnet-4 is not in Letta catalog; running letta/auto instead.';
    expect(modelFallbackBannerBody({
      requested: 'anthropic/claude-sonnet-4',
      active: 'letta/auto',
      fallbackReason: reason,
      labelFor,
    })).toBe(reason);
  });

  it('formats requested → active summary', () => {
    expect(modelFallbackBannerSummary('my-byok/mistral-7b', 'letta/auto', labelFor)).toBe(
      'my-byok/mistral-7b → letta/auto',
    );
  });
});
