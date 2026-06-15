/** Attachment refs passed from the renderer after IPC save. */
export type AttachmentRef = {
  name: string;
  path: string;
};

/** 1×1 PNG used by attachment ingestion smokes — no binary fixture file required. */
export const ATTACHMENT_SMOKE_FIXTURE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

/** Default user-message body when sending image-only turns (runtime + display parsing). */
export const DEFAULT_ATTACHMENT_PROMPT = 'Please inspect the attached image(s).';

/** Message body handed to the Letta runtime (paths are intentional for local file tools). */
export function buildRuntimeMessageWithAttachments(text: string, attachments: AttachmentRef[]): string {
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
