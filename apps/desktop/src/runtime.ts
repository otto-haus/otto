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
  baseUrl?: string | null;
  discoverySource?: string;
  cliPath: string;
  cliResolved: boolean;
};

export type ConnectionInfo = { baseUrl: string | null; agentId: string | null };
export type ConnectionInput = { baseUrl?: string | null; agentId?: string | null };
export type EffortLevel = 'off' | 'low' | 'medium' | 'high' | 'max';
export type RuntimePreferences = { modelHandle?: string | null; effort?: EffortLevel };
export type AttachmentInput = { name: string; mime: string; dataUrl: string };
export type SavedAttachment = { id: string; name: string; mime: string; path: string; url: string; size: number };

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
  attachments: { save(input: AttachmentInput): Promise<SavedAttachment> };
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

export type ChatMsg = { id: string; who: 'user' | 'otto' | 'error'; text: string; streamId?: string };

const MESSAGES_KEY = 'otto.chat.messages.v1';

function readStoredMessages(): ChatMsg[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? '[]') as ChatMsg[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => typeof m?.id === 'string' && typeof m.text === 'string' && (m.who === 'user' || m.who === 'otto' || m.who === 'error'))
      .slice(-200);
  } catch {
    return [];
  }
}

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
  const [messages, setMessages] = useState<ChatMsg[]>(readStoredMessages);
  const [busy, setBusy] = useState(false);
  const activeAssistantStream = useRef<string | null>(null);
  const sendError = useRef<string | null>(null);

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
            return [...x, { id: streamId, who: 'otto', text: t, streamId }];
          });
        }
      } else if (m.type === 'error') {
        sendError.current = String((m as { message?: unknown }).message ?? 'error');
        activeAssistantStream.current = null;
        setMessages((x) => [...x, { id: `error-${Date.now()}`, who: 'error', text: String((m as { message?: unknown }).message ?? 'error') }]);
        setBusy(false);
      } else if (m.type === 'result') {
        activeAssistantStream.current = null;
        setBusy(false);
      }
    });
    return off;
  }, [api]);

  useEffect(() => {
    try { localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-200))); } catch { /* best effort */ }
  }, [messages]);

  const retry = async () => {
    if (api) setStatus(await api.runtime.init());
  };

  const updateStatus = (next: RuntimeStatus) => {
    setStatus(next);
  };

  const send = async (text: string) => {
    if (!api || !status?.ready || busy) return;
    sendError.current = null;
    activeAssistantStream.current = null;
    setMessages((x) => [...x, { id: `user-${Date.now()}`, who: 'user', text }]);
    setBusy(true);
    await api.runtime.send(text);
    if (sendError.current) throw new Error(sendError.current);
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
