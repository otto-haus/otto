import { flushMessages, readStoredMessages, type StoredChatMsg } from './message-storage';

export type ThreadChatMsg = StoredChatMsg;

/** Never flush a stale empty in-memory view over non-empty disk history (046 rev10). */
function resolveThreadMessagesForPersist(
  threadId: string,
  messages: ThreadChatMsg[],
  cache: Map<string, ThreadChatMsg[]>,
): ThreadChatMsg[] {
  if (messages.length > 0) return messages;
  const cached = cache.get(threadId);
  if (cached && cached.length > 0) return cached;
  return readStoredMessages(threadId);
}

/** Persist the active thread without switching views (e.g. before create). */
export function persistActiveThread(
  cache: Map<string, ThreadChatMsg[]>,
  threadId: string | null,
  messages: ThreadChatMsg[],
): void {
  if (!threadId) return;
  const resolved = resolveThreadMessagesForPersist(threadId, messages, cache);
  cache.set(threadId, resolved);
  flushMessages(threadId, resolved);
}

/** Persist the thread we are leaving before loading another thread's history. */
export function persistLeavingThread(
  cache: Map<string, ThreadChatMsg[]>,
  leaving: string | null,
  nextThreadId: string,
  messages: ThreadChatMsg[],
): void {
  if (!leaving || leaving === nextThreadId) return;
  const resolved = resolveThreadMessagesForPersist(leaving, messages, cache);
  cache.set(leaving, resolved);
  flushMessages(leaving, resolved);
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
