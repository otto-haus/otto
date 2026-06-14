export function resolveDevRendererUrl(raw: string | undefined, isPackaged: boolean): string | null {
  const value = raw?.trim();
  if (!value || isPackaged) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const host = parsed.hostname.toLowerCase();
  if (host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]' && host !== '::1') return null;

  return parsed.toString();
}
