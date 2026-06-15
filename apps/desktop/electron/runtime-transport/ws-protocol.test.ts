import { describe, expect, test } from 'bun:test';
import { TurnTrailAccumulator } from '../../src/chat/turn-trail';
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

  test('normalizes nested Letta tool_call stream_delta', () => {
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: {
        message_type: 'tool_call_message',
        tool_call: {
          tool_call_id: 'tc-1',
          name: 'Bash',
          arguments: JSON.stringify({ command: 'git status' }),
        },
      },
    });
    expect(event?.type).toBe('tool_call');
    expect(event?.toolName).toBe('Bash');
    expect(event?.toolCallId).toBe('tc-1');
    expect(event?.toolInput).toEqual({ command: 'git status' });
  });

  test('normalizes flat tool call stream_delta fallback', () => {
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: {
        message_type: 'tool_call_message',
        tool_call_id: 'tc-1',
        tool_name: 'Bash',
        tool_input: { command: 'git status' },
      },
    });
    expect(event?.type).toBe('tool_call');
    expect(event?.toolName).toBe('Bash');
  });

  test('normalizes tool result stream_delta', () => {
    const event = normalizeWsEvent({
      type: 'stream_delta',
      delta: {
        message_type: 'tool_return_message',
        tool_call_id: 'tc-1',
        content: 'done',
      },
    });
    expect(event?.type).toBe('tool_result');
    expect(event?.content).toBe('done');
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

  test('accumulates turn trail spans from tool_call and return deltas', () => {
    const trailAccumulator = new TurnTrailAccumulator();
    normalizeWsEvent({
      type: 'stream_delta',
      delta: {
        message_type: 'tool_call_message',
        tool_call: {
          tool_call_id: 'tc-trail',
          name: 'read_file',
          arguments: JSON.stringify({ path: 'runtime.ts' }),
        },
      },
    }, { trailAccumulator });
    normalizeWsEvent({
      type: 'stream_delta',
      delta: { message_type: 'tool_return_message', tool_call_id: 'tc-trail' },
    }, { trailAccumulator });
    const trail = trailAccumulator.finalize();
    expect(trail.spans).toHaveLength(1);
    expect(trail.spans[0]?.status).toBe('done');
    expect(trail.spans[0]?.label).toBe('Read runtime.ts');
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
