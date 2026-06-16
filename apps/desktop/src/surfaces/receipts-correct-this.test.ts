import { describe, expect, test } from 'bun:test';
import type { ReceiptStatus } from '@otto-haus/core';

export function receiptDetailShowsCorrectThis(status: ReceiptStatus, hasBlocker: boolean): boolean {
  return (status === 'blocked' || status === 'failed') && hasBlocker;
}

describe('receipts Correct This bridge (#631)', () => {
  test('shows for blocked or failed receipts with blocker', () => {
    expect(receiptDetailShowsCorrectThis('blocked', true)).toBe(true);
    expect(receiptDetailShowsCorrectThis('failed', true)).toBe(true);
    expect(receiptDetailShowsCorrectThis('success', true)).toBe(false);
    expect(receiptDetailShowsCorrectThis('blocked', false)).toBe(false);
  });
});
