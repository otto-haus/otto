import { homedir } from 'node:os';

/**
 * Redaction guard for everything that lands in the durable outbox.
 *
 * SECURITY/HONESTY (#754, AGENTS.md): the queue store must never persist provider keys, raw
 * secrets, or unredacted absolute local paths. We scrub on the way in so a leaked DB file or a
 * diagnostics export can't exfiltrate them. Redaction is intentionally conservative: it errs
 * toward over-redacting tokens rather than risking a leak.
 */

const SECRET_PATTERNS: Array<{ re: RegExp; replace: string }> = [
  // Provider API keys (OpenAI/Anthropic/Letta/etc): sk-..., sk-ant-..., key-..., pk-...
  { re: /\b(sk|pk|rk|key|api|tok|ghp|gho|ghs|xox[baprs])[-_][A-Za-z0-9-_]{12,}\b/g, replace: '[redacted-secret]' },
  // Bearer tokens
  { re: /\bBearer\s+[A-Za-z0-9._-]{12,}\b/gi, replace: 'Bearer [redacted-secret]' },
  // AWS access keys
  { re: /\bAKIA[0-9A-Z]{16}\b/g, replace: '[redacted-secret]' },
  // Long opaque hex/base64 blobs that look like credentials (>= 40 chars)
  { re: /\b[A-Fa-f0-9]{40,}\b/g, replace: '[redacted-hex]' },
];

/** Replace the user's home dir with `~` so absolute local paths never persist unredacted. */
export function redactHomePath(value: string): string {
  const home = homedir();
  if (!home) return value;
  // Replace all occurrences of the home prefix; keep the relative tail for context.
  const escaped = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(escaped, 'g'), '~');
}

export function redactSecrets(value: string): string {
  let out = value;
  for (const { re, replace } of SECRET_PATTERNS) out = out.replace(re, replace);
  return out;
}

/** Full redaction pass for free text before it is written to the durable store. */
export function redactText(value: string): string {
  return redactSecrets(redactHomePath(value));
}

export type OutboxAttachmentRef = { name: string; path?: string | null; mime?: string | null };

/** Redact attachment refs: keep name/mime, strip absolute paths to a home-relative form. */
export function redactAttachments(attachments: OutboxAttachmentRef[] | null | undefined): OutboxAttachmentRef[] {
  if (!attachments?.length) return [];
  return attachments.map((a) => ({
    name: redactText(String(a.name ?? '')).slice(0, 200),
    ...(a.path ? { path: redactText(String(a.path)) } : {}),
    ...(a.mime ? { mime: String(a.mime).slice(0, 100) } : {}),
  }));
}
