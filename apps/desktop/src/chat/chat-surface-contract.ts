import type { SurfaceId } from '../components/Sidebar';
import type { TodoItem } from '../runtime';

/** Durable surfaces chat may promote into — not canonical in the transcript. */
export const DURABLE_PROMOTION_SURFACES = [
  'receipts',
  'tickets',
  'charters',
  'standards',
  'practices',
  'routines',
  'curation',
] as const satisfies readonly SurfaceId[];

export type ChatHandoffFields = {
  stateSummary?: string;
  openQuestions?: string[];
  nextAction?: string;
};

export function nextActionFromTodos(todos: TodoItem[]): string | null {
  const active =
    todos.find((t) => t.status === 'in_progress') ??
    todos.find((t) => t.status === 'pending');
  return active?.content?.trim() || null;
}

export function formatChatHandoffSummary(fields: ChatHandoffFields): string | null {
  const parts: string[] = [];
  if (fields.stateSummary?.trim()) parts.push(fields.stateSummary.trim());
  if (fields.openQuestions?.length) {
    parts.push(`Open: ${fields.openQuestions.map((q) => q.trim()).filter(Boolean).join(' · ')}`);
  }
  if (fields.nextAction?.trim()) parts.push(`Next: ${fields.nextAction.trim()}`);
  return parts.length ? parts.join(' — ') : null;
}
