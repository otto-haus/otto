import { describe, expect, test } from 'bun:test';
import {
  formatDurationMs,
  formatToolSummary,
  mergeToolResult,
  summarizeToolInput,
  type ToolActivity,
} from './tool-activity';

describe('tool-activity', () => {
  test('summarizeToolInput prefers bash command fields', () => {
    expect(summarizeToolInput('Bash', { command: 'ls -la' })).toBe('ls -la');
    expect(summarizeToolInput('run_shell', { cmd: 'echo hi' })).toBe('echo hi');
  });

  test('formatToolSummary matches run-card phrasing', () => {
    expect(formatToolSummary('Bash', { command: 'git status' }, 'running')).toBe('Running Bash(git status)');
    expect(formatToolSummary('Bash', { command: 'git status' }, 'done')).toBe('Ran Bash(git status)');
    expect(formatToolSummary('Bash', { command: 'git status' }, 'error')).toBe('Failed Bash(git status)');
  });

  test('formatDurationMs renders human durations', () => {
    expect(formatDurationMs(450)).toBe('450ms');
    expect(formatDurationMs(2400)).toBe('2.4s');
    expect(formatDurationMs(65_000)).toBe('1m 5s');
  });

  test('mergeToolResult updates the matching running card', () => {
    const messages: Array<{ toolActivity?: ToolActivity | null }> = [{
      toolActivity: {
        toolCallId: 'tc-1',
        toolName: 'Bash',
        status: 'running',
        startedAt: '2026-06-14T12:00:00.000Z',
      },
    }];
    const merged = mergeToolResult(messages, 'tc-1', 'ok', false, '2026-06-14T12:00:02.500Z');
    expect(merged).toBe(true);
    expect(messages[0]?.toolActivity?.status).toBe('done');
    expect(messages[0]?.toolActivity?.output).toBe('ok');
    expect(messages[0]?.toolActivity?.durationMs).toBe(2500);
  });
});
