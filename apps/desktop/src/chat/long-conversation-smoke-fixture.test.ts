import { describe, expect, test } from 'bun:test';
import {
  buildLongConversationSmokeFixture,
  evaluateLongConversationPerf,
  LONG_CONV_PERF_THRESHOLDS,
  LONG_CONV_SMOKE_MARKER,
} from './long-conversation-smoke-fixture';

describe('long-conversation-smoke-fixture', () => {
  test('builds disposable state with messages, cards, queue, and attachment', () => {
    const fixture = buildLongConversationSmokeFixture('run123');
    expect(fixture.marker).toContain(LONG_CONV_SMOKE_MARKER);
    expect(fixture.messages.length).toBeGreaterThanOrEqual(90);
    expect(fixture.expected.receiptCards).toBeGreaterThanOrEqual(5);
    expect(fixture.queue.some((item) => item.state === 'queued')).toBe(true);
    expect(fixture.queue.some((item) => item.state === 'failed')).toBe(true);
    expect(fixture.attachments).toHaveLength(1);
    expect(fixture.messages.some((m) => m.receiptInline)).toBe(true);
    expect(fixture.messages.some((m) => m.checkBlock)).toBe(true);
  });

  test('passes when metrics stay within thresholds', () => {
    const result = evaluateLongConversationPerf({
      hydrateMs: 1200,
      scrollTailMs: 80,
      actionProbeMs: 120,
      msgRowCount: 40,
      receiptCardCount: 6,
      messageActionCount: 4,
      queueVisible: true,
      attachmentTrayVisible: true,
      ready: true,
    });
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.bottleneck).toBeNull();
  });

  test('names bottleneck when hydration exceeds budget', () => {
    const result = evaluateLongConversationPerf({
      hydrateMs: LONG_CONV_PERF_THRESHOLDS.hydrateMs + 1,
      scrollTailMs: 50,
      actionProbeMs: 50,
      msgRowCount: 40,
      receiptCardCount: 6,
      messageActionCount: 4,
      queueVisible: true,
      attachmentTrayVisible: true,
      ready: true,
    });
    expect(result.ok).toBe(false);
    expect(result.bottleneck).toBe('initial render / message hydration');
  });
});
