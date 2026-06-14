import { describe, expect, test } from 'bun:test';
import { WS_PROMOTION_GATE_REASON, wsPromotionApproved } from './ws-promotion-gate';

describe('wsPromotionApproved', () => {
  const original = process.env.OTTO_WS_PROMOTION_APPROVED;

  test('defaults false when env unset and scorecard not filled', () => {
    delete process.env.OTTO_WS_PROMOTION_APPROVED;
    expect(wsPromotionApproved()).toBe(false);
  });

  test('honors explicit env approval', () => {
    process.env.OTTO_WS_PROMOTION_APPROVED = '1';
    expect(wsPromotionApproved()).toBe(true);
    process.env.OTTO_WS_PROMOTION_APPROVED = '0';
    expect(wsPromotionApproved()).toBe(false);
  });

  test('exposes stable gate reason string', () => {
    expect(WS_PROMOTION_GATE_REASON).toContain('promotion scorecard');
  });

  if (original === undefined) delete process.env.OTTO_WS_PROMOTION_APPROVED;
  else process.env.OTTO_WS_PROMOTION_APPROVED = original;
});
