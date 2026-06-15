import { describe, expect, test } from 'bun:test';
import {
  TurnTrailAccumulator,
  collapsedTrailSummary,
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
