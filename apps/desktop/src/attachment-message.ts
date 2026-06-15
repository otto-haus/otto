/** Attachment refs passed from the renderer after IPC save. */
export type AttachmentRef = {
  id: string;
  name: string;
  path: string;
  mime?: string;
};

/** 1×1 PNG used by attachment ingestion smokes — no binary fixture file required. */
export const ATTACHMENT_SMOKE_FIXTURE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

/** Safe token persisted in chat history / queue footers — never a raw filesystem path. */
export const ATTACHMENT_REF_PREFIX = 'otto-att:';

/** Placeholder shown when a legacy footer line has no resolvable attachment id. */
export const REDACTED_ATTACHMENT_PATH = '[attachment:local file]';

/** Default user-message body when sending image-only turns (runtime + display parsing). */
export const DEFAULT_ATTACHMENT_PROMPT = 'Please inspect the attached image(s).';

export type RuntimeSendAttachment = {
  id: string;
  name: string;
  path: string;
  mime: string;
};

/** Payload handed to the Letta runtime over IPC — display text stays redacted. */
export type RuntimeSendPayload = {
  /** Text stored in chat history and queue (paths redacted). */
  storedText: string;
  /** Prompt text for Letta; image bytes are delivered separately. */
  promptText: string;
  attachments: RuntimeSendAttachment[];
};

export function formatAttachmentFooterLine(
  index: number,
  attachment: Pick<AttachmentRef, 'name' | 'id'>,
): string {
  return `${index + 1}. ${attachment.name} — ${ATTACHMENT_REF_PREFIX}${attachment.id}`;
}

/** User-visible / persisted message body with redacted attachment refs. */
export function buildStoredMessageWithAttachments(text: string, attachments: AttachmentRef[]): string {
  if (!attachments.length) return text;
  const body = text.trim() || DEFAULT_ATTACHMENT_PROMPT;
  const lines = attachments.map((attachment, index) => formatAttachmentFooterLine(index, attachment));
  return `${body}\n\nAttached local image${attachments.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

/** Prompt text for the Letta runtime — no local path footer (images ride as binary parts). */
export function buildRuntimePromptText(text: string, attachments: AttachmentRef[]): string {
  if (!attachments.length) return text;
  return text.trim() || DEFAULT_ATTACHMENT_PROMPT;
}

export function buildRuntimeSendPayload(text: string, attachments: RuntimeSendAttachment[]): RuntimeSendPayload {
  return {
    storedText: buildStoredMessageWithAttachments(text, attachments),
    promptText: buildRuntimePromptText(text, attachments),
    attachments,
  };
}

/** @deprecated Prefer buildRuntimeSendPayload — kept for tests migrating off path-in-text delivery. */
export function buildRuntimeMessageWithAttachments(text: string, attachments: Pick<AttachmentRef, 'name' | 'path'>[]): string {
  if (!attachments.length) return text;
  const body = text.trim() || DEFAULT_ATTACHMENT_PROMPT;
  const lines = attachments.map((a, i) => `${i + 1}. ${a.name} — ${a.path}`);
  return `${body}\n\nAttached local image${attachments.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

/** User-visible attachment tray label — filename only, never the on-disk path. */
export function formatAttachmentTrayLabel(attachment: Pick<AttachmentRef, 'name'>): string {
  return attachment.name;
}

const SECRET_PATTERNS = [
  /LETTA_API_KEY\s*[:=]\s*\S+/i,
  /sk-[a-zA-Z0-9]{20,}/,
  /Bearer\s+[a-zA-Z0-9._-]{20,}/i,
];

/** Returns leaked secret patterns found in user-visible copy (empty when clean). */
export function findSecretLeaksInUserVisibleText(text: string): string[] {
  return SECRET_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => String(pattern));
}

/** Returns absolute local paths embedded in user-visible copy (empty when clean). */
export function findPathLeaksInUserVisibleText(text: string, paths: string[]): string[] {
  return paths.filter((p) => p.length > 0 && text.includes(p));
}

/** Parse attachment ids embedded in a stored/queued message footer. */
export function parseAttachmentIdsFromStoredText(text: string): string[] {
  const markerMatch = text.match(/\n\nAttached local images?:\n/);
  if (!markerMatch || markerMatch.index == null) return [];
  const footer = text.slice(markerMatch.index + markerMatch[0].length);
  const ids: string[] = [];
  for (const line of footer.split('\n')) {
    const match = line.trim().match(/^\d+\.\s+.+?\s+—\s+(.+)$/);
    if (!match) continue;
    const token = match[1].trim();
    if (token.startsWith(ATTACHMENT_REF_PREFIX)) {
      ids.push(token.slice(ATTACHMENT_REF_PREFIX.length));
    }
  }
  return ids;
}
