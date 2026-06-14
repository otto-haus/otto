import { useCallback, useEffect, useRef, useState } from 'react';
import { flushMessages, migrateLegacyMessagesToThread, readStoredMessages, type StoredChatMsg } from './chat/message-storage';
import type {
  Charter,
  CharterRef,
  CharterStatus,
  CheckRunResult,
  PracticeRecord,
  PracticeReference,
  Receipt,
  RoutineRecord,
  CurationProposalRecord,
  CreateProposalFromCorrectionInput,
  DecideProposalInput,
  ProposalClassification,
  ProposalTarget,
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
export type LettaModelOption = { handle: string; label: string; provider?: string | null; displayName?: string | null };
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

export type PracticeMetricsSnapshot = {
  slug: string;
  uses: number;
  last_used_at: string | null;
  successful_runs: number;
  blocked_runs: number;
  last_run_id?: string;
  last_receipt_id?: string;
  last_receipt_path?: string;
};

export type PracticeRunPayload = {
  note?: string;
  raw_note?: string;
  source?: { who?: string; role?: string; where?: string; when?: string };
  acceptance_criteria?: Array<{ id: string; text: string; proof?: string; receipts?: string[] }>;
  review?: { verdict?: string; evidence?: string[]; reviewed_at?: string };
  evidence?: string[];
  artifacts?: string[];
  intent?: string;
};

export type PracticeRunInput = {
  slug: string;
  invocation?: string;
  payload?: PracticeRunPayload;
  approved?: boolean;
};

export type PracticeRunResult = {
  practice: PracticeRecord;
  invocation: string;
  run: RunSummary;
  receipt: Receipt & { path: string };
  artifactPath?: string;
  blocked: boolean;
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
  compiledCheckId?: string | null;
};

export type EvaluateAutonomyActionResult = {
  evaluation: AutonomyActionEvaluation;
  receipt: Receipt & { path: string };
  check_results?: CheckRunResult[];
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
  ProposalClassification,
  ProposalTarget,
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
} from '@otto-haus/core';

export type {
  CogneeHealth,
  CogneeCaptureReceipt,
} from '@otto-haus/core';

export type { OttoConfig, LabsConfig, LabFeatureId, TicketReviewRecord, ProviderMirrorSnapshot } from '../electron/shared/types';
export type {
  StandardConflictResult,
  MemoryListResult,
  MemoryBlockRecord,
  CogneeRecallSmokeResult,
  PgvectorStatus,
} from '../electron/shared/types';

import type { OttoApi } from '../electron/preload';

export type { OttoApi };

export type OttoEvent =
  | { message: { type: string; [k: string]: unknown } }
  | { status: RuntimeStatus };

declare global {
  interface Window {
    otto?: OttoApi;
  }
}

export type OttoBridge = OttoApi;

let cachedOttoApi: OttoApi | null | undefined;

export const ottoApi = (): OttoApi | null => {
  if (cachedOttoApi !== undefined) return cachedOttoApi;
  cachedOttoApi = typeof window !== 'undefined' && window.otto ? window.otto : null;
  return cachedOttoApi;
};
export const isElectron = (): boolean => ottoApi() !== null;

export type ChatMsg = StoredChatMsg & {
  checkBlock?: {
    checkName: string;
    message: string;
    receiptId?: string;
    standardId?: string;
  };
  receiptInline?: {
    id: string;
    status: 'success' | 'blocked' | 'failed';
    action: string;
    summary: string;
    authority?: string;
  };
};

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

function loadThreadMessages(
  threadId: string | null,
  cache: Map<string, ChatMsg[]>,
): ChatMsg[] {
  if (!threadId) return [];
  const cached = cache.get(threadId);
  if (cached) return cached;
  migrateLegacyMessagesToThread(threadId);
  const loaded = readStoredMessages(threadId);
  cache.set(threadId, loaded);
  return loaded;
}

function shouldAutoTitleThread(title: string | null | undefined): boolean {
  const t = (title ?? '').trim();
  if (!t) return true;
  if (/^new chat$/i.test(t)) return true;
  if (/^chat session$/i.test(t)) return true;
  if (/^local_/i.test(t)) return true;
  if (/^\d{3}-(?:rev\d+-|smoke-)?thread-[ab]-\d{12,14}$/i.test(t)) return true;
  return false;
}

export function useRuntime() {
  const api = ottoApi();
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const activeAssistantStream = useRef<string | null>(null);
  const seenAssistantChunks = useRef(new Set<string>());
  const sendError = useRef<string | null>(null);
  const activeThreadRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMsg[]>([]);
  const threadHydrated = useRef(false);
  const runtimeInitialized = useRef(false);
  const threadMessagesCache = useRef(new Map<string, ChatMsg[]>());
  /** Thread that owns the in-flight Letta turn — events route here, not to the active view. */
  const inflightThreadRef = useRef<string | null>(null);

  const applyThreadView = (threadId: string, opts?: { persistLeaving?: boolean }) => {
    const leaving = activeThreadRef.current;
    if (opts?.persistLeaving !== false && leaving && leaving !== threadId) {
      threadMessagesCache.current.set(leaving, messagesRef.current);
      flushMessages(leaving, messagesRef.current);
    }
    const loaded = loadThreadMessages(threadId, threadMessagesCache.current);
    activeThreadRef.current = threadId;
    messagesRef.current = loaded;
    setActiveThreadId(threadId);
    setMessages(loaded);
  };

  useEffect(() => {
    activeThreadRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!api) {
      setMessages(readStoredMessages(null));
      return;
    }
    let cancelled = false;
    void api.threads.list().then((result) => {
      if (cancelled || threadHydrated.current) return;
      threadHydrated.current = true;
      const threadId = result.activeThreadId;
      activeThreadRef.current = threadId;
      const loaded = loadThreadMessages(threadId, threadMessagesCache.current);
      messagesRef.current = loaded;
      setActiveThreadId(threadId);
      setMessages(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!api?.onActiveThread) return;
    return api.onActiveThread(({ threadId, status }) => {
      threadHydrated.current = true;
      if (status) setStatus(status);
      if (activeThreadRef.current === threadId) {
        const loaded = loadThreadMessages(threadId, threadMessagesCache.current);
        messagesRef.current = loaded;
        setMessages(loaded);
        return;
      }
      applyThreadView(threadId);
    });
  }, [api]);

  useEffect(() => {
    if (!api || runtimeInitialized.current) return;
    runtimeInitialized.current = true;
    setStatus((current) => current ?? {
      ready: false,
      reason: 'Booting local Letta session…',
      cliPath: '',
      cliResolved: false,
    });
    api.runtime
      .init()
      .then(async (nextStatus) => {
        setStatus(nextStatus);
        if (threadHydrated.current) return;
        try {
          const result = await api.threads.list();
          threadHydrated.current = true;
          const threadId = result.activeThreadId;
          if (!threadId) return;
          activeThreadRef.current = threadId;
          const loaded = loadThreadMessages(threadId, threadMessagesCache.current);
          messagesRef.current = loaded;
          setActiveThreadId(threadId);
          setMessages(loaded);
        } catch {
          // threads.list is retried by the dedicated hydration effect.
        }
      })
      .catch((e) => setStatus({ ready: false, reason: String(e), cliPath: '', cliResolved: false }));
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const patchInflightMessages = (updater: (msgs: ChatMsg[]) => ChatMsg[]) => {
      const threadId = inflightThreadRef.current ?? activeThreadRef.current;
      if (!threadId) return;
      const prev = loadThreadMessages(threadId, threadMessagesCache.current);
      const next = updater(prev);
      threadMessagesCache.current.set(threadId, next);
      flushMessages(threadId, next);
      if (activeThreadRef.current === threadId) {
        messagesRef.current = next;
        setMessages(next);
      }
    };

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
          const chunkId = typeof m.chunkId === 'string' && m.chunkId ? `${streamId}:${m.chunkId}` : null;
          if (chunkId && seenAssistantChunks.current.has(chunkId)) return;
          if (chunkId) seenAssistantChunks.current.add(chunkId);
          patchInflightMessages((x) => {
            const last = x[x.length - 1];
            if (activeAssistantStream.current === streamId && last?.who === 'otto') {
              return [...x.slice(0, -1), { ...last, text: `${last.text}${t}` }];
            }
            activeAssistantStream.current = streamId;
            return [...x, { id: streamId, who: 'otto', text: t, streamId }];
          });
        }
      } else if (m.type === 'error') {
        const ownedTurn = inflightThreadRef.current;
        sendError.current = String((m as { message?: unknown }).message ?? 'error');
        activeAssistantStream.current = null;
        seenAssistantChunks.current.clear();
        patchInflightMessages((x) => [
          ...x,
          { id: `error-${Date.now()}`, who: 'error', text: String((m as { message?: unknown }).message ?? 'error') },
        ]);
        inflightThreadRef.current = null;
        if (!ownedTurn) setBusy(false);
      } else if (m.type === 'result') {
        activeAssistantStream.current = null;
        seenAssistantChunks.current.clear();
        inflightThreadRef.current = null;
        const conversationId = typeof m.conversationId === 'string' ? m.conversationId : null;
        if (conversationId) {
          void api.threads.touch({ lettaConversationId: conversationId });
        }
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

  const send = useCallback(async (text: string) => {
    if (!api) throw new Error('Chat is unavailable outside the desktop app.');
    if (!status?.ready) throw new Error(status?.reason ?? 'Runtime not ready — finish setup in Settings.');
    if (busy) throw new Error('Wait for the current reply to finish.');
    const sendThreadId = activeThreadRef.current;
    if (!sendThreadId) throw new Error('No active conversation thread yet.');
    sendError.current = null;
    activeAssistantStream.current = null;
    seenAssistantChunks.current.clear();
    inflightThreadRef.current = sendThreadId;
    const snippet = text.trim().replace(/\s+/g, ' ');
    if (snippet) {
      void api.threads.list().then((result) => {
        if (activeThreadRef.current !== sendThreadId) return;
        const active = result.threads.find((thread) => thread.id === sendThreadId);
        if (!shouldAutoTitleThread(active?.title)) return;
        void api.threads.touch({ title: snippet.length > 56 ? `${snippet.slice(0, 53)}…` : snippet });
      });
    }
    const prev = loadThreadMessages(sendThreadId, threadMessagesCache.current);
    const next: ChatMsg[] = [...prev, { id: `user-${Date.now()}`, who: 'user', text }];
    threadMessagesCache.current.set(sendThreadId, next);
    flushMessages(sendThreadId, next);
    messagesRef.current = next;
    setMessages(next);
    setBusy(true);
    try {
      await api.runtime.send(text);
      if (sendError.current) throw new Error(sendError.current);
    } finally {
      inflightThreadRef.current = null;
      setBusy(false);
    }
  }, [api, status, busy]);

  const abort = async () => {
    if (!api) return;
    await api.runtime.abort();
    activeAssistantStream.current = null;
    seenAssistantChunks.current.clear();
    inflightThreadRef.current = null;
    setBusy(false);
  };

  const configure = async (input: RuntimePreferences) => {
    if (!api || busy) return status;
    setStatus((current) => ({
      ...(current ?? { cliPath: '', cliResolved: false }),
      ready: false,
      code: 'error',
      reason: 'Switching model…',
    }));
    const next = await api.runtime.configure(input);
    setStatus(next);
    return next;
  };

  const newChat = async () => {
    if (!api) return;
    if (busy) await abort();
    threadHydrated.current = true;
    sendError.current = null;
    activeAssistantStream.current = null;
    inflightThreadRef.current = null;
    setBusy(false);
    setStatus((current) => ({
      ...(current ?? { cliPath: '', cliResolved: false }),
      ready: false,
      code: 'error',
      reason: 'Starting a new conversation…',
    }));
    if (activeThreadRef.current) {
      applyThreadView(activeThreadRef.current, { persistLeaving: true });
    }
    const { thread, status: next } = await api.threads.create();
    applyThreadView(thread.id, { persistLeaving: false });
    setStatus(next);
  };

  const switchThread = async (threadId: string) => {
    if (!api) return;
    if (threadId === activeThreadRef.current) {
      applyThreadView(threadId, { persistLeaving: false });
      return;
    }
    if (busy) await abort();
    threadHydrated.current = true;
    sendError.current = null;
    activeAssistantStream.current = null;
    inflightThreadRef.current = null;
    setBusy(false);
    setStatus((current) => ({
      ...(current ?? { cliPath: '', cliResolved: false }),
      ready: false,
      code: 'error',
      reason: 'Switching conversation…',
    }));
    if (activeThreadRef.current) {
      threadMessagesCache.current.set(activeThreadRef.current, messagesRef.current);
      flushMessages(activeThreadRef.current, messagesRef.current);
    }
    applyThreadView(threadId, { persistLeaving: false });
    try {
      const { thread, status: next } = await api.threads.switch(threadId);
      applyThreadView(thread.id, { persistLeaving: false });
      setStatus(next);
    } catch {
      // Still swap local history even if Letta reconnect fails mid-switch.
      applyThreadView(threadId, { persistLeaving: false });
    }
  };

  const archiveThread = async (threadId: string) => {
    if (!api) return;
    if (busy) await abort();
    const wasActive = activeThreadRef.current === threadId;
    if (wasActive && activeThreadRef.current) {
      threadMessagesCache.current.set(activeThreadRef.current, messagesRef.current);
      flushMessages(activeThreadRef.current, messagesRef.current);
      setStatus((current) => ({
        ...(current ?? { cliPath: '', cliResolved: false }),
        ready: false,
        code: 'error',
        reason: 'Switching conversation…',
      }));
    }
    const { thread, status: next } = await api.threads.archive(threadId);
    if (wasActive) {
      applyThreadView(thread.id, { persistLeaving: false });
      setStatus(next);
    }
  };

  const refreshThreads = async () => {
    if (!api) return null;
    return api.threads.list();
  };

  return {
    electron: !!api,
    status,
    messages,
    busy,
    activeThreadId,
    send,
    abort,
    retry,
    newChat,
    switchThread,
    archiveThread,
    refreshThreads,
    updateStatus,
    configure,
  };
}
