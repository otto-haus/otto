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
    setThreads(result.threads.map(mapThread));
  }, [showArchived]);

  useEffect(() => {
    void refresh();
  }, [refresh, activeThreadId]);

  return { threads, showArchived, setShowArchived, refresh };
}
