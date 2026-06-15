import { describe, expect, test } from 'bun:test';
import { parseTodoItemsFromArgs, TodoStreamAccumulator } from './todo-parser';

describe('todo-parser', () => {
  test('parses TodoWrite args into normalized items', () => {
    const items = parseTodoItemsFromArgs(JSON.stringify({
      todos: [
        { id: 'a', content: 'Ship panel', status: 'in_progress' },
        { id: 'b', content: 'Verify tests', status: 'pending' },
      ],
    }));
    expect(items).toEqual([
      { id: 'a', content: 'Ship panel', status: 'in_progress' },
      { id: 'b', content: 'Verify tests', status: 'pending' },
    ]);
  });

  test('returns null for incomplete JSON while args stream', () => {
    expect(parseTodoItemsFromArgs('{"todos":[{"id":"a","content":"Do')).toBeNull();
  });

  test('accumulates streamed tool_call_message deltas', () => {
    const acc = new TodoStreamAccumulator();
    expect(acc.ingestStreamDelta({
      message_type: 'tool_call_message',
      tool_call: { tool_call_id: 'tc-1', name: 'TodoWrite', arguments: '{"todos":[' },
    })).toBeNull();
    const items = acc.ingestStreamDelta({
      message_type: 'tool_call_message',
      tool_call: { tool_call_id: 'tc-1', name: 'TodoWrite', arguments: '{"id":"1","content":"A","status":"completed"}]}' },
    });
    expect(items).toEqual([{ id: '1', content: 'A', status: 'completed' }]);
  });

  test('ignores non-todo tools', () => {
    const acc = new TodoStreamAccumulator();
    expect(acc.ingestStreamDelta({
      message_type: 'tool_call_message',
      tool_call: { tool_call_id: 'tc-2', name: 'Bash', arguments: '{"command":"ls"}' },
    })).toBeNull();
  });
});
