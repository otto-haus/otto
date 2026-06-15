import { describe, expect, test } from 'bun:test';
import { normalizeRuntimeMessageToTurnEvent } from './turn-events';

describe('normalizeRuntimeMessageToTurnEvent (TurnTrail #727 compatible)', () => {
  test('assistant text → token event', () => {
    const e = normalizeRuntimeMessageToTurnEvent({ type: 'assistant', text: 'hi there' });
    expect(e).toEqual({ type: 'token', status: 'streaming', title: 'Reply', body: 'hi there' });
  });

  test('thinking → thought event', () => {
    const e = normalizeRuntimeMessageToTurnEvent({ type: 'thinking', text: 'reasoning…' });
    expect(e?.type).toBe('thought');
  });

  test('tool_use → tool event with payload', () => {
    const e = normalizeRuntimeMessageToTurnEvent({ type: 'tool_use', name: 'read_file', input: { path: 'a' } });
    expect(e?.type).toBe('tool');
    expect(e?.title).toBe('read_file');
    expect(e?.payload).toEqual({ path: 'a' });
  });

  test('error → error event', () => {
    const e = normalizeRuntimeMessageToTurnEvent({ type: 'error', message: 'boom' });
    expect(e).toEqual({ type: 'error', status: 'failed', title: 'Error', body: 'boom' });
  });

  test('result success=false → failed receipt', () => {
    const e = normalizeRuntimeMessageToTurnEvent({ type: 'result', success: false });
    expect(e).toEqual({ type: 'receipt', status: 'failed', title: 'Turn failed' });
  });

  test('empty assistant delta and unknown types → null (no DOM noise)', () => {
    expect(normalizeRuntimeMessageToTurnEvent({ type: 'assistant', text: '' })).toBeNull();
    expect(normalizeRuntimeMessageToTurnEvent({ type: 'heartbeat' })).toBeNull();
  });
});
