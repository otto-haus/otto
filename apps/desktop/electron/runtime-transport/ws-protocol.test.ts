import { describe, expect, test } from 'bun:test';
import { TodoStreamAccumulator } from './todo-parser';
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

  test('detects loop idle', () => {
    expect(isLoopIdle({
      type: 'update_loop_status',
      loop_status: { status: 'WAITING_ON_INPUT', active_run_ids: [] },
    })).toBe(true);
  });
});
