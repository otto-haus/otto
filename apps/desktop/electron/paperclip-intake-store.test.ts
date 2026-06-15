import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AutonomyStore } from './autonomy-store';
import { PaperclipIntakeStore, resolvePaperclipDir } from './paperclip-intake-store';

describe('PaperclipIntakeStore', () => {
  let testHome = '';

  beforeEach(() => {
    testHome = mkdtempSync(join(tmpdir(), 'otto-paperclip-intake-'));
    process.env.OTTO_HOME = testHome;
  });

  afterEach(() => {
    if (testHome) rmSync(testHome, { recursive: true, force: true });
    delete process.env.OTTO_HOME;
    delete process.env.OTTO_PAPERCLIP_EXPORT;
  });

  test('snapshot is not_connected with honest empty rows', () => {
    const store = new PaperclipIntakeStore(new AutonomyStore());
    const snap = store.snapshot();
    expect(snap.connection).toBe('not_connected');
    expect(snap.enabled).toBe(false);
    expect(snap.activeTasks).toEqual([]);
    expect(snap.blockedTasks).toEqual([]);
    expect(snap.recentArtifacts).toEqual([]);
  });

  test('connect requires approval until explicitly approved', () => {
    const store = new PaperclipIntakeStore(new AutonomyStore());
    const blocked = store.connect();
    expect(blocked.ok).toBe(false);
    expect(blocked.needsApproval).toBe(true);
    expect(store.snapshot().connection).toBe('not_connected');

    const connected = store.connect({ approved: true, baseUrl: 'https://paperclip.example' });
    expect(connected.ok).toBe(true);
    expect(store.snapshot().connection).toBe('connected');
    expect(store.snapshot().sourceBaseUrl).toBe('https://paperclip.example');
  });

  test('sync imports real rows from export.json without mock data', () => {
    const store = new PaperclipIntakeStore(new AutonomyStore());
    store.connect({ approved: true });

    const dir = resolvePaperclipDir();
    const exportPath = join(dir, 'export.json');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      exportPath,
      JSON.stringify({
        work_state: {
          active: [{ id: 'pc-1', title: 'Ship intake', status: 'running', url: 'https://paperclip.example/tasks/pc-1' }],
          blocked: [{ id: 'pc-2', title: 'Blocked task', status: 'blocked', url: 'https://paperclip.example/tasks/pc-2' }],
          artifacts: [{ id: 'art-1', label: 'Run log', url: 'https://paperclip.example/artifacts/art-1' }],
        },
      }),
    );

    const result = store.sync();
    expect(result.ok).toBe(true);
    const snap = store.snapshot();
    expect(snap.activeTasks).toHaveLength(1);
    expect(snap.blockedTasks).toHaveLength(1);
    expect(snap.recentArtifacts).toHaveLength(1);
    expect(snap.activeTasks[0]?.title).toBe('Ship intake');
    expect(existsSync(join(dir, 'last-sync.json'))).toBe(true);
  });

  test('sync surfaces parse errors without fabricating rows', () => {
    const store = new PaperclipIntakeStore(new AutonomyStore());
    store.connect({ approved: true });

    writeFileSync(join(resolvePaperclipDir(), 'export.json'), '{not-json');
    const result = store.sync();
    expect(result.ok).toBe(false);
    expect(store.snapshot().connection).toBe('sync_error');
    expect(store.snapshot().activeTasks).toEqual([]);
  });
});
