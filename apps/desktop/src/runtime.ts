import { useEffect, useState } from 'react';

// Renderer-side view of the window.otto bridge exposed by electron/preload.ts.
// In the web preview window.otto is undefined → the app stays a file-backed shell.

export type StatusCode =
  | 'ready'
  | 'no-agent'
  | 'no-api-key'
  | 'unreachable'
  | 'sdk-missing'
  | 'stale'
  | 'error';

export type RuntimeStatus = {
  ready: boolean;
  reason?: string;
  code?: StatusCode;
  agentId?: string | null;
  conversationId?: string | null;
  model?: string;
  memfsEnabled?: boolean;
  tools?: string[];
  cliPath: string;
  cliResolved: boolean;
};

export type ConnectionInfo = { baseUrl: string | null; agentId: string | null; hasApiKey: boolean };
export type ConnectionInput = { baseUrl?: string | null; agentId?: string | null; apiKey?: string | null };

export type OttoEvent = { message: { type: string; [k: string]: unknown } };

type OttoApi = {
  runtime: {
    init(): Promise<RuntimeStatus>;
    status(): Promise<RuntimeStatus>;
    send(text: string): Promise<void>;
    abort(): Promise<void>;
  };
  config: { get(): Promise<unknown>; set(patch: unknown): Promise<unknown> };
  connection: {
    get(): Promise<ConnectionInfo>;
    save(input: ConnectionInput): Promise<RuntimeStatus>;
  };
  permission: { respond(requestId: string, response: unknown): void };
  onEvent(cb: (e: OttoEvent) => void): () => void;
  onPermission(cb: (req: unknown) => void): () => void;
};

declare global {
  interface Window {
    otto?: OttoApi;
  }
}

export const ottoApi = (): OttoApi | null =>
  typeof window !== 'undefined' && window.otto ? window.otto : null;
export const isElectron = (): boolean => ottoApi() !== null;

export type ChatMsg = { who: 'user' | 'otto' | 'error'; text: string };

// Best-effort text extraction from a loosely-typed SDK assistant message.
function assistantText(m: Record<string, unknown>): string | null {
  if (typeof m.text === 'string') return m.text;
  const content = m.content as unknown;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const parts = content
      .map((c) => (c && typeof c === 'object' && 'text' in c ? String((c as { text: unknown }).text) : ''))
      .filter(Boolean);
    if (parts.length) return parts.join('');
  }
  return null;
}

export function useRuntime() {
  const api = ottoApi();
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    api.runtime
      .init()
      .then(setStatus)
      .catch((e) => setStatus({ ready: false, reason: String(e), cliPath: '', cliResolved: false }));
    const off = api.onEvent((e) => {
      const m = e.message;
      if (m.type === 'assistant') {
        const t = assistantText(m);
        if (t) setMessages((x) => [...x, { who: 'otto', text: t }]);
      } else if (m.type === 'error') {
        setMessages((x) => [...x, { who: 'error', text: String((m as { message?: unknown }).message ?? 'error') }]);
        setBusy(false);
      } else if (m.type === 'result') {
        setBusy(false);
      }
    });
    return off;
  }, [api]);

  const retry = async () => {
    if (api) setStatus(await api.runtime.init());
  };

  const send = async (text: string) => {
    if (!api || !status?.ready || busy) return;
    setMessages((x) => [...x, { who: 'user', text }]);
    setBusy(true);
    await api.runtime.send(text);
  };

  return { electron: !!api, status, messages, busy, send, retry };
}
