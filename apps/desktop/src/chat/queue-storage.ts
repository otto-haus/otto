export type QueueState = 'queued' | 'sending' | 'failed';
export type QueueItem = { id: string; text: string; createdAt: number; state: QueueState; threadId?: string | null };
export type QueueDisplayItem = QueueItem & { isNext: boolean; sendPosition: number | null };

export const QUEUE_KEY = 'otto.chat.queue.v3';
export const LEGACY_QUEUE_V2_KEY = 'otto.chat.queue.v2';
export const LEGACY_QUEUE_KEY = 'otto.chat.queue.v1';
export const INFLIGHT_KEY = 'otto.chat.inflight.v1';

const SMOKE_QUEUE_TEXT = /\b\d{3}-(?:rev\d+-|smoke-)?thread-[ab]-\d{12,14}\b/i;
const MAX_QUEUE_ITEMS = 12;
const FAILED_TTL_MS = 1000 * 60 * 60 * 24;
export const INFLIGHT_STALE_MS = 1000 * 60 * 10;
let fallbackQueueIdSequence = 0;

export const isSmokeQueueText = (text: string): boolean => SMOKE_QUEUE_TEXT.test(text.trim());

export const previewQueueText = (text: string): string => {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Empty message';
  if (isSmokeQueueText(trimmed)) return 'Automated smoke message';
  return trimmed.length > 96 ? `${trimmed.slice(0, 96)}…` : trimmed;
};

export const normalizeQueueText = (text: string): string => text.trim().replace(/\s+/g, ' ');

export const hasDuplicateQueueText = (
  items: QueueItem[],
  threadId: string | null | undefined,
  text: string,
  inFlight: QueueItem | null = readInFlight(),
): boolean => {
  const key = normalizeQueueText(text);
  if (!key) return true;
  if (inFlight && queueMatchesThread(inFlight, threadId) && normalizeQueueText(inFlight.text) === key) {
    return true;
  }
  return items.some(
    (item) =>
      queueMatchesThread(item, threadId)
      && (item.state === 'queued' || item.state === 'sending')
      && normalizeQueueText(item.text) === key,
  );
};

export const createQueueItem = (text: string, state: QueueState = 'queued', threadId: string | null = null): QueueItem => {
  const id = globalThis.crypto?.randomUUID?.() ?? `queue-${Date.now()}-${fallbackQueueIdSequence += 1}`;
  return { id, text, createdAt: Date.now(), state, threadId };
};

export const queueMatchesThread = (item: QueueItem, threadId: string | null | undefined): boolean =>
  item.threadId == null || (!!threadId && item.threadId === threadId);

export const nextQueueItemForThread = (
  items: QueueItem[],
  threadId: string | null | undefined,
): QueueItem | undefined => items.find((item) => item.state === 'queued' && queueMatchesThread(item, threadId));

export const queueDisplayItemsForThread = (
  items: QueueItem[],
  threadId: string | null | undefined,
): QueueDisplayItem[] => {
  let sendPosition = 0;
  return items
    .filter((item) => queueMatchesThread(item, threadId))
    .map((item) => {
      if (item.state !== 'queued') return { ...item, isNext: false, sendPosition: null };
      sendPosition += 1;
      return { ...item, isNext: sendPosition === 1, sendPosition };
    });
};

export const retryFailedQueueItemsForThread = (
  items: QueueItem[],
  threadId: string | null | undefined,
  id?: string,
): QueueItem[] => {
  const kept: QueueItem[] = [];
  const retried: QueueItem[] = [];

  for (const item of items) {
    const shouldRetry = item.state === 'failed'
      && queueMatchesThread(item, threadId)
      && (!id || item.id === id);

    if (shouldRetry) retried.push({ ...item, state: 'queued' });
    else kept.push(item);
  }

  return [...kept, ...retried];
};

const dedupeQueue = (items: Array<QueueItem | null>): QueueItem[] => {
  const out: QueueItem[] = [];
  for (const item of items) {
    if (item && !out.some((x) => x.id === item.id)) out.push(item);
  }
  return out;
};

export const sanitizeQueue = (items: QueueItem[]): QueueItem[] => {
  const now = Date.now();
  const cleaned = items.filter((item) => {
    if (isSmokeQueueText(item.text)) return false;
    if (item.state === 'failed' && now - item.createdAt > FAILED_TTL_MS) return false;
    return true;
  });

  if (!cleaned.length) return [];

  const queued = cleaned.filter((item) => item.state === 'queued');
  const failed = cleaned
    .filter((item) => item.state === 'failed')
    .sort((a, b) => b.createdAt - a.createdAt);

  return [...queued, ...failed].slice(0, MAX_QUEUE_ITEMS);
};

export const readInFlight = (): QueueItem | null => {
  try {
    const item = JSON.parse(localStorage.getItem(INFLIGHT_KEY) ?? 'null') as QueueItem | null;
    if (!item || typeof item.id !== 'string' || typeof item.text !== 'string') return null;
    const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now();
    if (Date.now() - createdAt > INFLIGHT_STALE_MS) {
      localStorage.removeItem(INFLIGHT_KEY);
      return null;
    }
    return {
      id: item.id,
      text: item.text,
      createdAt,
      state: 'queued',
      threadId: typeof item.threadId === 'string' ? item.threadId : null,
    };
  } catch {
    return null;
  }
};

const parseStoredQueue = (raw: string | null): QueueItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QueueItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is QueueItem => typeof item?.id === 'string' && typeof item.text === 'string')
      .filter((item) => item.state !== 'sending')
      .map((item) => ({
        id: item.id,
        text: item.text,
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        state: item.state === 'failed' ? 'failed' : 'queued',
        threadId: typeof item.threadId === 'string' ? item.threadId : null,
      }));
  } catch {
    return [];
  }
};

export const readQueue = (): QueueItem[] => {
  try {
    const legacyV2Raw = localStorage.getItem(LEGACY_QUEUE_V2_KEY);
    const legacyV1Raw = localStorage.getItem(LEGACY_QUEUE_KEY);
    const currentRaw = localStorage.getItem(QUEUE_KEY);
    const current = parseStoredQueue(currentRaw);
    const legacy = [
      ...parseStoredQueue(legacyV2Raw),
      ...parseStoredQueue(legacyV1Raw),
    ];
    const items = sanitizeQueue(
      dedupeQueue([
        ...current,
        ...legacy,
        readInFlight(),
      ]),
    );

    if (legacyV2Raw) localStorage.removeItem(LEGACY_QUEUE_V2_KEY);
    if (legacyV1Raw) localStorage.removeItem(LEGACY_QUEUE_KEY);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));

    return items;
  } catch {
    return [];
  }
};

export const persistInFlight = (item: QueueItem | null) => {
  try {
    if (item) localStorage.setItem(INFLIGHT_KEY, JSON.stringify(item));
    else localStorage.removeItem(INFLIGHT_KEY);
  } catch { /* best effort */ }
};

export const clearInFlight = (id: string) => {
  try {
    const item = JSON.parse(localStorage.getItem(INFLIGHT_KEY) ?? 'null') as QueueItem | null;
    if (item?.id === id) localStorage.removeItem(INFLIGHT_KEY);
  } catch { /* best effort */ }
};
