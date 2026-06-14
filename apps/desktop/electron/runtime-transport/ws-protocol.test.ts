import { describe, expect, test } from 'bun:test';
import { isLoopIdle, normalizeWsEvent } from './ws-protocol';

describe('ws-protocol', () => {
  test('normalizes assistant stream_delta', () => {
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: { message_type: 'assistant_message', content: 'Hello' },
    });
    expect(event?.type).toBe('assistant');
    expect(event?.text).toBe('Hello');
  });

  test('detects loop idle', () => {
    expect(isLoopIdle({
      type: 'update_loop_status',
      loop_status: { status: 'WAITING_ON_INPUT', active_run_ids: [] },
    })).toBe(true);
  });
});
