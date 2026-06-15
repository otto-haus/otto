import { describe, expect, test } from 'bun:test';
import { activityFromRuntimeMessage, activityFromWsDelta, formatToolActivity } from './turn-activity';

describe('turn-activity', () => {
  test('formats known tool names', () => {
    expect(formatToolActivity('read_file', 'call')).toBe('Reading file…');
    expect(formatToolActivity('run_shell', 'result')).toBe('Running command — done');
  });

  test('maps SDK tool_call messages', () => {
    const activity = activityFromRuntimeMessage({
      type: 'tool_call',
      toolName: 'Grep',
      toolInput: { pattern: 'foo' },
    });
    expect(activity).toEqual({ kind: 'tool', label: 'Searching…' });
  });

  test('maps SDK reasoning messages', () => {
    expect(activityFromRuntimeMessage({ type: 'reasoning', content: 'hmm' })).toEqual({
      kind: 'reasoning',
      label: 'Reasoning…',
    });
  });

  test('maps WS tool_call_message deltas', () => {
    expect(activityFromWsDelta({
      message_type: 'tool_call_message',
      name: 'read_file',
    })).toEqual({ kind: 'tool', label: 'Reading file…' });
  });

  test('maps WS reasoning_message deltas', () => {
    expect(activityFromWsDelta({ message_type: 'reasoning_message' })).toEqual({
      kind: 'reasoning',
      label: 'Reasoning…',
    });
  });
});
