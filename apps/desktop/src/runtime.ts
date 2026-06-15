import { useCallback, useEffect, useRef, useState } from 'react';
import type { RuntimeSendPayload } from './attachment-message';
import { flushMessages, readStoredMessages, type StoredChatMsg } from './chat/message-storage';
import {
  loadThreadMessages,
  loadThreadMessagesForView,
  persistActiveThread,
  persistLeavingThread,
} from './chat/thread-messages';
import { activityFromRuntimeMessage, type TurnActivity } from './chat/turn-activity';
import { mergeToolResult, type ToolActivity } from './chat/tool-activity';
import { currentTurnAssistantIndex, type TurnTrail } from './chat/turn-trail';
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
  | 'usage-limit'
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
export type LettaModelOption = {
  handle: string;
  label: string;
  provider?: string | null;
  displayName?: string | null;
  deprecated?: boolean;
};
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

export type {
  OttoConfig,
  LabsConfig,
  LabFeatureId,
  TicketReviewRecord,
  ProviderMirrorSnapshot,
  DreamSettings,
  DreamTrigger,
  ConversationSortMode,
} from '../electron/shared/types';
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

export const ottoApi = (): OttoApi | null =>
  typeof window !== 'undefined' && window.otto ? window.otto : null;
export const isElectron = (): boolean => ottoApi() !== null;

export type { TurnActivity } from './chat/turn-activity';
export type { TurnTrail, TurnSpan } from './chat/turn-trail';

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

export type TodoItem = {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
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

function readToolCall(event: Record<string, unknown>) {
  const toolCallId = String(event.toolCallId ?? event.tool_call_id ?? '');
  const toolName = String(event.toolName ?? event.tool_name ?? 'tool');
  const toolInput = (event.toolInput ?? event.tool_input ?? {}) as Record<string, unknown>;
  return { toolCallId, toolName, toolInput };
}

function readToolResult(event: Record<string, unknown>) {
  const toolCallId = String(event.toolCallId ?? event.tool_call_id ?? '');
  const content = String(event.content ?? event.output ?? '');
  const isError = Boolean(event.isError ?? event.is_error);
  return { toolCallId, content, isError };
}

function upsertToolCall(
  messages: ChatMsg[],
  toolCallId: string,
  toolName: string,
  toolInput: Record<string, unknown>,
  at: string,
): ChatMsg[] {
  const existingIdx = messages.findIndex((msg) => msg.toolActivity?.toolCallId === toolCallId);
  const activity: ToolActivity = {
    toolCallId,
    toolName,
    toolInput,
    status: 'running',
    startedAt: at,
  };
  if (existingIdx >= 0) {
    return messages.map((msg, idx) => (idx === existingIdx ? { ...msg, at, toolActivity: activity } : msg));
  }
  return [
    ...messages,
    {
      id: toolCallId || `tool-${Date.now()}`,
      who: 'tool',
      text: '',
      at,
      toolActivity: activity,
    },
  ];
}

function applyToolResult(messages: ChatMsg[], toolCallId: string, content: string, isError: boolean, endedAt: string): ChatMsg[] {
  const next = messages.map((msg) => ({ ...msg, toolActivity: msg.toolActivity ? { ...msg.toolActivity } : undefined }));
  if (!mergeToolResult(next, toolCallId, content, isError, endedAt)) return messages;
  return next;
}

export function useRuntime() {
  const api = ottoApi();
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeTodos, setActiveTodos] = useState<TodoItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [turnActivity, setTurnActivity] = useState<TurnActivity | null>(null);
  const [turnTrail, setTurnTrail] = useState<TurnTrail | null>(null);
  const pendingTurnTrail = useRef<TurnTrail | null>(null);
  const activeAssistantStream = useRef<string | null>(null);
  const sendError = useRef<string | null>(null);
  const activeThreadRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMsg[]>([]);
  const threadHydrated = useRef(false);
  const threadMessagesCache = useRef(new Map<string, ChatMsg[]>());
  /** Thread that owns the in-flight Letta turn — events route here, not to the active view. */
  const inflightThreadRef = useRef<string | null>(null);

  const applyThreadView = (threadId: string, opts?: { allowLegacyFallback?: boolean }) => {
    persistLeavingThread(
      threadMessagesCache.current,
      activeThreadRef.current,
      threadId,
      messagesRef.current,
    );
    const loaded = loadThreadMessagesForView(threadId, threadMessagesCache.current, {
      allowLegacyFallback: opts?.allowLegacyFallback,
    });
    activeThreadRef.current = threadId;
    messagesRef.current = loaded;
    setActiveThreadId(threadId);
    setMessages(loaded);
    setActiveTodos([]);
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
      const threadId = result.activeThreadId;
      if (!threadId) return;
      threadHydrated.current = true;
      activeThreadRef.current = threadId;
      const loaded = loadThreadMessagesForView(threadId, threadMessagesCache.current, { allowLegacyFallback: true });
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
      const allowLegacyFallback = !threadHydrated.current;
      threadHydrated.current = true;
      if (status) setStatus(status);
      if (activeThreadRef.current === threadId) {
        // Already showing this thread — avoid clobbering in-memory history on IPC refresh.
        return;
      }
      applyThreadView(threadId, { allowLegacyFallback });
    });
  }, [api]);

  useEffect(() => {
    if (!api) return;
    setStatus((current) => current ?? {
      ready: false,
      reason: 'Booting local Letta session…',
      cliPath: '',
      cliResolved: false,
    });
    const patchInflightMessages = (updater: (msgs: ChatMsg[]) => ChatMsg[]) => {
      const threadId = inflightThreadRef.current;
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

    const attachTrailToLastAssistant = (trail: TurnTrail) => {
      if (!trail.spans.length) return;
      patchInflightMessages((msgs) => {
        const realIdx = currentTurnAssistantIndex(msgs);
        if (realIdx < 0) return msgs;
        const target = msgs[realIdx];
        if (!target) return msgs;
        const next = [...msgs];
        next[realIdx] = { ...target, trail };
        return next;
      });
    };

    const finalizeTurnTrail = (trail: TurnTrail | null) => {
      const resolved = trail ?? pendingTurnTrail.current;
      if (resolved?.spans.length) attachTrailToLastAssistant(resolved);
      pendingTurnTrail.current = null;
      setTurnTrail(null);
    };

    api.runtime
      .init()
      .then(async (nextStatus) => {
        setStatus(nextStatus);
        try {
          const result = await api.threads.list();
          const threadId = result.activeThreadId;
          if (!threadId) return;
          const allowLegacyFallback = !threadHydrated.current;
          threadHydrated.current = true;
          if (activeThreadRef.current === threadId) {
            setActiveThreadId((current) => current ?? threadId);
            return;
          }
          activeThreadRef.current = threadId;
          const loaded = loadThreadMessagesForView(threadId, threadMessagesCache.current, {
            allowLegacyFallback,
          });
          messagesRef.current = loaded;
          setActiveThreadId(threadId);
          setMessages(loaded);
        } catch {
          // threads.list is retried by the dedicated hydration effect.
        }
      })
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
          setTurnActivity(null);
          const streamId = String(m.uuid ?? m.runId ?? 'assistant');
          const at = new Date().toISOString();
          patchInflightMessages((x) => {
            const last = x[x.length - 1];
            if (activeAssistantStream.current === streamId && last?.who === 'otto') {
              return [...x.slice(0, -1), { ...last, text: `${last.text}${t}` }];
            }
            activeAssistantStream.current = streamId;
            return [...x, { id: streamId, who: 'otto', text: t, streamId, at }];
          });
        }
      } else if (m.type === 'turn_trail' && m.trail && typeof m.trail === 'object') {
        const trail = m.trail as TurnTrail;
        pendingTurnTrail.current = trail;
        setTurnTrail(trail);
        if (m.final === true) finalizeTurnTrail(trail);
      } else if (m.type === 'todo_update' && Array.isArray(m.todos)) {
        const ownedTurn = inflightThreadRef.current ?? activeThreadRef.current;
        if (!ownedTurn || activeThreadRef.current === ownedTurn) {
          setActiveTodos(
            m.todos
              .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
              .map((item, index) => ({
                id: typeof item.id === 'string' && item.id ? item.id : `todo-${index}`,
                content: typeof item.content === 'string'
                  ? item.content
                  : typeof item.description === 'string'
                    ? item.description
                    : `Task ${index + 1}`,
                status: item.status === 'completed'
                  ? 'completed'
                  : item.status === 'in_progress'
                    ? 'in_progress'
                    : 'pending',
              })),
          );
        }
      } else if (m.type === 'tool_call') {
        setTurnActivity(null);
        const { toolCallId, toolName, toolInput } = readToolCall(m);
        const at = new Date().toISOString();
        patchInflightMessages((x) => upsertToolCall(x, toolCallId, toolName, toolInput, at));
      } else if (m.type === 'tool_result') {
        setTurnActivity(null);
        const { toolCallId, content, isError } = readToolResult(m);
        const endedAt = new Date().toISOString();
        patchInflightMessages((x) => applyToolResult(x, toolCallId, content, isError, endedAt));
      } else {
        const activity = activityFromRuntimeMessage(m);
        if (activity) setTurnActivity(activity);
      }
      if (m.type === 'error') {
        const ownedTurn = inflightThreadRef.current;
        const errorMessage = String((m as { message?: unknown }).message ?? 'error');
        const errorDetails = typeof (m as { details?: unknown }).details === 'string'
          ? String((m as { details?: unknown }).details)
          : undefined;
        sendError.current = errorMessage;
        activeAssistantStream.current = null;
        patchInflightMessages((x) => [
          ...x,
          {
            id: `error-${Date.now()}`,
            who: 'error',
            text: errorMessage,
            ...(errorDetails ? { details: errorDetails } : {}),
          },
        ]);
        setTurnActivity(null);
        // Attach/finalize the trail BEFORE clearing inflight — patchInflightMessages no-ops once
        // inflightThreadRef is null, so the order matters for trail persistence (blocker #1).
        finalizeTurnTrail(null);
        inflightThreadRef.current = null;
        if (!ownedTurn) setBusy(false);
      } else if (m.type === 'result') {
        activeAssistantStream.current = null;
        setTurnActivity(null);
        finalizeTurnTrail(null);
        inflightThreadRef.current = null;
        setBusy(false);
        const conversationId = typeof m.conversationId === 'string' ? m.conversationId : null;
        if (conversationId) {
          void api.threads.touch({ lettaConversationId: conversationId });
        }
        if ((m as { success?: boolean }).success === false) {
          const failed = m as { error?: unknown; reason?: unknown; message?: unknown };
          sendError.current = String(failed.error ?? failed.reason ?? failed.message ?? 'Send failed.');
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

  const send = useCallback(async (input: RuntimeSendPayload | string) => {
    if (!api) throw new Error('Chat is unavailable outside the desktop app.');
    if (!status?.ready) throw new Error(status?.reason ?? 'Runtime not ready — finish setup in Settings.');
    if (busy) throw new Error('Wait for the current reply to finish.');
    const sendThreadId = activeThreadRef.current;
    if (!sendThreadId) throw new Error('No active conversation thread yet.');
    const storedText = typeof input === 'string' ? input : input.storedText;
    sendError.current = null;
    activeAssistantStream.current = null;
    setActiveTodos([]);
    inflightThreadRef.current = sendThreadId;
    setTurnActivity(null);
    setTurnTrail(null);
    pendingTurnTrail.current = null;
    const snippet = storedText.trim().replace(/\s+/g, ' ');
    if (snippet) {
      void api.threads.touch({ title: snippet.length > 56 ? `${snippet.slice(0, 53)}…` : snippet });
    }
    const at = new Date().toISOString();
    const prev = loadThreadMessages(sendThreadId, threadMessagesCache.current);
    const next: ChatMsg[] = [...prev, { id: `user-${Date.now()}`, who: 'user', text: storedText, at }];
    threadMessagesCache.current.set(sendThreadId, next);
    flushMessages(sendThreadId, next);
    messagesRef.current = next;
    setMessages(next);
    setBusy(true);
    try {
      await api.runtime.send(input);
      if (sendError.current) throw new Error(sendError.current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (!sendError.current) {
        sendError.current = errorMessage;
        activeAssistantStream.current = null;
        const prevMsgs = loadThreadMessages(sendThreadId, threadMessagesCache.current);
        const withError: ChatMsg[] = [
          ...prevMsgs,
          { id: `error-${Date.now()}`, who: 'error', text: errorMessage },
        ];
        threadMessagesCache.current.set(sendThreadId, withError);
        flushMessages(sendThreadId, withError);
        if (activeThreadRef.current === sendThreadId) {
          messagesRef.current = withError;
          setMessages(withError);
        }
        setTurnActivity(null);
      }
      throw err;
    } finally {
      if (inflightThreadRef.current === sendThreadId) {
        inflightThreadRef.current = null;
      }
      // Owned-turn error events clear inflight before send() settles; still release busy here.
      setBusy(false);
    }
  }, [api, status, busy]);

  const abort = async () => {
    if (!api) return;
    await api.runtime.abort();
    activeAssistantStream.current = null;
    inflightThreadRef.current = null;
    setTurnActivity(null);
    setTurnTrail(null);
    pendingTurnTrail.current = null;
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
    if (busy) await abort();
    threadHydrated.current = true;
    sendError.current = null;
    activeAssistantStream.current = null;
    inflightThreadRef.current = null;
    setTurnActivity(null);
    setTurnTrail(null);
    pendingTurnTrail.current = null;
    setBusy(false);
    if (activeThreadRef.current) {
      persistActiveThread(threadMessagesCache.current, activeThreadRef.current, messagesRef.current);
    }
    const { thread, status: next } = await api.threads.create();
    applyThreadView(thread.id);
    setStatus(next);
  };

  const switchThread = async (threadId: string) => {
    if (!api) return;
    if (threadId === activeThreadRef.current) {
      applyThreadView(threadId);
      return;
    }
    if (busy) await abort();
    threadHydrated.current = true;
    sendError.current = null;
    activeAssistantStream.current = null;
    inflightThreadRef.current = null;
    setTurnActivity(null);
    setTurnTrail(null);
    pendingTurnTrail.current = null;
    setBusy(false);
    applyThreadView(threadId);
    try {
      const { thread, status: next } = await api.threads.switch(threadId);
      applyThreadView(thread.id);
      setStatus(next);
    } catch {
      // Still swap local history even if Letta reconnect fails mid-switch.
      applyThreadView(threadId);
    }
  };

  const archiveThread = async (threadId: string) => {
    if (!api) return;
    if (busy) await abort();
    await api.threads.archive(threadId);
    const result = await api.threads.list();
    const nextThreadId = result.activeThreadId;
    if (nextThreadId) {
      applyThreadView(nextThreadId);
      setStatus(await api.runtime.init());
      return;
    }
    const { thread, status: next } = await api.threads.create();
    applyThreadView(thread.id);
    setStatus(next);
  };

  const refreshThreads = async () => {
    if (!api) return null;
    return api.threads.list();
  };

  return {
    electron: !!api,
    status,
    messages,
    activeTodos,
    busy,
    turnActivity,
    turnTrail,
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
