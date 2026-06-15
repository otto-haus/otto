import { describe, expect, test } from 'bun:test';
import { PermissionLogStore, permissionRiskForTool } from './permission-log-store';

describe('permissionRiskForTool', () => {
  test('flags high-risk tool names', () => {
    expect(permissionRiskForTool('send_email')).toBe('high');
    expect(permissionRiskForTool('Bash')).toBe('medium');
    expect(permissionRiskForTool('Read')).toBe('low');
  });
});

describe('PermissionLogStore', () => {
  test('records pending then decision for the same request', () => {
    const store = new PermissionLogStore();
    store.recordPending({
      requestId: 'r1',
      toolName: 'Write',
      toolInput: { path: '/tmp/x' },
      interactive: false,
    });
    store.recordDecision('r1', 'Write', 'allow-once');
    const recent = store.recent();
    expect(recent).toHaveLength(1);
    expect(recent[0]?.status).toBe('allow-once');
  });
});
