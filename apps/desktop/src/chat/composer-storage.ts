/** Per-thread localStorage keys for composer draft and attachments (#547). */
import type { SavedAttachment } from '../runtime';

export const LEGACY_DRAFT_KEY = 'otto.chat.draft.v1';
export const LEGACY_ATTACHMENTS_KEY = 'otto.chat.attachments.v1';

export function draftKey(threadId: string | null): string {
  return threadId ? `otto.chat.draft.${threadId}.v1` : LEGACY_DRAFT_KEY;
}

export function attachmentsKey(threadId: string | null): string {
  return threadId ? `otto.chat.attachments.${threadId}.v1` : LEGACY_ATTACHMENTS_KEY;
}

export function readStoredDraft(
  threadId: string | null,
  opts: { storage?: Pick<Storage, 'getItem'> } = {},
): string {
  try {
    const storage = opts.storage ?? localStorage;
    return storage.getItem(draftKey(threadId)) ?? '';
  } catch {
    return '';
  }
}

export function writeStoredDraft(threadId: string | null, draft: string): void {
  try {
    localStorage.setItem(draftKey(threadId), draft);
  } catch {
    /* best effort */
  }
}

export function readStoredAttachments(
  threadId: string | null,
  opts: { storage?: Pick<Storage, 'getItem'> } = {},
): SavedAttachment[] {
  try {
    const storage = opts.storage ?? localStorage;
    const parsed = JSON.parse(storage.getItem(attachmentsKey(threadId)) ?? '[]') as SavedAttachment[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => typeof item?.id === 'string' && typeof item.path === 'string' && typeof item.url === 'string',
    );
  } catch {
    return [];
  }
}

export function writeStoredAttachments(threadId: string | null, attachments: SavedAttachment[]): void {
  try {
    localStorage.setItem(attachmentsKey(threadId), JSON.stringify(attachments));
  } catch {
    /* best effort */
  }
}
