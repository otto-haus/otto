import { describe, expect, test } from 'bun:test';
import type { ChatMsg } from '../runtime';
import { turnTrailSummaryLines } from './TurnTrailSummary';
import type { TurnTrail } from './turn-trail';

const fixtureTrail: TurnTrail = {
  totalDurationMs: 3200,
  spans: [
    {
      id: 'r1',
      kind: 'reasoning',
      toolName: 'reasoning',
      label: 'Reasoned',
      status: 'done',
      startedAt: 0,
      endedAt: 400,
      durationMs: 400,
    },
    {
      id: 't1',
      kind: 'tool',
      toolName: 'read_file',
      label: 'Read Chat.tsx',
      detail: 'Chat.tsx',
      status: 'done',
      startedAt: 400,
      endedAt: 1200,
      durationMs: 800,
    },
    {
      id: 't2',
      kind: 'tool',
      toolName: 'grep',
      label: 'Searched for turnTrail',
      detail: 'turnTrail',
      status: 'done',
      startedAt: 1200,
      endedAt: 3200,
      durationMs: 2000,
    },
  ],
};

const fixtureMsg: ChatMsg = {
  id: 'otto-fixture',
  who: 'otto',
  text: 'Here is the answer.',
  trail: fixtureTrail,
};

describe('TurnTrailSummary fixture', () => {
  test('renders collapsed summary from fixture ChatMsg trail', () => {
    expect(fixtureMsg.trail?.spans.length).toBe(3);
    const lines = turnTrailSummaryLines(fixtureMsg.trail!, false);
    expect(lines.collapsed).toMatch(/^Explored 2 files ·/);
    expect(lines.expanded).toHaveLength(3);
    expect(lines.expanded[1]).toContain('Read Chat.tsx');
  });

  test('phase strip when labs enabled', () => {
    const lines = turnTrailSummaryLines(fixtureMsg.trail!, true);
    expect(lines.phases).toBe('Orient · Locate');
  });
});
