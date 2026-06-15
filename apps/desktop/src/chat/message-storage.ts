/** Per-thread localStorage keys for chat history (046). */
import type { TurnTrail } from './turn-trail';

export const LEGACY_MESSAGES_KEY = 'otto.chat.messages.v1';
export const MAX_RESTORED_MESSAGES = 12;
export const MAX_RESTORED_TEXT_CHARS = 1000;
const MAX_RESTORED_THREAD_CHARS = 6000;
/** Reject only pathological localStorage payloads; bounded restore stays in parseMessages(). */
const MAX_PARSEABLE_HISTORY_CHARS = 1_000_000;
/** Legacy inline suffix from pre-metadata truncation; stripped on read for older sessions. */
export const LEGACY_RESTORED_TRUNCATION_SUFFIX =
  '\n\n[Older local message truncated for renderer safety.]';

export type StoredChatMsg = {
  id: string;
  who: 'user' | 'otto' | 'error';
  text: string;
  details?: string;
  streamId?: string;
  trail?: TurnTrail;
  /** Present when startup restore shortened text for renderer safety. */
  truncated?: boolean;
  /** Original character count before restore shortening. */
  truncatedFromLength?: number;
};

export function messagesKey(threadId: string | null): string {
  return threadId ? `otto.chat.messages.${threadId}.v1` : LEGACY_MESSAGES_KEY;
}

function isStoredChatMsg(m: unknown): m is StoredChatMsg {
  return !!m
    && typeof (m as StoredChatMsg).id === 'string'
    && typeof (m as StoredChatMsg).text === 'string'
    && ((m as StoredChatMsg).who === 'user'
      || (m as StoredChatMsg).who === 'otto'
      || (m as StoredChatMsg).who === 'error');
}

function readRawMessageArray(
  raw: string | null,
): StoredChatMsg[] | null {
  if (!raw || raw.length > MAX_PARSEABLE_HISTORY_CHARS) return null;
  try {
    const parsed = JSON.parse(raw) as StoredChatMsg[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isStoredChatMsg);
  } catch {
    return null;
  }
}

function stripLegacyTruncationSuffix(text: string): string {
  return text.endsWith(LEGACY_RESTORED_TRUNCATION_SUFFIX)
    ? text.slice(0, -LEGACY_RESTORED_TRUNCATION_SUFFIX.length)
    : text;
}

function parseMessages(raw: string | null): StoredChatMsg[] {
  const parsed = readRawMessageArray(raw);
  if (!parsed) return [];
  const restored: StoredChatMsg[] = [];
  let restoredChars = 0;
  for (const m of parsed.slice(-MAX_RESTORED_MESSAGES).reverse()) {
    if (restoredChars >= MAX_RESTORED_THREAD_CHARS) break;
    const fullText = stripLegacyTruncationSuffix(m.text);
    const truncated = fullText.length > MAX_RESTORED_TEXT_CHARS;
    const text = truncated ? fullText.slice(0, MAX_RESTORED_TEXT_CHARS) : fullText;
    restoredChars += text.length;
    restored.push({
      ...m,
      text,
      ...(truncated
        ? { truncated: true, truncatedFromLength: fullText.length }
        : { truncated: undefined, truncatedFromLength: undefined }),
    });
  }
  return restored.reverse().slice(-MAX_RESTORED_MESSAGES);
}

export function readStoredMessageFullText(
  threadId: string | null,
  messageId: string,
  opts: { allowLegacyFallback?: boolean; storage?: Pick<Storage, 'getItem'> } = {},
): string | null {
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
    const parsed = readRawMessageArray(raw);
    if (!parsed) return null;
    const match = parsed.find((m) => m.id === messageId);
    return match ? stripLegacyTruncationSuffix(match.text) : null;
  } catch {
    return null;
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
        text: `This thread's saved history is too large to open safely. New messages will still work — older turns stay on disk until you export or clear history.`,
      }];
    }
    return parseMessages(raw);
  } catch {
    return [];
  }
}

export function flushMessages(threadId: string | null, msgs: StoredChatMsg[]): void {
  try {
    const key = messagesKey(threadId);
    const existing = readRawMessageArray(localStorage.getItem(key));
    const existingById = new Map(existing?.map((m) => [m.id, m]) ?? []);
    const toSave = msgs.slice(-200).map((m) => {
      const prior = existingById.get(m.id);
      const { truncated, truncatedFromLength, ...rest } = m;
      if (prior && prior.text.length > rest.text.length) {
        return { ...rest, text: stripLegacyTruncationSuffix(prior.text) };
      }
      return rest;
    });
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    /* best effort */
  }
}
