export type ConnectionMode = 'embedded' | 'existing' | 'cloud';

export type LettaOpenAction =
  | { kind: 'none'; hint: string }
  | { kind: 'open'; label: string };

function httpBaseUrl(baseUrl: string | null | undefined): string | null {
  const trimmed = baseUrl?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.replace(/\/+$/, '');
}

/** Settings copy for Open in Letta — embedded web server needs no Letta.app install. */
export function resolveLettaOpenAction(
  connectionMode: ConnectionMode,
  baseUrl: string | null | undefined,
): LettaOpenAction {
  const httpUrl = httpBaseUrl(baseUrl);
  if (connectionMode === 'embedded') {
    if (httpUrl) return { kind: 'open', label: 'Open Letta web UI' };
    return {
      kind: 'none',
      hint: 'Letta runs inside otto as a local web server — no separate Letta app install.',
    };
  }
  if (connectionMode === 'existing') {
    if (httpUrl) return { kind: 'open', label: 'Open Letta web UI' };
    return { kind: 'open', label: 'Open Letta Desktop' };
  }
  if (httpUrl) return { kind: 'open', label: 'Open Letta web UI' };
  return { kind: 'open', label: 'Open Letta' };
}
