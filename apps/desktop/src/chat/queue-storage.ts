/**
 * Chat unsent-message queue states (operator-facing labels in parentheses):
 *
 * - `queued` (waiting): durable row waiting for the runtime to drain.
 * - `sending` (sending): handed to the runtime; stored separately in INFLIGHT_KEY until ack/fail.
 * - `failed` (failed): send rejected; stays visible until retry or remove.
 *
 * Terminal states outside the queue store:
 * - cancelled: user removed the row (`removeQueueItem`).
 * - sent: runtime accepted the message; row is dropped and INFLIGHT_KEY cleared.
 *
 * Recall (composer edit path):
 * - Recall copies queue text into the composer without removing the row.
 * - The row stays queued until the operator sends (Tab/queue) or removes it.
 * - Attachment footer lines round-trip through `composerDraftFromQueueText`.
 *
 * Operator actions per row: Recall, View, Retry (failed), Send now (waiting, not next), Remove.
 * See `docs/chat-queue-states.md`.
 *
 * Drain order (per active thread; rows scope to their `threadId` only):
 * 1. First `queued` row in array order (`nextQueueItemForThread`).
 * 2. Steer enqueue (composer submit while runtime is busy) inserts at the front of that thread's
 *    waiting rows so the operator's interrupt sends next after abort.
 * 3. Ordinary enqueue appends at the end (FIFO).
 * 4. Rehydrated in-flight rows resume before other waiting rows for the same thread.
 * 5. Retried failed rows append after existing waiting rows (retry does not jump the line).
 * 6. Manual "Send now" promotes one waiting row to the front without touching other threads.
 * 7. Failed rows stay visible after waiting rows and never auto-drain.
 */
export type QueueState = 'queued' | 'sending' | 'failed';
export type QueueItem = {
  id: string;
  text: string;
  createdAt: number;
  state: QueueState;
  threadId?: string | null;
  failureReason?: string;
};
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

export const splitQueueText = (text: string): { body: string; attachmentLines: string[] } => {
  const markerMatch = text.match(/\n\nAttached local images?:\n/);
  if (!markerMatch || markerMatch.index == null) return { body: text, attachmentLines: [] };
  const body = text.slice(0, markerMatch.index).trimEnd();
  const footer = text.slice(markerMatch.index + markerMatch[0].length);
  const attachmentLines = footer.split('\n').map((line) => line.trim()).filter(Boolean);
  return { body, attachmentLines };
};

export type QueueAttachmentRef = { name: string; path: string; id?: string };

export const parseQueueAttachmentLine = (line: string): QueueAttachmentRef | null => {
  const match = line.trim().match(/^\d+\.\s+(.+?)\s+—\s+(.+)$/);
  if (!match) return null;
  const name = match[1].trim();
  const token = match[2].trim();
  if (!name || !token) return null;
  if (token.startsWith('otto-att:')) {
    return { name, id: token.slice('otto-att:'.length), path: '' };
  }
  return { name, path: token };
};

/** Split queued message text into composer body plus attachment refs for recall. */
export const composerDraftFromQueueText = (text: string): { body: string; attachments: QueueAttachmentRef[] } => {
  const { body, attachmentLines } = splitQueueText(text);
  const attachments = attachmentLines
    .map(parseQueueAttachmentLine)
    .filter((item): item is QueueAttachmentRef => item != null);
  return { body, attachments };
};

export const queueHasAttachments = (text: string): boolean => splitQueueText(text).attachmentLines.length > 0;

export const previewQueueText = (text: string): string => {
  const { body, attachmentLines } = splitQueueText(text);
  const trimmed = body.trim().replace(/\s+/g, ' ');
  if (!trimmed && attachmentLines.length) {
    return attachmentLines.length === 1 ? 'Image attachment' : `${attachmentLines.length} image attachments`;
  }
  if (!trimmed) return 'Empty message';
  if (isSmokeQueueText(trimmed)) return 'Automated smoke message';
  const preview = trimmed.length > 96 ? `${trimmed.slice(0, 96)}…` : trimmed;
  if (!attachmentLines.length) return preview;
  const suffix = attachmentLines.length === 1 ? ' · 1 attachment' : ` · ${attachmentLines.length} attachments`;
  return `${preview}${suffix}`;
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
  !!threadId && item.threadId === threadId;

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

export const enqueueQueueItemForThread = (
  items: QueueItem[],
  text: string,
  threadId: string | null | undefined,
  options?: { steer?: boolean },
): QueueItem[] => {
  if (hasDuplicateQueueText(items, threadId, text)) return items;
  const item = createQueueItem(text, 'queued', threadId ?? null);
  if (!options?.steer) return [...items, item];

  const insertAt = items.findIndex(
    (candidate) => candidate.state === 'queued' && queueMatchesThread(candidate, threadId),
  );
  if (insertAt === -1) return [...items, item];
  return [...items.slice(0, insertAt), item, ...items.slice(insertAt)];
};

export const mergeInflightIntoQueue = (
  items: QueueItem[],
  inFlight: QueueItem | null,
): QueueItem[] => {
  if (!inFlight) return items;

  const without = items.filter((item) => item.id !== inFlight.id);
  const insertAt = without.findIndex(
    (item) => item.state === 'queued' && queueMatchesThread(item, inFlight.threadId),
  );
  if (insertAt === -1) return [...without, inFlight];
  return [...without.slice(0, insertAt), inFlight, ...without.slice(insertAt)];
};

export const appendFailedQueueItem = (
  items: QueueItem[],
  failed: QueueItem,
  failureReason?: string,
): QueueItem[] =>
  dedupeQueue([...items, {
    ...failed,
    state: 'failed',
    failureReason: failureReason ?? failed.failureReason ?? 'Send failed.',
  }]);

export const promoteQueueItemForThread = (
  items: QueueItem[],
  threadId: string | null | undefined,
  id: string,
): QueueItem[] => {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return items;
  const target = items[index];
  if (target.state !== 'queued' || !queueMatchesThread(target, threadId)) return items;

  const without = items.filter((item) => item.id !== id);
  const insertAt = without.findIndex(
    (item) => item.state === 'queued' && queueMatchesThread(item, threadId),
  );
  if (insertAt === -1) return [...without, target];
  return [...without.slice(0, insertAt), target, ...without.slice(insertAt)];
};

export const updateQueueItemText = (items: QueueItem[], id: string, text: string): QueueItem[] =>
  items.map((item) => (item.id === id ? { ...item, text } : item));

export const removeQueueItem = (items: QueueItem[], id: string): QueueItem[] =>
  items.filter((item) => item.id !== id);

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

    if (shouldRetry) retried.push({ ...item, state: 'queued', failureReason: undefined });
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
      return {
        id: item.id,
        text: item.text,
        createdAt,
        state: 'failed',
        threadId: typeof item.threadId === 'string' ? item.threadId : null,
      };
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

export const clearQueueStorage = (): string[] => {
  const keys = [QUEUE_KEY, LEGACY_QUEUE_V2_KEY, LEGACY_QUEUE_KEY, INFLIGHT_KEY];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch { /* best effort */ }
  }
  return keys;
};

export type ReadQueueOptions = { activeThreadId?: string | null };

const stampLegacyThreadIds = (items: QueueItem[], activeThreadId?: string | null): QueueItem[] => {
  if (!activeThreadId) return items;
  return items.map((item) => (item.threadId == null ? { ...item, threadId: activeThreadId } : item));
};

export const readQueue = (opts?: ReadQueueOptions): QueueItem[] => {
  try {
    const legacyV2Raw = localStorage.getItem(LEGACY_QUEUE_V2_KEY);
    const legacyV1Raw = localStorage.getItem(LEGACY_QUEUE_KEY);
    const currentRaw = localStorage.getItem(QUEUE_KEY);
    const current = parseStoredQueue(currentRaw);
    const legacy = [
      ...parseStoredQueue(legacyV2Raw),
      ...parseStoredQueue(legacyV1Raw),
    ];
    const items = stampLegacyThreadIds(
      sanitizeQueue(
        mergeInflightIntoQueue(
          dedupeQueue([...current, ...legacy]),
          readInFlight(),
        ),
      ),
      opts?.activeThreadId,
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

/** Drop persisted in-flight row when it belongs to the cleared thread. */
export const clearInFlightForThread = (threadId: string | null | undefined) => {
  try {
    const item = JSON.parse(localStorage.getItem(INFLIGHT_KEY) ?? 'null') as QueueItem | null;
    if (item && queueMatchesThread(item, threadId)) localStorage.removeItem(INFLIGHT_KEY);
  } catch { /* best effort */ }
};
