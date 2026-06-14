/** Per-thread localStorage keys for chat history (046). */
export const LEGACY_MESSAGES_KEY = 'otto.chat.messages.v1';

export type StoredChatMsg = {
  id: string;
  who: 'user' | 'otto' | 'error';
  text: string;
  streamId?: string;
};

export function messagesKey(threadId: string | null): string {
  return threadId ? `otto.chat.messages.${threadId}.v1` : LEGACY_MESSAGES_KEY;
}

function parseMessages(raw: string | null): StoredChatMsg[] {
  try {
    const parsed = JSON.parse(raw ?? '[]') as StoredChatMsg[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => typeof m?.id === 'string' && typeof m.text === 'string' && (m.who === 'user' || m.who === 'otto' || m.who === 'error'))
      .slice(-200);
  } catch {
    return [];
  }
}

/** One-time: attach pre-046 history to the first active thread only. */
export function migrateLegacyMessagesToThread(threadId: string | null): void {
  if (!threadId) return;
  const key = messagesKey(threadId);
  try {
    if (localStorage.getItem(key)) return;
    const legacy = localStorage.getItem(LEGACY_MESSAGES_KEY);
    if (!legacy) return;
    localStorage.setItem(key, legacy);
  } catch {
    /* best effort */
  }
}

export function readStoredMessages(threadId: string | null): StoredChatMsg[] {
  try {
    const key = messagesKey(threadId);
    const raw = localStorage.getItem(key);
    if (raw) return parseMessages(raw);
    if (!threadId) return parseMessages(localStorage.getItem(LEGACY_MESSAGES_KEY));
    return [];
  } catch {
    return [];
  }
}

export function flushMessages(threadId: string | null, msgs: StoredChatMsg[]): void {
  try {
    localStorage.setItem(messagesKey(threadId), JSON.stringify(msgs.slice(-200)));
  } catch {
    /* best effort */
  }
}
