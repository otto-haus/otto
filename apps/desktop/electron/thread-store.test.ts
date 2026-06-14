import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { ThreadStore } from './thread-store';
import type { ChatThreadRecord } from './thread-store';

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

  test('archiving a pinned thread unpins and hides it', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const thread = store.create({ title: 'Pinned archive' });
      store.pin(thread.id, true);

      const archived = store.archive(thread.id);

      expect(archived.archived).toBe(true);
      expect(archived.pinned).toBe(false);
      expect(store.list(false).threads.some((t) => t.id === thread.id)).toBe(false);
      expect(store.list(true).threads.find((t) => t.id === thread.id)).toMatchObject({
        archived: true,
        pinned: false,
      });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('archiving the active thread moves config to the next visible thread', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const first = store.create({ title: 'Keep me' });
      const second = store.create({ title: 'Archive active' });

      store.archive(second.id);

      expect(config.get().activeThreadId).toBe(first.id);
      expect(config.get().conversationId).toBe(first.lettaConversationId);
      const list = store.list(false);
      expect(list.activeThreadId).toBe(first.id);
      expect(list.threads.map((thread) => thread.id)).toEqual([first.id]);
      expect(store.list(true).threads.some((thread) => thread.id === second.id && thread.archived)).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('archiving the only active thread clears active config', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const thread = store.create({ title: 'Only thread' });

      store.archive(thread.id);

      expect(config.get().activeThreadId).toBeNull();
      expect(config.get().conversationId).toBeNull();
      expect(store.list(false).activeThreadId).toBeNull();
      expect(store.list(false).threads).toEqual([]);
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

  test('ensureActiveThread skips an archived active id', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const first = store.create({ title: 'Visible' });
      const archived = store.create({ title: 'Archived' });
      store.archive(archived.id);
      config.update({ activeThreadId: archived.id, conversationId: 'archived-conv' });

      const ensured = store.ensureActiveThread('agent-smoke');

      expect(ensured.id).toBe(first.id);
      expect(config.get().activeThreadId).toBe(first.id);
      expect(config.get().conversationId).toBe(first.lettaConversationId);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('purges smoke and placeholder chat-session rows from recents', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const threadsPath = join(tmp, 'threads');
      const indexPath = join(threadsPath, 'index.json');
      const now = '2026-06-14T00:00:00.000Z';
      const row = (id: string, title: string): ChatThreadRecord => ({
        id,
        lettaConversationId: null,
        agentId: 'agent-a',
        title,
        createdAt: now,
        updatedAt: now,
        pinned: false,
        archived: false,
      });

      mkdirSync(threadsPath, { recursive: true });
      writeFileSync(indexPath, `${JSON.stringify([
        row('local_keep', 'hi how are you?'),
        row('local_chat_session', 'Chat session'),
        row('local_debug', '046-debug-1781425936940'),
        row('local_alpha', '046-alpha-thread'),
        row('local_beta', '046-beta-thread'),
      ], null, 2)}\n`);
      config.update({ activeThreadId: 'local_chat_session', conversationId: 'stale-conv' });

      const store = new ThreadStore(config);
      const list = store.list();

      expect(list.threads.map((thread) => thread.title)).toEqual(['hi how are you?']);
      expect(list.activeThreadId).toBe('local_keep');
      expect(config.get().conversationId).toBeNull();
      const persisted = JSON.parse(readFileSync(indexPath, 'utf8')) as ChatThreadRecord[];
      expect(persisted.map((thread) => thread.id)).toEqual(['local_keep']);
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

  test('normalizes duplicate thread ids before mutating the index', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const threadsPath = join(tmp, 'threads');
      const indexPath = join(threadsPath, 'index.json');
      const oldDuplicate: ChatThreadRecord = {
        id: 'local_duplicate',
        lettaConversationId: null,
        agentId: 'agent-a',
        title: 'Old duplicate',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        pinned: false,
        archived: false,
      };
      const canonical: ChatThreadRecord = {
        ...oldDuplicate,
        title: 'Canonical duplicate',
        updatedAt: '2026-02-01T00:00:00.000Z',
      };

      mkdirSync(threadsPath, { recursive: true });
      writeFileSync(indexPath, `${JSON.stringify([oldDuplicate, canonical], null, 2)}\n`);

      const store = new ThreadStore(config);
      expect(store.list(true).threads.map((thread) => thread.title)).toEqual(['Canonical duplicate']);

      const updated = store.pin('local_duplicate', true);
      const persisted = JSON.parse(readFileSync(indexPath, 'utf8')) as ChatThreadRecord[];

      expect(updated.title).toBe('Canonical duplicate');
      expect(persisted).toHaveLength(1);
      expect(persisted[0]).toMatchObject({ id: 'local_duplicate', title: 'Canonical duplicate', pinned: true });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('pinned manual order survives later touches', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const first = store.create({ title: 'First pinned' });
      const second = store.create({ title: 'Second pinned' });
      store.pin(first.id, true);
      store.pin(second.id, true);

      store.move(second.id, first.id);
      store.switch(first.id);
      store.touchActive({ title: 'First pinned updated' });

      expect(store.list().threads.filter((t) => t.pinned).map((t) => t.id)).toEqual([second.id, first.id]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('new chat stays above manually ordered recents', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const first = store.create({ title: 'First recent' });
      const second = store.create({ title: 'Second recent' });
      store.move(second.id, first.id);

      const created = store.create({ title: 'Brand new chat' });
      const recents = store.list().threads.filter((thread) => !thread.pinned && !thread.archived);

      expect(recents[0]?.id).toBe(created.id);
      expect(typeof created.sortOrder).toBe('number');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('rename persists a cleaned conversation title', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-thread-test-'));
    try {
      const config = mockConfig(tmp);
      const store = new ThreadStore(config);
      const thread = store.create({ title: 'New chat' });

      const renamed = store.rename(thread.id, '  Project   notes  ');
      const reloaded = new ThreadStore(new ConfigStore()).get(thread.id);

      expect(renamed.title).toBe('Project notes');
      expect(reloaded?.title).toBe('Project notes');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });
});
