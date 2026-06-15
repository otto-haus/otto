/** Per-thread localStorage keys for chat history (046). */
export const LEGACY_MESSAGES_KEY = 'otto.chat.messages.v1';
const MAX_RESTORED_MESSAGES = 12;
const MAX_RESTORED_TEXT_CHARS = 1000;
const MAX_RESTORED_THREAD_CHARS = 6000;
/** Reject only pathological localStorage payloads; bounded restore stays in parseMessages(). */
const MAX_PARSEABLE_HISTORY_CHARS = 1_000_000;

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
    const restored: StoredChatMsg[] = [];
    let restoredChars = 0;
    for (const m of parsed.slice(-MAX_RESTORED_MESSAGES).reverse()) {
      if (
        typeof m?.id !== 'string'
        || typeof m.text !== 'string'
        || (m.who !== 'user' && m.who !== 'otto' && m.who !== 'error')
      ) continue;
      if (restoredChars >= MAX_RESTORED_THREAD_CHARS) break;
      const text = m.text.length > MAX_RESTORED_TEXT_CHARS
        ? `${m.text.slice(0, MAX_RESTORED_TEXT_CHARS)}\n\n[Older local message truncated for renderer safety.]`
        : m.text;
      restoredChars += text.length;
      restored.push({ ...m, text });
    }
    return restored.reverse()
      .filter((m) => typeof m?.id === 'string' && typeof m.text === 'string' && (m.who === 'user' || m.who === 'otto' || m.who === 'error'))
      .slice(-MAX_RESTORED_MESSAGES);
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
    if (raw && raw.length > MAX_PARSEABLE_HISTORY_CHARS) {
      return [{
        id: `history-suppressed-${threadId ?? 'legacy'}`,
        who: 'otto',
        text: `Local chat history is hidden because it is too large to restore safely at startup (${Math.round(raw.length / 1000)}k chars). New messages will still work.`,
      }];
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
