import { describe, expect, test } from 'bun:test';
import { isLoopIdle, normalizeWsEvent } from './ws-protocol';

describe('ws-protocol', () => {
  test('normalizes assistant stream_delta', () => {
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: { message_type: 'assistant_message', content: 'Hello', otid: 'assistant-1', run_id: 'run-1' },
    });
    expect(event?.type).toBe('assistant');
    expect(event?.text).toBe('Hello');
    expect(event?.uuid).toBe('assistant-1');
    expect(event?.runId).toBe('run-1');
  });

  test('assistant deltas from the same Letta message keep a stable stream id', () => {
    const first = normalizeWsEvent({
      type: 'stream_delta',
      delta: { message_type: 'assistant_message', content: 'Hel', otid: 'assistant-1', run_id: 'run-1', id: 'letta-msg-1' },
    });
    const second = normalizeWsEvent({
      type: 'stream_delta',
      delta: { message_type: 'assistant_message', content: 'lo', otid: 'assistant-1', run_id: 'run-1', id: 'letta-msg-2' },
    });
    expect(first?.uuid).toBe(second?.uuid);
  });

  test('normalizes Letta loop_error deltas as errors', () => {
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: {
        message_type: 'loop_error',
        message: 'Conversation local-conv-stale not found',
      },
    });
    expect(event?.type).toBe('error');
    expect(event?.message).toContain('local-conv-stale');
  });

  test('detects loop idle', () => {
    expect(isLoopIdle({
      type: 'update_loop_status',
      loop_status: { status: 'WAITING_ON_INPUT', active_run_ids: [] },
    })).toBe(true);
  });
});
