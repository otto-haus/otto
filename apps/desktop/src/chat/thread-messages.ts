import { flushMessages, readStoredMessages, type StoredChatMsg } from './message-storage';

export type ThreadChatMsg = StoredChatMsg;

/** Persist the active thread without switching views (e.g. before create). */
export function persistActiveThread(
  cache: Map<string, ThreadChatMsg[]>,
  threadId: string | null,
  messages: ThreadChatMsg[],
): void {
  if (!threadId) return;
  cache.set(threadId, messages);
  flushMessages(threadId, messages);
}

/** Persist the thread we are leaving before loading another thread's history. */
export function persistLeavingThread(
  cache: Map<string, ThreadChatMsg[]>,
  leaving: string | null,
  nextThreadId: string,
  messages: ThreadChatMsg[],
): void {
  if (!leaving || leaving === nextThreadId) return;
  cache.set(leaving, messages);
  flushMessages(leaving, messages);
}

/** Load a thread view from disk so reload/switch never reuse a stale in-memory cache. */
export function loadThreadMessagesForView(
  threadId: string | null,
  cache: Map<string, ThreadChatMsg[]>,
  opts: { allowLegacyFallback?: boolean } = {},
): ThreadChatMsg[] {
  if (!threadId) return [];
  const loaded = readStoredMessages(threadId, opts);
  cache.set(threadId, loaded);
  return loaded;
}

/** Active send/event path: prefer in-memory cache, fall back to disk. */
export function loadThreadMessages(
  threadId: string | null,
  cache: Map<string, ThreadChatMsg[]>,
  opts: { allowLegacyFallback?: boolean } = {},
): ThreadChatMsg[] {
  if (!threadId) return [];
  const cached = cache.get(threadId);
  if (cached) return cached;
  return loadThreadMessagesForView(threadId, cache, opts);
}
