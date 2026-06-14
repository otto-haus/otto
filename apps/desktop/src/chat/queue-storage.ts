export type QueueState = 'queued' | 'sending' | 'failed';
export type QueueItem = { id: string; text: string; createdAt: number; state: QueueState };

export const QUEUE_KEY = 'otto.chat.queue.v2';
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

export const createQueueItem = (text: string, state: QueueState = 'queued'): QueueItem => {
  const id = globalThis.crypto?.randomUUID?.() ?? `queue-${Date.now()}-${fallbackQueueIdSequence += 1}`;
  return { id, text, createdAt: Date.now(), state };
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
    return { id: item.id, text: item.text, createdAt, state: 'queued' };
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
      }));
  } catch {
    return [];
  }
};

export const readQueue = (): QueueItem[] => {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_QUEUE_KEY);
    const currentRaw = localStorage.getItem(QUEUE_KEY);
    const stored = parseStoredQueue(currentRaw ?? legacyRaw);
    const items = sanitizeQueue(
      dedupeQueue([
        readInFlight(),
        ...stored,
      ]),
    );

    if (legacyRaw) localStorage.removeItem(LEGACY_QUEUE_KEY);
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
