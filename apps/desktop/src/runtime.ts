import { useEffect, useRef, useState } from 'react';
import type {
  Charter,
  CharterRef,
  CharterStatus,
  PracticeRecord,
  PracticeReference,
  Receipt,
  RoutineRecord,
  CurationProposalRecord,
  CreateProposalFromCorrectionInput,
  DecideProposalInput,
  AutonomyPolicy,
  AutonomyPolicyResult,
  AutonomyActionEvaluation,
  StandardCitation,
  StandardRecord,
  StandardsRegistry,
  KnowledgeListResult,
  KnowledgeRegistrySummary,
  SkillListResult,
  SkillRecord,
  ChannelListResult,
  ChannelRecord,
  TicketListResult,
  TicketRecord,
  TicketCompileInput,
  WorkerListResult,
  WorkerRecord,
  WorkerStatus,
  RunListResult,
  RunSummary,
  ApprovalListResult,
  ApprovalRecord,
} from '@otto-haus/core';

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
  transportMode?: 'sdk' | 'ws' | 'auto';
  effectiveTransport?: 'sdk subprocess' | 'websocket local';
  transportFallbackReason?: string | null;
  lastReconnectAt?: string | null;
  wsListenerPort?: number | null;
  cliPath: string;
  cliResolved: boolean;
};

export type ConnectionInfo = { baseUrl: string | null; agentId: string | null };
export type ConnectionInput = { baseUrl?: string | null; agentId?: string | null };
export type EffortLevel = 'off' | 'low' | 'medium' | 'high' | 'max';
export type RuntimePreferences = { modelHandle?: string | null; effort?: EffortLevel };
export type AttachmentInput = { name: string; mime: string; dataUrl: string };
export type SavedAttachment = { id: string; name: string; mime: string; path: string; url: string; size: number };
export type ReceiptStatus = 'success' | 'blocked' | 'failed';

export type ReceiptSummary = {
  id: string;
  timestamp: string;
  status: ReceiptStatus;
  action: string;
  subjectType: Receipt['subject']['type'];
  subjectId: string | null;
  summary: string;
  blockerCode: string | null;
  evidenceCount: number;
  practiceSlug: string | null;
  routineSlug: string | null;
  path: string;
};

export type ReceiptDetail = Receipt & { path: string };

export type ReceiptListResult = {
  dir: string;
  receipts: ReceiptSummary[];
  skipped: number;
};

export type { CharterStatus };

export type CharterCreateInput = {
  slug: string;
  objective: string;
  title?: string;
  status?: CharterStatus;
  acceptanceCriteria: Array<{ id: string; text: string; receipts?: string[] }>;
  runIds?: string[];
  receiptIds?: string[];
};

export type CharterDetail = Charter & { root: string; path: string };

export type CharterListResult = {
  dir: string;
  charters: CharterRef[];
};

export type CharterMutationResult = {
  charter: Charter;
  path: string;
  receipt: Receipt & { path: string };
};

export type StandardListResult = {
  dir: string;
  registryPath: string;
  registry: StandardsRegistry;
  standards: StandardRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
};

export type PracticeListResult = {
  dir: string;
  practices: PracticeRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
};

export type RoutineListResult = {
  dir: string;
  routines: RoutineRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
};

export type RoutineActivationGate = {
  slug: string;
  requiresApproval: boolean;
  scheduled: boolean;
  allowed: boolean;
  reason: string;
};

export type RoutineManualRunResult = {
  routine: RoutineRecord;
  receipt: Receipt & { path: string };
};

export type ProposalListResult = {
  dir: string;
  proposals: CurationProposalRecord[];
  skipped: number;
  storage: 'files';
};

export type CreateProposalResult = {
  proposal: CurationProposalRecord;
  receipt: Receipt & { path: string };
};

export type DecideProposalResult = {
  proposal: CurationProposalRecord;
  receipt: Receipt & { path: string };
  blocked?: boolean;
};

export type EvaluateAutonomyActionResult = {
  evaluation: AutonomyActionEvaluation;
  receipt: Receipt & { path: string };
};

export type {
  StandardCitation,
  StandardRecord,
  StandardsRegistry,
  PracticeRecord,
  PracticeReference,
  RoutineRecord,
  CurationProposalRecord,
  CreateProposalFromCorrectionInput,
  DecideProposalInput,
  AutonomyPolicy,
  AutonomyPolicyResult,
  AutonomyActionEvaluation,
  KnowledgeListResult,
  KnowledgeRegistrySummary,
  SkillListResult,
  SkillRecord,
  ChannelListResult,
  ChannelRecord,
  TicketListResult,
  TicketRecord,
  TicketCompileInput,
  WorkerListResult,
  WorkerRecord,
  WorkerStatus,
  RunListResult,
  RunSummary,
  ApprovalListResult,
  ApprovalRecord,
};

export type OttoEvent =
  | { message: { type: string; [k: string]: unknown } }
  | { status: RuntimeStatus };

type OttoApi = {
  runtime: {
    init(): Promise<RuntimeStatus>;
    newChat(): Promise<RuntimeStatus>;
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
  receipts: {
    list(): Promise<ReceiptListResult>;
    get(id: string): Promise<ReceiptDetail | null>;
  };
  charters: {
    list(): Promise<CharterListResult>;
    get(slug: string): Promise<CharterDetail | null>;
    create(input: CharterCreateInput): Promise<CharterMutationResult>;
    updateStatus(slug: string, status: CharterStatus, summary?: string): Promise<CharterMutationResult>;
    linkRunReceipt(slug: string, input: { runId?: string; receiptId?: string; summary?: string }): Promise<CharterMutationResult>;
  };
  standards: {
    list(): Promise<StandardListResult>;
    get(slug: string): Promise<StandardRecord | null>;
    citationsForText(text: string): Promise<StandardCitation[]>;
  };
  practices: {
    list(): Promise<PracticeListResult>;
    get(slug: string): Promise<PracticeRecord | null>;
    resolveForText(text: string): Promise<PracticeReference | null>;
  };
  routines: {
    list(): Promise<RoutineListResult>;
    get(slug: string): Promise<RoutineRecord | null>;
    activationGate(slug: string): Promise<RoutineActivationGate>;
    runManual(slug: string): Promise<RoutineManualRunResult>;
  };
  curation: {
    proposals: {
      list(): Promise<ProposalListResult>;
      get(id: string): Promise<CurationProposalRecord | null>;
      createFromCorrection(input: CreateProposalFromCorrectionInput): Promise<CreateProposalResult>;
      decide(id: string, input: DecideProposalInput): Promise<DecideProposalResult>;
    };
    approvals: {
      list(): Promise<ApprovalListResult>;
    };
  };
  knowledge: {
    list(): Promise<KnowledgeListResult>;
    resolveRole(role: string): Promise<{ provider: string; model: string; status: 'proposed' | 'active' } | null>;
  };
  skills: {
    list(): Promise<SkillListResult>;
    get(slug: string): Promise<SkillRecord | null>;
  };
  channels: {
    list(): Promise<ChannelListResult>;
  };
  tickets: {
    list(): Promise<TicketListResult>;
    get(ticketId: string): Promise<TicketRecord | null>;
    compile(input: TicketCompileInput): Promise<{ ticket: TicketRecord; receipt: Receipt & { path: string } }>;
    orchestrate(input: TicketCompileInput & { repoRoot?: string }): Promise<{
      ticket: TicketRecord;
      worker: WorkerRecord;
      run: RunSummary;
      worktreePath: string;
      receipt: Receipt & { path: string };
    }>;
  };
  workers: {
    list(): Promise<WorkerListResult>;
    updateStatus(id: string, status: WorkerStatus, receiptId?: string): Promise<WorkerRecord | null>;
  };
  runs: {
    list(): Promise<RunListResult>;
  };
  autonomy: {
    policy(): Promise<AutonomyPolicyResult>;
    evaluateAction(input: { action: string; context?: string }): Promise<EvaluateAutonomyActionResult>;
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

  const newChat = async () => {
    if (!api) return;
    sendError.current = null;
    activeAssistantStream.current = null;
    setBusy(false);
    setMessages([]);
    try { localStorage.removeItem(MESSAGES_KEY); } catch { /* best effort */ }
    setStatus(await api.runtime.newChat());
  };

  return { electron: !!api, status, messages, busy, send, abort, retry, newChat, updateStatus, configure };
}
