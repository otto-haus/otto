/** Per-thread localStorage keys for chat history (046). */
export const LEGACY_MESSAGES_KEY = 'otto.chat.messages.v1';

export function messagesKey(threadId: string | null): string {
  return threadId ? `otto.chat.messages.${threadId}.v1` : LEGACY_MESSAGES_KEY;
}
