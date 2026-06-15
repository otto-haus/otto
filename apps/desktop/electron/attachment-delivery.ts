import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { imageFromBase64 } from '@letta-ai/letta-code-sdk';
import type { MessageContentItem } from '@letta-ai/letta-code-sdk';
import {
  buildRuntimePromptText,
  DEFAULT_ATTACHMENT_PROMPT,
  parseAttachmentIdsFromStoredText,
  type RuntimeSendAttachment,
  type RuntimeSendPayload,
} from '../src/attachment-message';
import { splitQueueText } from '../src/chat/queue-storage';
import { defaultOttoDir } from './config-store';
import type { SavedAttachment } from './shared/types';
import { countAttachmentsInPrompt } from './runtime-transport/ws-protocol';

export type AttachmentDeliveryError = { name: string; message: string };

export type AttachmentDeliveryContent = {
  content: MessageContentItem[];
  errors: AttachmentDeliveryError[];
};

const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
type ImageMime = typeof IMAGE_MIMES[number];

const MIME_BY_EXT: Record<string, ImageMime> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

function mimeFromPath(path: string): ImageMime {
  const ext = basename(path).split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'image/png';
}

/** Resolve a saved attachment id to its on-disk path (filename embeds id prefix). */
export function resolveAttachmentPath(id: string): string | null {
  if (!id.trim()) return null;
  const dir = join(defaultOttoDir(), 'attachments');
  if (!existsSync(dir)) return null;
  const prefix = id.slice(0, 8);
  const match = readdirSync(dir).find((name) => name.includes(`-${prefix}-`));
  return match ? join(dir, match) : null;
}

export function resolveAttachmentRecord(id: string): SavedAttachment | null {
  const path = resolveAttachmentPath(id);
  if (!path || !existsSync(path)) return null;
  const name = basename(path).replace(/^[^-]+-[^-]+-/, '') || basename(path);
  const mime = mimeFromPath(path);
  return {
    id,
    name,
    mime,
    path,
    url: pathToFileURL(path).href,
    size: readFileSync(path).byteLength,
  };
}

export function resolveAttachmentRecords(ids: string[]): SavedAttachment[] {
  return ids
    .map((id) => resolveAttachmentRecord(id))
    .filter((item): item is SavedAttachment => item != null);
}

function readImageContent(path: string, mime: ImageMime): MessageContentItem {
  const data = readFileSync(path).toString('base64');
  if (!data.length) throw new Error('Attachment is empty.');
  return imageFromBase64(data, mime);
}

/** Build multimodal Letta content from prompt text plus on-disk attachment files. */
export function buildAttachmentDeliveryContent(
  promptText: string,
  attachments: RuntimeSendAttachment[],
): AttachmentDeliveryContent {
  const errors: AttachmentDeliveryError[] = [];
  const images: MessageContentItem[] = [];

  for (const attachment of attachments) {
    const path = attachment.path || resolveAttachmentPath(attachment.id);
    if (!path || !existsSync(path)) {
      errors.push({ name: attachment.name, message: 'Attachment file is missing on disk.' });
      continue;
    }
    try {
      images.push(readImageContent(path, mimeFromPath(path)));
    } catch (err) {
      errors.push({
        name: attachment.name,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const content: MessageContentItem[] = [{ type: 'text', text: promptText }, ...images];
  return { content, errors };
}

export function deliveryFailureMessage(errors: AttachmentDeliveryError[]): string {
  if (!errors.length) return 'Could not deliver attached image(s).';
  if (errors.length === 1) return `Could not deliver "${errors[0].name}": ${errors[0].message}`;
  return `Could not deliver ${errors.length} attached images: ${errors.map((e) => e.name).join(', ')}.`;
}

/** Normalize IPC/runtime payload and resolve queue ids when paths are omitted. */
export function normalizeRuntimeSendPayload(input: RuntimeSendPayload): RuntimeSendPayload {
  const { body } = splitQueueText(input.storedText);
  let attachments = input.attachments;
  if (!attachments.length) {
    const ids = parseAttachmentIdsFromStoredText(input.storedText);
    attachments = resolveAttachmentRecords(ids).map((saved) => ({
      id: saved.id,
      name: saved.name,
      path: saved.path,
      mime: saved.mime,
    }));
  }
  const promptText = input.promptText
    || buildRuntimePromptText(body, attachments.length ? attachments : []);
  const fallbackPrompt = body.trim() || (attachments.length ? DEFAULT_ATTACHMENT_PROMPT : input.storedText);
  return {
    storedText: input.storedText,
    promptText: promptText.trim() ? promptText : fallbackPrompt,
    attachments,
  };
}

export function assertDeliverableAttachments(
  attachments: RuntimeSendAttachment[],
  errors: AttachmentDeliveryError[],
): void {
  if (!attachments.length) return;
  if (errors.length === attachments.length) {
    throw new Error(deliveryFailureMessage(errors));
  }
}

export function prepareRuntimeSend(input: RuntimeSendPayload | string): {
  storedText: string;
  deliveryContent: MessageContentItem[];
  attachmentCount: number;
} {
  if (typeof input === 'string') {
    return {
      storedText: input,
      deliveryContent: [{ type: 'text', text: input }],
      attachmentCount: countAttachmentsInPrompt(input),
    };
  }

  const payload = normalizeRuntimeSendPayload(input);
  const { content, errors } = buildAttachmentDeliveryContent(payload.promptText, payload.attachments);
  assertDeliverableAttachments(payload.attachments, errors);
  return {
    storedText: payload.storedText,
    deliveryContent: content,
    attachmentCount: payload.attachments.length,
  };
}
