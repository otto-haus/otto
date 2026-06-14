import { describe, expect, test } from 'bun:test';
import { PermissionSessionStore } from './permission-session-store';

describe('PermissionSessionStore', () => {
  test('allow and isAllowed for tool name', () => {
    const store = new PermissionSessionStore();
    expect(store.isAllowed('run_shell')).toBe(false);
    store.allow('run_shell');
    expect(store.isAllowed('run_shell')).toBe(true);
    expect(store.isAllowed('other_tool')).toBe(false);
  });

  test('clear removes session allows', () => {
    const store = new PermissionSessionStore();
    store.allow('read_file');
    store.clear();
    expect(store.isAllowed('read_file')).toBe(false);
    expect(store.list()).toEqual([]);
  });
});
