import { describe, expect, test } from 'bun:test';
import { evaluateResumeRoster } from './resume-roster';

describe('evaluateResumeRoster (#318)', () => {
  test('passes when draft, queue, and runtime survive resume', () => {
    const result = evaluateResumeRoster({
      draftText: '318-smoke-draft-abc',
      draftExpected: '318-smoke-draft-abc',
      queueItems: [{ id: 'q1', text: '318-smoke-queue-abc', state: 'queued' }],
      queueExpectedTexts: ['318-smoke-queue-abc'],
      runtimeReady: true,
      runtimeReason: null,
      scheduledRoutines: [
        { slug: 'morning', scheduled: true, allowed: false, reason: 'Requires approval to activate.' },
      ],
      dreamsWired: false,
    });

    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(result.reports.find((r) => r.capability === 'chat_draft')?.state).toBe('ok');
    expect(result.reports.find((r) => r.capability === 'chat_queue')?.state).toBe('ok');
    expect(result.reports.find((r) => r.capability === 'runtime_socket')?.state).toBe('ok');
    expect(result.reports.find((r) => r.capability === 'dreams_background_loops')?.state).toBe('not_wired');
  });

  test('fails loudly when draft is lost', () => {
    const result = evaluateResumeRoster({
      draftText: '',
      draftExpected: '318-smoke-draft-abc',
      queueItems: [{ id: 'q1', text: '318-smoke-queue-abc', state: 'queued' }],
      queueExpectedTexts: ['318-smoke-queue-abc'],
      runtimeReady: false,
      runtimeReason: 'Letta unreachable',
      scheduledRoutines: [],
      dreamsWired: false,
    });

    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.capability === 'chat_draft')).toBe(true);
    expect(result.failures.find((f) => f.capability === 'chat_draft')?.nextAction).toContain('draft');
  });

  test('reports deferred scheduled routines without treating gate as silent failure', () => {
    const result = evaluateResumeRoster({
      draftText: 'keep',
      draftExpected: 'keep',
      queueItems: [],
      queueExpectedTexts: [],
      runtimeReady: true,
      scheduledRoutines: [
        { slug: 'morning', scheduled: true, allowed: false, reason: 'Scheduled routine may activate after approval.' },
      ],
      dreamsWired: false,
    });

    expect(result.reports.find((r) => r.capability === 'routine:morning')?.state).toBe('deferred');
    expect(result.ok).toBe(true);
  });
});
