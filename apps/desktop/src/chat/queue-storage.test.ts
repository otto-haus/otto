import { describe, expect, test } from 'bun:test';
import { isSmokeQueueText, previewQueueText, sanitizeQueue, type QueueItem } from './queue-storage';

describe('queue-storage', () => {
  test('drops smoke-test thread markers', () => {
    const items: QueueItem[] = [
      { id: '1', text: '046-rev10-thread-a-20260614141000', createdAt: Date.now(), state: 'failed' },
      { id: '2', text: 'Help me plan the release.', createdAt: Date.now(), state: 'queued' },
    ];
    expect(sanitizeQueue(items).map((x) => x.id)).toEqual(['2']);
  });

  test('preview hides smoke ids', () => {
    expect(previewQueueText('046-smoke-thread-b-20260614141000')).toBe('Automated smoke message');
    expect(previewQueueText('Draft a short plan I can react to.')).toBe('Draft a short plan I can react to.');
  });

  test('isSmokeQueueText matches staging patterns', () => {
    expect(isSmokeQueueText('046-rev10-thread-a-20260614141000')).toBe(true);
    expect(isSmokeQueueText('hello world')).toBe(false);
  });
});
