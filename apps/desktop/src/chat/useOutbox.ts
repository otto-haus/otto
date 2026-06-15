import { useCallback, useEffect, useRef, useState } from 'react';
import { ottoApi } from '../runtime';
import type { EnqueueRequest, OutboxSnapshot, QueueItemDetailView, QueueItemView, RecallResult } from '../runtime';

/**
 * Renderer subscription to the MAIN-process durable outbox (#754). This hook holds NO durable
 * queue state — it mirrors the snapshots the main process broadcasts on `otto:outbox` and forwards
 * operations over IPC. Survives renderer reloads (re-fetches `list`) because the truth is in SQLite.
 */
export type UseOutbox = {
  available: boolean;
  items: QueueItemView[];
  enqueue: (input: EnqueueRequest) => Promise<QueueItemView | null>;
  retry: (id: string) => Promise<void>;
  retryAll: () => Promise<void>;
  recall: (id: string) => Promise<RecallResult | null>;
  cancel: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  detail: (id: string) => Promise<QueueItemDetailView | null>;
};

export function useOutbox(activeThreadId: string | null): UseOutbox {
  const api = ottoApi();
  const [items, setItems] = useState<QueueItemView[]>([]);
  const threadRef = useRef<string | null>(activeThreadId);
  threadRef.current = activeThreadId;

  // Subscribe to broadcasts. Only apply snapshots for the active thread (or thread-agnostic ones).
  useEffect(() => {
    if (!api?.onOutbox) return;
    return api.onOutbox((snapshot: OutboxSnapshot) => {
      if (snapshot.threadId == null || snapshot.threadId === threadRef.current) {
        setItems(snapshot.items);
      }
    });
  }, [api]);

  // Initial hydrate + refetch when the active thread changes (covers renderer reload).
  useEffect(() => {
    if (!api?.outbox) {
      setItems([]);
      return;
    }
    let cancelled = false;
    void api.outbox.list(activeThreadId).then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, [api, activeThreadId]);

  const enqueue = useCallback(
    async (input: EnqueueRequest) => (api?.outbox ? api.outbox.enqueue(input) : null),
    [api],
  );
  const retry = useCallback(async (id: string) => { await api?.outbox?.retry(id); }, [api]);
  const retryAll = useCallback(async () => { await api?.outbox?.retryAll(threadRef.current); }, [api]);
  const recall = useCallback(
    async (id: string) => (api?.outbox ? api.outbox.recall(id) : null),
    [api],
  );
  const cancel = useCallback(async (id: string) => { await api?.outbox?.cancel(id); }, [api]);
  const clear = useCallback(async () => { await api?.outbox?.clear(threadRef.current); }, [api]);
  const detail = useCallback(
    async (id: string) => (api?.outbox ? api.outbox.detail(id) : null),
    [api],
  );

  return { available: !!api?.outbox, items, enqueue, retry, retryAll, recall, cancel, clear, detail };
}
