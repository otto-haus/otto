import { useEffect, useRef, useState } from 'react';

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
  modelHandle?: string | null;
  effort?: EffortLevel;
  sessionMode?: 'default' | 'smoke';
  memfsEnabled?: boolean;
  tools?: string[];
  cliPath: string;
  cliResolved: boolean;
};

export type ConnectionInfo = { baseUrl: string | null; agentId: string | null };
export type ConnectionInput = { baseUrl?: string | null; agentId?: string | null };
export type EffortLevel = 'off' | 'low' | 'medium' | 'high' | 'max';
export type RuntimePreferences = { modelHandle?: string | null; effort?: EffortLevel };

export type OttoEvent =
  | { message: { type: string; [k: string]: unknown } }
  | { status: RuntimeStatus };

type OttoApi = {
  runtime: {
    init(): Promise<RuntimeStatus>;
    status(): Promise<RuntimeStatus>;
    send(text: string): Promise<void>;
    abort(): Promise<void>;
    configure(input: RuntimePreferences): Promise<RuntimeStatus>;
    openLetta(): Promise<string>;
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

export type ChatMsg = { who: 'user' | 'otto' | 'error'; text: string; streamId?: string };

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
  const activeAssistantStream = useRef<string | null>(null);

  useEffect(() => {
    if (!api) return;
    api.runtime
      .init()
      .then(setStatus)
      .catch((e) => setStatus({ ready: false, reason: String(e), cliPath: '', cliResolved: false }));
    const off = api.onEvent((e) => {
      if ('status' in e) {
        setStatus(e.status);
        return;
      }
      const m = e.message;
      if (m.type === 'assistant') {
        const t = assistantText(m);
        if (t) {
          const streamId = String(m.uuid ?? m.runId ?? 'assistant');
          setMessages((x) => {
            const last = x[x.length - 1];
            if (activeAssistantStream.current === streamId && last?.who === 'otto') {
              return [...x.slice(0, -1), { ...last, text: `${last.text}${t}` }];
            }
            activeAssistantStream.current = streamId;
            return [...x, { who: 'otto', text: t, streamId }];
          });
        }
      } else if (m.type === 'error') {
        activeAssistantStream.current = null;
        setMessages((x) => [...x, { who: 'error', text: String((m as { message?: unknown }).message ?? 'error') }]);
        setBusy(false);
      } else if (m.type === 'result') {
        activeAssistantStream.current = null;
        setBusy(false);
      }
    });
    return off;
  }, [api]);

  const retry = async () => {
    if (api) setStatus(await api.runtime.init());
  };

  const updateStatus = (next: RuntimeStatus) => {
    setStatus(next);
  };

  const send = async (text: string) => {
    if (!api || !status?.ready || busy) return;
    activeAssistantStream.current = null;
    setMessages((x) => [...x, { who: 'user', text }]);
    setBusy(true);
    await api.runtime.send(text);
  };

  const abort = async () => {
    if (!api) return;
    await api.runtime.abort();
    activeAssistantStream.current = null;
    setBusy(false);
  };

  const configure = async (input: RuntimePreferences) => {
    if (!api || busy) return status;
    const next = await api.runtime.configure(input);
    setStatus(next);
    return next;
  };

  return { electron: !!api, status, messages, busy, send, abort, retry, updateStatus, configure };
}
