import { describe, expect, test } from 'bun:test';
import {
  TurnTrailAccumulator,
  collapsedTrailSummary,
  currentTurnAssistantIndex,
  deriveTurnPhases,
  redactTrailText,
  spanLabelFromTool,
  trailTraceSummary,
} from './turn-trail';

describe('turn-trail span labels', () => {
  test('read_file uses basename on call and result', () => {
    expect(spanLabelFromTool('read_file', { path: '/app/src/surfaces/Chat.tsx' }, 'call')).toEqual({
      label: 'Reading Chat.tsx…',
      detail: '/app/src/surfaces/Chat.tsx',
    });
    expect(spanLabelFromTool('read_file', { path: '/app/src/surfaces/Chat.tsx' }, 'result')).toEqual({
      label: 'Read Chat.tsx',
      detail: '/app/src/surfaces/Chat.tsx',
    });
  });

  test('grep uses pattern', () => {
    expect(spanLabelFromTool('grep', { pattern: 'turnTrail' }, 'call').label).toBe('Searching for turnTrail…');
  });

  test('bash keeps full command in detail for verify phase', () => {
    const labeled = spanLabelFromTool('bash', { command: 'bun test apps/desktop' }, 'call');
    expect(labeled.detail).toContain('bun test');
    const trail = {
      spans: [{
        id: '1',
        kind: 'tool' as const,
        toolName: 'bash',
        label: labeled.label,
        detail: labeled.detail,
        status: 'done' as const,
        startedAt: 0,
      }],
      totalDurationMs: 1,
    };
    expect(deriveTurnPhases(trail)).toContain('verify');
  });

  test('web_fetch uses host', () => {
    expect(spanLabelFromTool('web_fetch', { url: 'https://example.com/docs' }, 'call').label).toBe('Fetching example.com…');
  });

  test('redacts secrets in detail', () => {
    const redacted = redactTrailText('LETTA_API_KEY=sk-secretvalue123456');
    expect(redacted).not.toContain('sk-secret');
    expect(redacted).toContain('…');
  });

  test('redacts equals and flag-style secrets', () => {
    expect(redactTrailText('api_key=abcd1234')).toBe('api_key=…');
    expect(redactTrailText('--token abcd1234')).toBe('…');
  });
});

describe('turn-trail accumulator', () => {
  test('fixture WS deltas produce ordered spans with statuses', () => {
    const acc = new TurnTrailAccumulator();
    acc.ingestWsDelta({ message_type: 'reasoning_message' });
    let trail = acc.ingestWsDelta({
      message_type: 'tool_call_message',
      tool_call: {
        tool_call_id: 'tc-1',
        name: 'read_file',
        arguments: JSON.stringify({ path: 'runtime.ts' }),
      },
    });
    expect(trail?.spans).toHaveLength(2);
    expect(trail?.spans[0]?.status).toBe('done');
    expect(trail?.spans[1]?.label).toContain('Reading runtime.ts');
    expect(trail?.spans[1]?.status).toBe('running');

    trail = acc.ingestWsDelta({
      message_type: 'tool_return_message',
      tool_call_id: 'tc-1',
    })!;
    expect(trail.spans[1]?.status).toBe('done');
    expect(trail.spans[1]?.label).toBe('Read runtime.ts');

    acc.ingestWsDelta({
      message_type: 'tool_call_message',
      tool_call: {
        tool_call_id: 'tc-2',
        name: 'grep',
        arguments: JSON.stringify({ pattern: 'turnTrail' }),
      },
    });
    trail = acc.finalize();
    expect(trail.spans).toHaveLength(3);
    expect(trail.spans.every((s) => s.status === 'done')).toBe(true);
    expect(trailTraceSummary(trail).spanCount).toBe(3);
  });

  test('text-only turn yields empty trail', () => {
    const acc = new TurnTrailAccumulator();
    expect(acc.finalize().spans).toHaveLength(0);
    expect(collapsedTrailSummary(acc.finalize())).toBe('');
  });

  test('collapsed summary uses Explored for multiple locate spans', () => {
    const acc = new TurnTrailAccumulator();
    acc.ingestWsDelta({
      message_type: 'tool_call_message',
      tool_call: { tool_call_id: 'a', name: 'read_file', arguments: '{"path":"a.ts"}' },
    });
    acc.ingestWsDelta({ message_type: 'tool_return_message', tool_call_id: 'a' });
    acc.ingestWsDelta({
      message_type: 'tool_call_message',
      tool_call: { tool_call_id: 'b', name: 'grep', arguments: '{"pattern":"foo"}' },
    });
    acc.ingestWsDelta({ message_type: 'tool_return_message', tool_call_id: 'b' });
    const trail = acc.finalize();
    expect(collapsedTrailSummary(trail)).toMatch(/^Explored 2 files ·/);
  });
});

describe('turn-trail tool-call id matching (blocker #4)', () => {
  test('SDK closes the open span when tool_result omits the id and reasoning bumped seq', () => {
    const acc = new TurnTrailAccumulator();
    // No id on the call → opens under a synthetic id.
    acc.ingestRuntimeMessage({ type: 'tool_call', name: 'read_file', arguments: JSON.stringify({ path: 'a.ts' }) });
    // Reasoning between call and result advances the internal seq counter.
    acc.ingestRuntimeMessage({ type: 'reasoning' });
    // No id on the result → must still close the matching tool span (not a stale `sdk-${seq}`).
    acc.ingestRuntimeMessage({ type: 'tool_result' });
    const toolSpan = acc.snapshot().spans.find((s) => s.toolName === 'read_file');
    expect(toolSpan?.status).toBe('done');
    expect(toolSpan?.label).toBe('Read a.ts');
  });

  test('SDK matches real tool-call ids for open and close', () => {
    const acc = new TurnTrailAccumulator();
    acc.ingestRuntimeMessage({ type: 'tool_call', toolCallId: 'call_42', name: 'grep', arguments: JSON.stringify({ pattern: 'foo' }) });
    acc.ingestRuntimeMessage({ type: 'tool_result', toolCallId: 'call_42' });
    const span = acc.snapshot().spans[0];
    expect(span?.id).toBe('call_42');
    expect(span?.status).toBe('done');
    expect(span?.label).toBe('Searched for foo');
  });

  test('WS reads camelCase ids on both open and close', () => {
    const acc = new TurnTrailAccumulator();
    acc.ingestWsDelta({
      message_type: 'tool_call_message',
      tool_call: { toolCallId: 'tc-y', name: 'read_file', arguments: JSON.stringify({ path: 'b.ts' }) },
    });
    acc.ingestWsDelta({ message_type: 'tool_return_message', toolCallId: 'tc-y' });
    const span = acc.snapshot().spans[0];
    expect(span?.status).toBe('done');
    expect(span?.label).toBe('Read b.ts');
  });

  test('WS falls back to the running span when the return delta drops the id', () => {
    const acc = new TurnTrailAccumulator();
    acc.ingestWsDelta({
      message_type: 'tool_call_message',
      tool_call: { tool_call_id: 'tc-z', name: 'grep', arguments: JSON.stringify({ pattern: 'bar' }) },
    });
    acc.ingestWsDelta({ message_type: 'tool_return_message' });
    const span = acc.snapshot().spans[0];
    expect(span?.status).toBe('done');
    expect(span?.label).toBe('Searched for bar');
  });
});

describe('currentTurnAssistantIndex (blocker #3 — turn-scoped attach)', () => {
  test('selects the assistant answer for the current turn', () => {
    const msgs = [
      { who: 'user' },
      { who: 'otto' },
      { who: 'user' },
      { who: 'otto' },
    ];
    expect(currentTurnAssistantIndex(msgs)).toBe(3);
  });

  test('tool-only turn does not attach to a previous answer', () => {
    // Prior turn produced an answer; current turn (after last user) only emitted tool spans and an error.
    const msgs = [
      { who: 'user' },
      { who: 'otto' },
      { who: 'user' },
      { who: 'error' },
    ];
    expect(currentTurnAssistantIndex(msgs)).toBe(-1);
  });

  test('returns -1 when there is no assistant message at all', () => {
    expect(currentTurnAssistantIndex([{ who: 'user' }])).toBe(-1);
    expect(currentTurnAssistantIndex([])).toBe(-1);
  });
});

describe('turn-trail phases', () => {
  test('derives orient locate edit from spans', () => {
    const acc = new TurnTrailAccumulator();
    acc.ingestWsDelta({ message_type: 'reasoning_message' });
    acc.ingestWsDelta({
      message_type: 'tool_call_message',
      tool_call: { tool_call_id: 'r', name: 'read_file', arguments: '{"path":"x.ts"}' },
    });
    acc.ingestWsDelta({ message_type: 'tool_return_message', tool_call_id: 'r' });
    acc.ingestWsDelta({
      message_type: 'tool_call_message',
      tool_call: { tool_call_id: 'e', name: 'edit_file', arguments: '{"path":"x.ts"}' },
    });
    acc.ingestWsDelta({ message_type: 'tool_return_message', tool_call_id: 'e' });
    const phases = deriveTurnPhases(acc.finalize());
    expect(phases).toEqual(['orient', 'locate', 'edit']);
  });

  test('returns no phases when trail empty', () => {
    expect(deriveTurnPhases({ spans: [], totalDurationMs: 0 })).toEqual([]);
  });
});
