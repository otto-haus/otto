import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { defaultOttoDir } from './config-store';
import type { ConfigStore } from './config-store';
import type { ChatThreadRecord, ThreadListResult } from './shared/types';

export type { ChatThreadRecord, ThreadListResult };

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
    if (normalized.length !== raw.length) writeIndex(normalized);
    return normalized;
  } catch {
    return [];
  }
}

function writeIndex(threads: ChatThreadRecord[]) {
  mkdirSync(threadsDir(), { recursive: true });
  writeFileSync(indexFile(), `${JSON.stringify(normalizeThreads(threads), null, 2)}\n`);
}

function sortThreads(threads: ChatThreadRecord[]): ChatThreadRecord[] {
  return [...threads].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

function normalizeThreads(threads: ChatThreadRecord[]): ChatThreadRecord[] {
  const seen = new Set<string>();
  return sortThreads(threads).filter((thread) => {
    if (isJunkThread(thread)) return false;
    if (seen.has(thread.id)) return false;
    seen.add(thread.id);
    return true;
  });
}

function isJunkThread(thread: ChatThreadRecord): boolean {
  const title = thread.title.trim();
  if (/^046-debug-/i.test(title)) return true;
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
        conversationId: active?.lettaConversationId ?? null,
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
      conversationId: thread.lettaConversationId,
    });
    return thread;
  }

  update(
    threadId: string,
    patch: Partial<Pick<ChatThreadRecord, 'title' | 'lettaConversationId' | 'agentId' | 'pinned' | 'archived'>>,
  ): ChatThreadRecord {
    const threads = readIndex();
    const idx = threads.findIndex((t) => t.id === threadId);
    if (idx < 0) throw new Error(`Thread not found: ${threadId}`);
    const updated: ChatThreadRecord = {
      ...threads[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    threads[idx] = updated;
    writeIndex(sortThreads(threads));
    if (this.config.get().activeThreadId === threadId && patch.lettaConversationId !== undefined) {
      this.config.update({ conversationId: patch.lettaConversationId });
    }
    return updated;
  }

  archive(threadId: string): ChatThreadRecord {
    const archived = this.update(threadId, { archived: true, pinned: false });
    if (this.config.get().activeThreadId === threadId) {
      const next = sortThreads(readIndex()).find((t) => !t.archived) ?? null;
      this.config.update({
        activeThreadId: next?.id ?? null,
        conversationId: next?.lettaConversationId ?? null,
      });
    }
    return archived;
  }

  pin(threadId: string, pinned: boolean): ChatThreadRecord {
    return this.update(threadId, { pinned });
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
        conversationId: picked.lettaConversationId,
      });
      return picked;
    }
    return this.create({ agentId: agentId ?? this.config.agentId() });
  }
}
