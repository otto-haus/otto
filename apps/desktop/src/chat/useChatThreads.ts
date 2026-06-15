import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ThreadSummary } from '../components/ui/ThreadList';
import { isElectron, ottoApi } from '../runtime';

function mapThread(thread: {
  id: string;
  lettaConversationId: string | null;
  title: string;
  updatedAt: string;
  pinned?: boolean;
  archived?: boolean;
  sortOrder?: number | null;
}): ThreadSummary {
  return {
    id: thread.id,
    conversationId: thread.lettaConversationId,
    title: thread.title,
    updatedAt: Date.parse(thread.updatedAt) || Date.now(),
    sortOrder: typeof thread.sortOrder === 'number' ? thread.sortOrder : null,
    pinned: !!thread.pinned,
    archived: !!thread.archived,
  };
}

export function useChatThreads(activeThreadId?: string | null) {
  const [allThreads, setAllThreads] = useState<ThreadSummary[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const refresh = useCallback(async () => {
    const api = ottoApi();
    if (!api || !isElectron()) {
      setAllThreads([]);
      return;
    }
    const result = await api.threads.list(true);
    const seen = new Set<string>();
    const unique = result.threads.filter((thread) => {
      if (seen.has(thread.id)) return false;
      seen.add(thread.id);
      return true;
    });
    setAllThreads(unique.map(mapThread));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, activeThreadId]);

  const hasArchived = useMemo(
    () => allThreads.some((thread) => thread.archived),
    [allThreads],
  );

  const threads = useMemo(
    () => (showArchived ? allThreads : allThreads.filter((thread) => !thread.archived)),
    [allThreads, showArchived],
  );

  const pinThread = useCallback(async (threadId: string, pinned: boolean) => {
    const api = ottoApi();
    if (!api || !isElectron()) return;
    setAllThreads((current) => current.map((thread) => (
      thread.id === threadId ? { ...thread, pinned } : thread
    )));
    try {
      await api.threads.pin(threadId, pinned);
      await refresh();
    } catch {
      await refresh();
    }
  }, [refresh]);

  const archiveThread = useCallback(async (threadId: string) => {
    const api = ottoApi();
    if (!api || !isElectron()) return;
    await api.threads.archive(threadId);
    await refresh();
  }, [refresh]);

  const restoreThread = useCallback(async (threadId: string) => {
    const api = ottoApi();
    if (!api || !isElectron()) return;
    await api.threads.unarchive(threadId);
    await refresh();
  }, [refresh]);

  const moveThread = useCallback(async (threadId: string, targetId: string) => {
    const api = ottoApi();
    if (!api || !isElectron()) return;
    await api.threads.move(threadId, targetId);
    await refresh();
  }, [refresh]);

  const renameThread = useCallback(async (threadId: string, title: string) => {
    const api = ottoApi();
    if (!api || !isElectron()) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    setAllThreads((current) => current.map((thread) => (
      thread.id === threadId ? { ...thread, title: trimmed } : thread
    )));
    try {
      await api.threads.rename(threadId, trimmed);
      await refresh();
    } catch {
      await refresh();
    }
  }, [refresh]);

  return {
    threads,
    hasArchived,
    showArchived,
    setShowArchived,
    refresh,
    pinThread,
    archiveThread,
    restoreThread,
    moveThread,
    renameThread,
  };
}
