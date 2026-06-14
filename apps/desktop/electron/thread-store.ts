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
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t?.id === 'string') : [];
  } catch {
    return [];
  }
}

function writeIndex(threads: ChatThreadRecord[]) {
  mkdirSync(threadsDir(), { recursive: true });
  writeFileSync(indexFile(), `${JSON.stringify(threads, null, 2)}\n`);
}

function sortThreads(threads: ChatThreadRecord[]): ChatThreadRecord[] {
  return [...threads].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

export class ThreadStore {
  constructor(private config: ConfigStore) {}

  list(includeArchived = false): ThreadListResult {
    const threads = sortThreads(readIndex()).filter((t) => includeArchived || !t.archived);
    const activeThreadId = this.config.get().activeThreadId ?? threads[0]?.id ?? null;
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
    return this.update(threadId, { archived: true, pinned: false });
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
      if (existing) return existing;
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
