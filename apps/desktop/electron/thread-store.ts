import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { defaultOttoDir } from './config-store';
import type { ConfigStore } from './config-store';
import type { ChatThreadRecord, ThreadListResult } from './shared/types';

export type { ChatThreadRecord, ThreadListResult };

type ThreadPatch = Partial<Pick<
  ChatThreadRecord,
  'title' | 'lettaConversationId' | 'agentId' | 'pinned' | 'archived' | 'sortOrder'
>>;

function threadsDir(): string {
  return join(defaultOttoDir(), 'threads');
}

function indexFile(): string {
  return join(threadsDir(), 'index.json');
}

function readIndex(): ChatThreadRecord[] {
  mkdirSync(threadsDir(), { recursive: true });
  const file = indexFile();
  if (!existsSync(file)) return [];
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as ChatThreadRecord[];
    if (!Array.isArray(parsed)) return [];
    const raw = parsed.filter((t) => typeof t?.id === 'string');
    const normalized = normalizeThreads(raw);
    if (JSON.stringify(normalized) !== JSON.stringify(raw)) writeIndex(normalized);
    return normalized;
  } catch {
    return [];
  }
}

function writeIndex(threads: ChatThreadRecord[]) {
  mkdirSync(threadsDir(), { recursive: true });
  writeFileSync(indexFile(), `${JSON.stringify(normalizeThreads(threads), null, 2)}\n`);
}

function sortableOrder(thread: ChatThreadRecord): number | null {
  return typeof thread.sortOrder === 'number' && Number.isFinite(thread.sortOrder)
    ? thread.sortOrder
    : null;
}

function sortThreads(threads: ChatThreadRecord[]): ChatThreadRecord[] {
  return [...threads].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const aOrder = sortableOrder(a);
    const bOrder = sortableOrder(b);
    if (aOrder !== null || bOrder !== null) {
      if (aOrder === null) return 1;
      if (bOrder === null) return -1;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

function nextSortOrder(threads: ChatThreadRecord[], pinned: boolean): number {
  const orders = threads
    .filter((thread) => !thread.archived && !!thread.pinned === pinned)
    .map(sortableOrder)
    .filter((value): value is number => value !== null);
  return orders.length ? Math.max(...orders) + 1 : 0;
}

function normalizeThreads(threads: ChatThreadRecord[]): ChatThreadRecord[] {
  const seen = new Set<string>();
  return sortThreads(threads).map((thread) => ({
    ...thread,
    lettaConversationId: normalizeConversationId(thread.lettaConversationId),
  })).filter((thread) => {
    if (isJunkThread(thread)) return false;
    if (seen.has(thread.id)) return false;
    seen.add(thread.id);
    return true;
  });
}

function normalizeConversationId(conversationId: string | null | undefined): string | null {
  const trimmed = conversationId?.trim();
  if (!trimmed || trimmed === 'default') return null;
  return trimmed;
}

function isJunkThread(thread: ChatThreadRecord): boolean {
  const title = thread.title.trim();
  if (/^046-debug-/i.test(title)) return true;
  if (/^046-(?:alpha|beta)-thread$/i.test(title)) return true;
  if (/^\d{3}-(?:rev\d+-|smoke-)?thread-[ab]-\d{12,14}$/i.test(title)) return true;
  return /^chat session$/i.test(title);
}

export class ThreadStore {
  constructor(private config: ConfigStore) {}

  list(includeArchived = false): ThreadListResult {
    const threads = sortThreads(readIndex()).filter((t) => includeArchived || !t.archived);
    const configuredActiveId = this.config.get().activeThreadId ?? null;
    const activeThreadId = configuredActiveId && threads.some((t) => t.id === configuredActiveId)
      ? configuredActiveId
      : threads[0]?.id ?? null;
    if (!includeArchived && configuredActiveId !== activeThreadId) {
      const active = threads.find((t) => t.id === activeThreadId) ?? null;
      this.config.update({
        activeThreadId,
        conversationId: normalizeConversationId(active?.lettaConversationId),
      });
    }
    return { dir: threadsDir(), activeThreadId, threads };
  }

  get(threadId: string): ChatThreadRecord | null {
    return readIndex().find((t) => t.id === threadId) ?? null;
  }

  create(input?: { title?: string; agentId?: string | null }): ChatThreadRecord {
    const now = new Date().toISOString();
    const thread: ChatThreadRecord = {
      id: `local_${randomUUID()}`,
      lettaConversationId: null,
      agentId: input?.agentId ?? this.config.agentId(),
      title: input?.title?.trim() || 'New chat',
      createdAt: now,
      updatedAt: now,
      sortOrder: null,
      pinned: false,
      archived: false,
    };
    const next = sortThreads([thread, ...readIndex()]);
    writeIndex(next);
    this.config.update({ activeThreadId: thread.id, conversationId: null });
    return thread;
  }

  switch(threadId: string): ChatThreadRecord {
    const thread = this.get(threadId);
    if (!thread) throw new Error(`Thread not found: ${threadId}`);
    if (thread.archived) throw new Error(`Thread is archived: ${threadId}`);
    this.config.update({
      activeThreadId: thread.id,
      conversationId: normalizeConversationId(thread.lettaConversationId),
    });
    return thread;
  }

  update(
    threadId: string,
    patch: ThreadPatch,
  ): ChatThreadRecord {
    const threads = readIndex();
    const idx = threads.findIndex((t) => t.id === threadId);
    if (idx < 0) throw new Error(`Thread not found: ${threadId}`);
    const wasPinned = !!threads[idx].pinned;
    const nextPinned = patch.pinned ?? wasPinned;
    const crossesGroups = patch.pinned !== undefined && patch.pinned !== wasPinned;
    const updated: ChatThreadRecord = {
      ...threads[idx],
      ...patch,
      lettaConversationId: patch.lettaConversationId !== undefined
        ? normalizeConversationId(patch.lettaConversationId)
        : normalizeConversationId(threads[idx].lettaConversationId),
      sortOrder: patch.sortOrder !== undefined
        ? patch.sortOrder
        : crossesGroups
          ? nextSortOrder(threads, nextPinned)
          : threads[idx].sortOrder ?? null,
      updatedAt: new Date().toISOString(),
    };
    threads[idx] = updated;
    writeIndex(sortThreads(threads));
    if (this.config.get().activeThreadId === threadId && patch.lettaConversationId !== undefined) {
      this.config.update({ conversationId: normalizeConversationId(patch.lettaConversationId) });
    }
    return updated;
  }

  archive(threadId: string): ChatThreadRecord {
    const archived = this.update(threadId, { archived: true, pinned: false });
    if (this.config.get().activeThreadId === threadId) {
      const next = sortThreads(readIndex()).find((t) => !t.archived) ?? null;
      this.config.update({
        activeThreadId: next?.id ?? null,
        conversationId: normalizeConversationId(next?.lettaConversationId),
      });
    }
    return archived;
  }

  restore(threadId: string): ChatThreadRecord {
    return this.update(threadId, { archived: false, pinned: false });
  }

  pin(threadId: string, pinned: boolean): ChatThreadRecord {
    return this.update(threadId, { pinned });
  }

  rename(threadId: string, title: string): ChatThreadRecord {
    const trimmed = title.trim().replace(/\s+/g, ' ');
    return this.update(threadId, { title: trimmed || 'New chat' });
  }

  move(threadId: string, targetId: string): ThreadListResult {
    if (threadId === targetId) return this.list();
    const threads = readIndex();
    const moving = threads.find((thread) => thread.id === threadId);
    const target = threads.find((thread) => thread.id === targetId);
    if (!moving || !target) throw new Error('Thread not found.');
    if (moving.archived || target.archived) throw new Error('Archived threads cannot be reordered.');

    const targetPinned = !!target.pinned;
    moving.pinned = targetPinned;
    moving.archived = false;

    const group = sortThreads(threads)
      .filter((thread) => !thread.archived && !!thread.pinned === targetPinned && thread.id !== threadId);
    const targetIndex = group.findIndex((thread) => thread.id === targetId);
    const orderedGroup = [...group];
    orderedGroup.splice(targetIndex < 0 ? orderedGroup.length : targetIndex, 0, moving);
    const now = new Date().toISOString();
    orderedGroup.forEach((thread, index) => {
      thread.sortOrder = index;
      if (thread.id === moving.id) thread.updatedAt = now;
    });

    writeIndex(threads);
    return this.list();
  }

  touchActive(input: { title?: string; lettaConversationId?: string | null; agentId?: string | null }) {
    const activeId = this.config.get().activeThreadId;
    if (!activeId) return null;
    const existing = this.get(activeId);
    if (!existing) return null;
    return this.update(activeId, {
      ...(input.title ? { title: input.title } : {}),
      ...(input.lettaConversationId !== undefined ? { lettaConversationId: input.lettaConversationId } : {}),
      ...(input.agentId !== undefined ? { agentId: input.agentId } : {}),
    });
  }

  ensureActiveThread(agentId?: string | null): ChatThreadRecord {
    const activeId = this.config.get().activeThreadId;
    if (activeId) {
      const existing = this.get(activeId);
      if (existing && !existing.archived) return existing;
    }
    const threads = sortThreads(readIndex()).filter((t) => !t.archived);
    if (threads.length > 0) {
      const picked = threads[0];
      this.config.update({
        activeThreadId: picked.id,
        conversationId: normalizeConversationId(picked.lettaConversationId),
      });
      return picked;
    }
    return this.create({ agentId: agentId ?? this.config.agentId() });
  }
}
