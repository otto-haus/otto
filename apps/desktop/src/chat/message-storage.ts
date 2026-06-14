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

export function readStoredMessages(
  threadId: string | null,
  opts: { allowLegacyFallback?: boolean; storage?: Pick<Storage, 'getItem'> } = {},
): StoredChatMsg[] {
  try {
    const storage = opts.storage ?? localStorage;
    const key = messagesKey(threadId);
    let raw = storage.getItem(key);
    if (!raw && opts.allowLegacyFallback && threadId && key !== LEGACY_MESSAGES_KEY) {
      raw = storage.getItem(LEGACY_MESSAGES_KEY);
    }
    if (!raw && !threadId) {
      raw = storage.getItem(LEGACY_MESSAGES_KEY);
    }
    return parseMessages(raw);
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
