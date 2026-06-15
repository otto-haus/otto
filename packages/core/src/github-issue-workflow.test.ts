import { describe, expect, test } from 'bun:test';
import {
  buildDisposableIssuePacket,
  countPriorityLabels,
  formatWorkflowFailures,
  validateGitHubIssueWorkflowPacket,
  validatePublicSafeIssueBody,
} from './github-issue-workflow.js';

describe('github issue workflow packet', () => {
  test('accepts a valid disposable packet', () => {
    const packet = buildDisposableIssuePacket('test-run');
    const result = validateGitHubIssueWorkflowPacket(packet);
    expect(result.ok).toBe(true);
    expect(countPriorityLabels(packet.labels)).toBe(1);
  });

  test('rejects missing priority label with actionable failure', () => {
    const result = validateGitHubIssueWorkflowPacket({
      title: 'Missing label',
      body: '## Problem\nx\n\n## Acceptance criteria\n- [ ] y',
      labels: ['enhancement'],
      projectStatus: 'Backlog',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures[0]?.capability).toBe('priority label');
      expect(result.failures[0]?.nextAction).toContain('exactly one');
    }
  });

  test('rejects duplicate priority labels', () => {
    const result = validateGitHubIssueWorkflowPacket({
      title: 'Duplicate labels',
      body: '## Problem\nx\n\n## Acceptance criteria\n- [ ] y',
      labels: ['p1', 'p2'],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures.some((item) => item.capability === 'priority label')).toBe(true);
    }
  });

  test('rejects secret-like body content', () => {
    const failures = validatePublicSafeIssueBody('token: ghp_abcdefghijklmnopqrstuvwxyz123456');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.capability).toBe('public-safe issue body');
  });

  test('formats failures for smoke output', () => {
    const text = formatWorkflowFailures([
      {
        capability: 'priority label',
        message: 'Issue packet has no p-label.',
        nextAction: 'Add exactly one of p0, p1, p2, or p3.',
      },
    ]);
    expect(text).toContain('[priority label]');
    expect(text).toContain('Next:');
  });
});
