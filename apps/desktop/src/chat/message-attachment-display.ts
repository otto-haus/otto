import { DEFAULT_ATTACHMENT_PROMPT } from '../attachment-message';
import {
  parseQueueAttachmentLine,
  splitQueueText,
  type QueueAttachmentRef,
} from './queue-storage';

export type SentMessageDisplay = {
  displayBody: string;
  attachments: QueueAttachmentRef[];
};

/** file:// preview URL for a saved attachment path (renderer display only). */
export function pathToAttachmentPreviewUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('file://')) return path;
  const normalized = path.replace(/\\/g, '/');
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
}

/** Split a sent user message into visible markdown body and attachment refs. */
export function parseSentMessageDisplay(text: string): SentMessageDisplay {
  const { body, attachmentLines } = splitQueueText(text);
  const attachments = attachmentLines
    .map(parseQueueAttachmentLine)
    .filter((item): item is QueueAttachmentRef => item != null);
  let displayBody = body.trim();
  if (attachments.length > 0 && displayBody === DEFAULT_ATTACHMENT_PROMPT) {
    displayBody = '';
  }
  return { displayBody, attachments };
}
