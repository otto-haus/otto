import { redactSensitiveContent } from '../conversation-markdown';

/** Redact secrets and local paths before markdown parse (display path). */
export function redactForDisplay(text: string): string {
  return redactSensitiveContent(text);
}
