import { useCallback, useEffect, useState } from 'react';
import type { ThreadSummary } from '../components/ui/ThreadList';
import { isElectron, ottoApi } from '../runtime';

function mapThread(thread: {
  id: string;
  lettaConversationId: string | null;
  title: string;
  updatedAt: string;
  pinned?: boolean;
  archived?: boolean;
}): ThreadSummary {
  return {
    id: thread.id,
    conversationId: thread.lettaConversationId,
    title: thread.title,
    updatedAt: Date.parse(thread.updatedAt) || Date.now(),
    pinned: !!thread.pinned,
  };
}

export function useChatThreads(activeThreadId?: string | null) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const refresh = useCallback(async () => {
    const api = ottoApi();
    if (!api || !isElectron()) {
      setThreads([]);
      return;
    }
    const result = await api.threads.list(showArchived);
    const seen = new Set<string>();
    const unique = result.threads.filter((thread) => {
      if (seen.has(thread.id)) return false;
      seen.add(thread.id);
      return true;
    });
    setThreads(unique.map(mapThread));
  }, [showArchived]);

  useEffect(() => {
    void refresh();
  }, [refresh, activeThreadId]);

  const pinThread = useCallback(async (threadId: string, pinned: boolean) => {
    const api = ottoApi();
    if (!api || !isElectron()) return;
    await api.threads.pin(threadId, pinned);
    await refresh();
  }, [refresh]);

  const archiveThread = useCallback(async (threadId: string) => {
    const api = ottoApi();
    if (!api || !isElectron()) return;
    await api.threads.archive(threadId);
    await refresh();
  }, [refresh]);

  return { threads, showArchived, setShowArchived, refresh, pinThread, archiveThread };
}
