import type { ThreadSummary } from '../components/ui/ThreadList';
import type { ChatMsg } from '../runtime';

const THREADS_KEY = 'otto.chat.threads.v1';
const MAX_THREADS = 24;

export function readThreads(): ThreadSummary[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(THREADS_KEY) ?? '[]') as ThreadSummary[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => typeof t?.id === 'string' && typeof t?.title === 'string')
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, MAX_THREADS);
  } catch {
    return [];
  }
}

function persistThreads(threads: ThreadSummary[]) {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads.slice(0, MAX_THREADS)));
  } catch { /* best effort */ }
}

function titleFromMessages(messages: ChatMsg[]): string {
  const firstUser = messages.find((m) => m.who === 'user')?.text.trim();
  if (!firstUser) return 'Chat';
  const oneLine = firstUser.replace(/\s+/g, ' ');
  return oneLine.length > 56 ? `${oneLine.slice(0, 53)}…` : oneLine;
}

export function archiveCurrentThread(
  threads: ThreadSummary[],
  conversationId: string | null | undefined,
  messages: ChatMsg[],
): ThreadSummary[] {
  if (!messages.length) return threads;
  const id = conversationId ?? `local-${Date.now()}`;
  const entry: ThreadSummary = {
    id,
    conversationId: conversationId ?? null,
    title: titleFromMessages(messages),
    updatedAt: Date.now(),
  };
  const next = [entry, ...threads.filter((t) => t.conversationId !== conversationId && t.id !== id)];
  persistThreads(next);
  return next.slice(0, MAX_THREADS);
}
