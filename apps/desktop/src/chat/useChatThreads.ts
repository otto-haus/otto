import { useCallback, useState } from 'react';
import type { ThreadSummary } from '../components/ui/ThreadList';
import type { ChatMsg } from '../runtime';
import { archiveCurrentThread, readThreads } from './thread-index';

export function useChatThreads(conversationId: string | null | undefined, messages: ChatMsg[]) {
  const [threads, setThreads] = useState<ThreadSummary[]>(() => readThreads());

  const archiveForNewChat = useCallback(() => {
    setThreads((prev) => archiveCurrentThread(prev, conversationId, messages));
  }, [conversationId, messages]);

  return { threads, archiveForNewChat, activeConversationId: conversationId ?? null };
}
