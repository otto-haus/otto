import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { ThreadStore } from './thread-store';

function mockConfig(dir: string): ConfigStore {
  process.env.OTTO_HOME = dir;
  return new ConfigStore();
}

describe('ThreadStore', () => {
  test('create and list threads without erasing prior entries', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const first = store.create({ title: 'First thread' });
      const second = store.create({ title: 'Second thread' });
      const list = store.list();
      expect(list.threads.length).toBe(2);
      expect(list.threads.some((t) => t.id === first.id)).toBe(true);
      expect(list.threads.some((t) => t.id === second.id)).toBe(true);
      expect(list.activeThreadId).toBe(second.id);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('switch restores stored conversation id in config', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const thread = store.create({ title: 'Resume me' });
      store.update(thread.id, { lettaConversationId: 'conv-abc' });
      store.create({ title: 'Other' });
      const switched = store.switch(thread.id);
      expect(switched.lettaConversationId).toBe('conv-abc');
      expect(config.get().conversationId).toBe('conv-abc');
      expect(config.get().activeThreadId).toBe(thread.id);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('persists thread index across store reload', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      store.create({ title: 'Persist A' });
      const second = store.create({ title: 'Persist B' });
      const reloaded = new ThreadStore(new ConfigStore());
      const list = reloaded.list();
      expect(list.threads.length).toBe(2);
      expect(list.activeThreadId).toBe(second.id);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('archived threads hidden from default list', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const thread = store.create({ title: 'Archive me' });
      store.archive(thread.id);
      const list = store.list(false);
      expect(list.threads.some((t) => t.id === thread.id)).toBe(false);
      const all = store.list(true);
      expect(all.threads.some((t) => t.id === thread.id)).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('ensureActiveThread reuses latest thread when config active id is stale', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      store.create({ title: 'First' });
      const second = store.create({ title: 'Second' });
      config.update({ activeThreadId: 'local_missing_thread' });
      const ensured = store.ensureActiveThread('agent-smoke');
      expect(ensured.id).toBe(second.id);
      expect(config.get().activeThreadId).toBe(second.id);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('touchActive does not spawn a new thread when active id is missing from index', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      store.create({ title: 'Only thread' });
      config.update({ activeThreadId: 'local_stale' });
      const touched = store.touchActive({ title: 'Should not create' });
      expect(touched).toBeNull();
      expect(store.list().threads.length).toBe(1);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });
});
