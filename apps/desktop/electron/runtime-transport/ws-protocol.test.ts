import { randomUUID } from 'node:crypto';
import { describe, expect, test } from 'bun:test';
import { TodoStreamAccumulator } from './todo-parser';
import { countAttachmentsInPrompt, isLoopIdle, normalizeWsEvent, turnIdleTimeoutMs } from './ws-protocol';

describe('ws-protocol', () => {
  test('normalizes assistant stream_delta', () => {
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: { message_type: 'assistant_message', content: 'Hello' },
    });
    expect(event?.type).toBe('assistant');
    expect(event?.text).toBe('Hello');
  });

  test('shares one uuid across assistant deltas of a turn, differs across turns', () => {
    const turnA = randomUUID();
    const first = normalizeWsEvent(
      { type: 'stream_delta', delta: { message_type: 'assistant_message', content: 'Hel' } },
      { assistantStreamId: turnA },
    );
    const second = normalizeWsEvent(
      { type: 'stream_delta', delta: { message_type: 'assistant_message', content: 'lo' } },
      { assistantStreamId: turnA },
    );
    // Both chunks of the same reply must carry the same uuid so the renderer appends to one bubble.
    expect(first?.uuid).toBe(turnA);
    expect(second?.uuid).toBe(turnA);
    expect(first?.uuid).toBe(second?.uuid);

    // A new turn uses a different stream id so consecutive replies stay as separate bubbles.
    const turnB = randomUUID();
    const next = normalizeWsEvent(
      { type: 'stream_delta', delta: { message_type: 'assistant_message', content: 'Bye' } },
      { assistantStreamId: turnB },
    );
    expect(next?.uuid).toBe(turnB);
    expect(next?.uuid).not.toBe(first?.uuid);
  });

  test('normalizes TodoWrite tool_call_message stream_delta', () => {
    const acc = new TodoStreamAccumulator();
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: {
        message_type: 'tool_call_message',
        tool_call: {
          tool_call_id: 'tc-1',
          name: 'TodoWrite',
          arguments: JSON.stringify({
            todos: [{ id: '1', content: 'Wire todos', status: 'in_progress' }],
          }),
        },
      },
    }, { todoAccumulator: acc });
    expect(event?.type).toBe('todo_update');
    expect(event?.todos).toEqual([{ id: '1', content: 'Wire todos', status: 'in_progress' }]);
  });

  test('normalizes tool_call_message stream_delta as activity', () => {
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: { message_type: 'tool_call_message', name: 'grep' },
    });
    expect(event?.type).toBe('activity');
    expect(event?.label).toBe('Searching…');
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

  test('counts attachment lines in prompt text', () => {
    const text = 'review these\n\nAttached local images:\n1. a.png — /tmp/a.png\n2. b.png — /tmp/b.png';
    expect(countAttachmentsInPrompt(text)).toBe(2);
    expect(countAttachmentsInPrompt('plain prompt')).toBe(0);
  });

  test('scales turn idle timeout for attachment-heavy prompts', () => {
    const prev = process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS;
    Reflect.deleteProperty(process.env, 'OTTO_WS_TURN_IDLE_TIMEOUT_MS');
    const plain = turnIdleTimeoutMs('hello');
    const heavy = turnIdleTimeoutMs('x\n\nAttached local images:\n1. a — /a\n2. b — /b\n3. c — /c');
    expect(plain).toBeGreaterThanOrEqual(45_000);
    expect(heavy).toBeGreaterThan(plain);
    if (prev === undefined) Reflect.deleteProperty(process.env, 'OTTO_WS_TURN_IDLE_TIMEOUT_MS');
    else process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS = prev;
  });
});
