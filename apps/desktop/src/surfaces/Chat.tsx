import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/icons';
import { AppSourceBadge } from '../components/AppSourceBadge';
import { useToast } from '../components/Toast';
import { requiredMissing, isReady } from '../readiness';
import { isElectron, ottoApi, type EffortLevel, type LettaModelOption, type SavedAttachment } from '../runtime';
import { useRuntimeContext } from '../RuntimeContext';
import type { SurfaceId } from '../components/Sidebar';
import { OttoMark } from '../components/OttoMark';
import { CheckBlockBanner, MessageActions, Modal, PermissionCard, ReceiptInlineCard, type PermissionDecision, type PermissionRequestView } from '../components/ui';
import { displayThreadTitle } from '../components/ui/ThreadList';
import { chatCopy, permissionCopy, toastCopy } from '../copy/surfaces';
import { useChatThreads } from '../chat/useChatThreads';
import { notifyOnboardingFirstMessage } from '../onboarding-storage';
import { ProposeCorrectionModal, type ProposeCorrectionContext } from '../chat/ProposeCorrectionModal';
import { runTicketCommand } from '../chat/ticket-commands';
import {
  clearInFlight,
  createQueueItem,
  nextQueueItemForThread,
  persistInFlight,
  previewQueueText,
  QUEUE_KEY,
  queueDisplayItemsForThread,
  queueMatchesThread,
  readQueue,
  retryFailedQueueItemsForThread,
  type QueueDisplayItem,
  type QueueItem,
} from '../chat/queue-storage';
import type { ProposalTarget } from '@otto-haus/core';
import type { ChatMsg } from '../runtime';

// In Electron (window.otto present) → the runtime-wired LiveChat.
// In the web preview → the file-backed PreviewChat (unchanged).
export const Chat: React.FC<{
  onOpenSettings?: () => void;
  onNavigate?: (id: SurfaceId) => void;
  sidebarHidden?: boolean;
  onToggleSidebar?: () => void;
}> = ({
  onOpenSettings,
  onNavigate,
  sidebarHidden = false,
  onToggleSidebar,
}) =>
  isElectron()
    ? <LiveChat onOpenSettings={onOpenSettings} onNavigate={onNavigate} sidebarHidden={sidebarHidden} onToggleSidebar={onToggleSidebar} />
    : <PreviewChat />;

/* ---------- LiveChat (Electron, wired to the Letta runtime) ---------- */
type AttachmentDraft = SavedAttachment & { previewUrl: string };

const DRAFT_KEY = 'otto.chat.draft.v1';
const ATTACHMENTS_KEY = 'otto.chat.attachments.v1';

const FALLBACK_MODEL_OPTIONS: LettaModelOption[] = [
  { label: 'GPT-5.5 (ChatGPT)', handle: 'chatgpt-plus-pro/gpt-5.5' },
  { label: 'GPT-5.5 (OpenAI)', handle: 'openai/gpt-5.5' },
  { label: 'Auto', handle: 'letta/auto' },
];

const EFFORT_OPTIONS: Array<{ label: string; value: EffortLevel }> = [
  { label: 'Off', value: 'off' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Max', value: 'max' },
];

const labelForModel = (value?: string | null, options: LettaModelOption[] = FALLBACK_MODEL_OPTIONS) =>
  options.find((m) => m.handle === value)?.label ?? value ?? 'Agent default';
const labelForEffort = (value?: EffortLevel) => EFFORT_OPTIONS.find((e) => e.value === value)?.label ?? 'High';

const formatRuntimeSubtitle = (ready: boolean, reason: string | undefined, modelLabel: string): string => {
  if (ready) return modelLabel;
  const text = reason?.trim() ?? 'connecting…';
  if (text.length <= 96) return text;
  return `${text.slice(0, 93)}…`;
};

const ModelEffortPickers: React.FC<{
  busy: boolean;
  selectedModel: string | null;
  selectedEffort: EffortLevel;
  modelOpen: boolean;
  effortOpen: boolean;
  onToggleModel: () => void;
  onToggleEffort: () => void;
  onClose: () => void;
  onSelectModel: (value: string) => void;
  onSelectEffort: (value: EffortLevel) => void;
  modelOptions: LettaModelOption[];
  compact?: boolean;
  menuPlacement?: 'up' | 'down';
}> = ({
  busy,
  selectedModel,
  selectedEffort,
  modelOpen,
  effortOpen,
  onToggleModel,
  onToggleEffort,
  onClose,
  onSelectModel,
  onSelectEffort,
  modelOptions,
  compact = false,
  menuPlacement = 'up',
}) => (
  <div className={`promptControls${compact ? ' promptControls--head' : ''}`} onClick={(e) => e.stopPropagation()}>
    <div className="picker" data-open={modelOpen ? 'true' : 'false'}>
      <button
        type="button"
        className="picker__button"
        onClick={onToggleModel}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={modelOpen}
        aria-label={`Model: ${labelForModel(selectedModel, modelOptions)}`}
      >
        <span>{labelForModel(selectedModel, modelOptions)}</span>
        <span className="picker__chev">›</span>
      </button>
      {modelOpen && (
        <div
          className={`picker__menu picker__menu--model${menuPlacement === 'down' ? ' picker__menu--down' : ''}`}
          role="menu"
          aria-label={chatCopy.selectModelTitle}
        >
          <div className="picker__title">{chatCopy.selectModelTitle}</div>
          {modelOptions.map((m) => (
            <button
              type="button"
              key={m.handle}
              role="menuitemradio"
              aria-checked={selectedModel === m.handle}
              className={`picker__option${selectedModel === m.handle ? ' is-selected' : ''}`}
              onClick={() => {
                onClose();
                onSelectModel(m.handle);
              }}
            >
              <span>{m.label}</span>
              <span className="mono faint">{m.handle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
    <div className="picker" data-open={effortOpen ? 'true' : 'false'}>
      <button
        type="button"
        className="picker__button picker__button--effort"
        onClick={onToggleEffort}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={effortOpen}
        aria-label={`Reasoning effort: ${labelForEffort(selectedEffort)}`}
      >
        <span>{labelForEffort(selectedEffort)}</span>
        <span className="effortDots" aria-hidden="true">
          {EFFORT_OPTIONS.slice(1).map((e) => (
            <i
              key={e.value}
              data-on={EFFORT_OPTIONS.findIndex((x) => x.value === e.value) <= EFFORT_OPTIONS.findIndex((x) => x.value === selectedEffort) ? 'true' : 'false'}
            />
          ))}
        </span>
        <span className="picker__chev">›</span>
      </button>
      {effortOpen && (
        <div
          className={`picker__menu picker__menu--effort${menuPlacement === 'down' ? ' picker__menu--down' : ''}`}
          role="menu"
          aria-label={chatCopy.reasoningTitle}
        >
          <div className="picker__title">{chatCopy.reasoningTitle}</div>
          {EFFORT_OPTIONS.map((e) => (
            <button
              type="button"
              key={e.value}
              role="menuitemradio"
              aria-checked={selectedEffort === e.value}
              className={`picker__option${selectedEffort === e.value ? ' is-selected' : ''}`}
              onClick={() => {
                onClose();
                onSelectEffort(e.value);
              }}
            >
              <span>{e.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

const imageFiles = (files: FileList | File[]): File[] =>
  Array.from(files).filter((file) => file.type.startsWith('image/'));

const imageFilesFromTransfer = (transfer: DataTransfer): File[] => {
  const fromFiles = imageFiles(transfer.files);
  if (fromFiles.length) return fromFiles;
  return Array.from(transfer.items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => !!file);
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

const formatBytes = (n: number): string => {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
};

const withAttachments = (text: string, attachments: AttachmentDraft[]): string => {
  if (!attachments.length) return text;
  const body = text.trim() || 'Please inspect the attached image(s).';
  const lines = attachments.map((a, i) => `${i + 1}. ${a.name} — ${a.path}`);
  return `${body}\n\nAttached local image${attachments.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
};

const readDraft = (): string => {
  try { return localStorage.getItem(DRAFT_KEY) ?? ''; } catch { return ''; }
};

const readAttachments = (): AttachmentDraft[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ATTACHMENTS_KEY) ?? '[]') as SavedAttachment[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => typeof item?.id === 'string' && typeof item.path === 'string' && typeof item.url === 'string')
      .map((item) => ({ ...item, previewUrl: item.url }));
  } catch {
    return [];
  }
};

const persist = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* best effort */ }
};

const dedupeQueue = (items: Array<QueueItem | null>): QueueItem[] => {
  const out: QueueItem[] = [];
  for (const item of items) {
    if (item && !out.some((x) => x.id === item.id)) out.push(item);
  }
  return out;
};

const QueueStrip: React.FC<{
  queue: QueueDisplayItem[];
  onClear: () => void;
  onRetryAll: () => void;
  onRetryOne: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ queue, onClear, onRetryAll, onRetryOne, onRemove }) => {
  const failedCount = queue.filter((item) => item.state === 'failed').length;
  const pendingCount = queue.length - failedCount;
  const summary = failedCount && pendingCount
    ? chatCopy.queueMixed(pendingCount, failedCount)
    : failedCount
      ? chatCopy.queueFailed(failedCount)
      : chatCopy.queuePending(pendingCount);
  const nextItem = queue.find((item) => item.isNext);
  const summaryText = nextItem ? chatCopy.queueNextSummary(summary, previewQueueText(nextItem.text)) : summary;
  const [expanded, setExpanded] = useState(queue.length <= 2 && failedCount === 0);

  return (
    <div className={`queuebar${failedCount ? ' queuebar--warn' : ''}${expanded ? ' queuebar--expanded' : ' queuebar--compact'}`} aria-label="Unsent messages">
      <div className="queuebar__head">
        <span className={`dot ${failedCount ? 'dot--warn' : 'dot--idle'}`} aria-hidden="true" />
        <span className="queuebar__summary">{summaryText}</span>
        <div className="queuebar__actions">
          {failedCount > 0 && (
            <button type="button" className="queuebar__action queuebar__action--primary" onClick={onRetryAll}>
              {chatCopy.queueRetryAll}
            </button>
          )}
          {queue.length > 2 && (
            <button type="button" className="queuebar__action" onClick={() => setExpanded((x) => !x)}>
              {expanded ? chatCopy.queueHide : chatCopy.queueShow}
            </button>
          )}
          <button type="button" className="queuebar__action" onClick={onClear}>
            {chatCopy.queueClearAll}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="queuebar__items">
          {queue.map((item) => (
            <div className="queueitem" key={item.id}>
              <span className={`queueitem__pill queueitem__pill--${item.isNext ? 'next' : item.state}`}>
                {item.state === 'failed'
                  ? chatCopy.queuePillFailed
                  : item.isNext
                    ? chatCopy.queuePillNext
                    : chatCopy.queuePillWaiting}
              </span>
              <span className="queueitem__text">{previewQueueText(item.text)}</span>
              {item.state === 'failed' && (
                <button type="button" className="queueitem__retry" onClick={() => onRetryOne(item.id)}>
                  {chatCopy.queueRetryOne}
                </button>
              )}
              <button
                type="button"
                className="queueitem__remove"
                aria-label="Remove unsent message"
                onClick={() => onRemove(item.id)}
              >
                {Icon.x}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const renderInline = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0];
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    if (raw.startsWith('**')) {
      nodes.push(<strong key={`${index}-b`}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('`')) {
      nodes.push(<code key={`${index}-c`}>{raw.slice(1, -1)}</code>);
    } else {
      const link = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      nodes.push(link ? <a key={`${index}-a`} href={link[2]}>{link[1]}</a> : raw);
    }
    last = index + raw.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  const blocks: React.ReactNode[] = [];
  const parts = text.split(/(```[\s\S]*?```)/g).filter(Boolean);

  for (const part of parts) {
    if (part.startsWith('```')) {
      const code = part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '').trimEnd();
      blocks.push(<pre className="md__pre" key={`code-${blocks.length}-${code.slice(0, 48)}`}><code>{code}</code></pre>);
      continue;
    }

    const lines = part.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i += 1; continue; }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        const children = renderInline(heading[2]);
        blocks.push(heading[1].length === 1
          ? <h3 className="md__heading" key={`h-${blocks.length}-${line}`}>{children}</h3>
          : heading[1].length === 2
            ? <h4 className="md__heading" key={`h-${blocks.length}-${line}`}>{children}</h4>
            : <h5 className="md__heading" key={`h-${blocks.length}-${line}`}>{children}</h5>);
        i += 1;
        continue;
      }

      const quote = line.match(/^>\s+(.+)$/);
      if (quote) {
        const quoted: string[] = [];
        while (i < lines.length) {
          const q = lines[i].match(/^>\s?(.+)$/);
          if (!q) break;
          quoted.push(q[1]);
          i += 1;
        }
        const quoteText = quoted.join('\n');
        blocks.push(<blockquote className="md__quote" key={`q-${blocks.length}-${quoteText.slice(0, 48)}`}>{quoted.map((q) => <p key={q}>{renderInline(q)}</p>)}</blockquote>);
        continue;
      }

      const bullet = line.match(/^\s*[-*]\s+(.+)$/);
      if (bullet) {
        const items: string[] = [];
        while (i < lines.length) {
          const b = lines[i].match(/^\s*[-*]\s+(.+)$/);
          if (!b) break;
          items.push(b[1]);
          i += 1;
        }
        const listText = items.join('\n');
        blocks.push(<ul className="md__list" key={`ul-${blocks.length}-${listText.slice(0, 48)}`}>{items.map((item) => <li key={item}>{renderInline(item)}</li>)}</ul>);
        continue;
      }

      const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (numbered) {
        const items: string[] = [];
        while (i < lines.length) {
          const n = lines[i].match(/^\s*\d+[.)]\s+(.+)$/);
          if (!n) break;
          items.push(n[1]);
          i += 1;
        }
        const listText = items.join('\n');
        blocks.push(<ol className="md__list" key={`ol-${blocks.length}-${listText.slice(0, 48)}`}>{items.map((item) => <li key={item}>{renderInline(item)}</li>)}</ol>);
        continue;
      }

      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,3})\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !/^>\s+/.test(lines[i])) {
        para.push(lines[i].trim());
        i += 1;
      }
      const paraText = para.join(' ');
      blocks.push(<p className="md__p" key={`p-${blocks.length}-${paraText.slice(0, 48)}`}>{renderInline(paraText)}</p>);
    }
  }

  return <div className="md">{blocks}</div>;
};

const LiveChat: React.FC<{
  onOpenSettings?: () => void;
  onNavigate?: (id: SurfaceId) => void;
  sidebarHidden: boolean;
  onToggleSidebar?: () => void;
}> = ({
  onOpenSettings,
  onNavigate,
  sidebarHidden,
  onToggleSidebar,
}) => {
  const api = ottoApi();
  const rt = useRuntimeContext();
  const { threads } = useChatThreads(rt.activeThreadId);
  const toast = useToast();
  const [draft, setDraft] = useState(readDraft);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>(readAttachments);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [draggingImage, setDraggingImage] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>(readQueue);
  const [modelOptions, setModelOptions] = useState<LettaModelOption[]>(FALLBACK_MODEL_OPTIONS);
  const [modelOpen, setModelOpen] = useState(false);
  const [effortOpen, setEffortOpen] = useState(false);
  const [permission, setPermission] = useState<PermissionRequestView | null>(null);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [proposeContext, setProposeContext] = useState<ProposeCorrectionContext | null>(null);
  const [proposeBusy, setProposeBusy] = useState(false);
  const [cmdMessages, setCmdMessages] = useState<ChatMsg[]>([]);
  const draining = useRef(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<HTMLDivElement | null>(null);
  const tailRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const st = rt.status;
  const ready = !!st?.ready;
  const selectedModel = st?.modelHandle ?? st?.model ?? null;
  const selectedEffort = st?.effort ?? 'high';
  const activeThreadTitle = threads.find((t) => t.id === rt.activeThreadId)?.title;
  const headTitle = displayThreadTitle(activeThreadTitle ?? 'New chat');
  const chatStatusLine = st
    ? [
      st.agentId ?? 'no agent',
      labelForModel(selectedModel, modelOptions),
      st.conversationId ?? 'no conversation',
      st.memfsEnabled ? 'Letta memory' : null,
    ].filter(Boolean).join(' · ')
    : 'connecting…';

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    void api.models.list()
      .then((models) => {
        if (cancelled || !models.length) return;
        setModelOptions(models);
        if (!ready || rt.busy) return;
        const current = selectedModel;
        if (current && models.some((model) => model.handle === current)) return;
        const fallback = models.find((model) => model.handle === 'letta/auto')
          ?? models.find((model) => model.handle === 'openai/gpt-5.5')
          ?? models[0];
        if (fallback?.handle) void rt.configure({ modelHandle: fallback.handle });
      })
      .catch(() => {
        if (!cancelled) setModelOptions(FALLBACK_MODEL_OPTIONS);
      });
    return () => {
      cancelled = true;
    };
  }, [api, ready, selectedModel, rt.busy]);

  useEffect(() => {
    if (!modelOpen && !effortOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setModelOpen(false);
      setEffortOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [modelOpen, effortOpen]);

  useEffect(() => {
    if (!api) return;
    return api.onPermission((req) => setPermission(req as PermissionRequestView));
  }, [api]);

  useEffect(() => {
    const onStarter = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string; send?: boolean }>).detail;
      const text = detail?.text?.trim();
      if (!text || !ready || !api) return;
      if (detail?.send) {
        setQueue((items) => [...items, createQueueItem(text, 'queued', rt.activeThreadId)]);
        return;
      }
      setDraft(text);
    };
    window.addEventListener('otto-onboarding-starter', onStarter);
    return () => window.removeEventListener('otto-onboarding-starter', onStarter);
  }, [api, ready, rt.activeThreadId]);

  const respondPermission = async (decision: PermissionDecision, denyMessage?: string) => {
    if (!api || !permission) return;
    setPermissionBusy(true);
    const active = permission;
    const msg = denyMessage ?? permissionCopy.deniedByUser;
    try {
      if (decision === 'deny') {
        api.permission.respond(active.requestId, { behavior: 'deny', message: msg });
        const receipt = await api.permission.denyReceipt({
          requestId: active.requestId,
          toolName: active.toolName,
          message: msg,
        });
        setCmdMessages((items) => [...items, {
          id: `permission-deny-${active.requestId}`,
          who: 'otto',
          text: '',
          receiptInline: {
            id: receipt.id,
            status: 'blocked',
            action: 'autonomy.permission.deny',
            summary: `Tool permission denied: ${active.toolName}`,
            authority: 'human (permission gate)',
          },
        }]);
      } else if (decision === 'allow-session') {
        api.permission.respond(active.requestId, { behavior: 'allow', scope: 'session' });
      } else {
        api.permission.respond(active.requestId, { behavior: 'allow', scope: 'once' });
      }
    } finally {
      setPermission(null);
      setPermissionBusy(false);
    }
  };

  const openPermissionCorrection = () => {
    if (!permission) return;
    setProposeContext({
      messageId: `permission-${permission.requestId}`,
      messageText: `Permission blocked for tool \`${permission.toolName}\`.\n\n${JSON.stringify(permission.toolInput, null, 2)}`,
      who: 'otto',
    });
  };

  const submitProposal = async (input: { correction: string; target: ProposalTarget; rationale: string }) => {
    if (!api || !proposeContext || proposeBusy) return;
    setProposeBusy(true);
    try {
      const result = await api.curation.proposals.createFromCorrection({
        correction: input.correction,
        rationale: input.rationale,
        target: input.target,
        evidence: [{ kind: 'message', ref: proposeContext.messageId, note: proposeContext.messageText.slice(0, 500) }],
      });
      setProposeContext(null);
      toast.push({
        title: toastCopy.proposalCreated,
        body: `${result.proposal.id} · ${result.proposal.classification.route} · ${toastCopy.openCuration}`,
        tone: 'ok',
      });
      setCmdMessages((items) => [...items, {
        id: `proposal-${result.proposal.id}`,
        who: 'otto',
        text: `Proposal **${result.proposal.id}** recorded (${result.proposal.status}).\n\n${result.proposal.summary}\n\nReceipt: \`${result.receipt.id}\`. Ratify in Curation — canon unchanged until accept.`,
      }]);
      onNavigate?.('curation');
    } catch (e) {
      toast.push({
        title: toastCopy.decisionBlocked,
        body: e instanceof Error ? e.message : String(e),
        tone: 'warn',
      });
    } finally {
      setProposeBusy(false);
    }
  };

  const streamMessages = [...rt.messages, ...cmdMessages];
  const activeQueue = queueDisplayItemsForThread(queue, rt.activeThreadId);

  useEffect(() => {
    setCmdMessages([]);
  }, [rt.activeThreadId]);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, draft); } catch { /* best effort */ }
  }, [draft]);

  useEffect(() => {
    persist(QUEUE_KEY, queue);
  }, [queue]);

  useEffect(() => {
    persist(ATTACHMENTS_KEY, attachments.map(({ previewUrl: _previewUrl, ...rest }) => rest));
  }, [attachments]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: streamMessages.length > 1 ? 'smooth' : 'auto', block: 'end' });
  }, [streamMessages.length, rt.busy, activeQueue.length]);

  const attachImages = async (files: File[]) => {
    if (!api || !files.length) return;
    setAttachmentError(null);
    try {
      const saved = await Promise.all(files.map(async (file) => {
        const dataUrl = await fileToDataUrl(file);
        const attachment = await api.attachments.save({ name: file.name || 'image.png', mime: file.type || 'image/png', dataUrl });
        return { ...attachment, previewUrl: dataUrl } satisfies AttachmentDraft;
      }));
      setAttachments((items) => [...items, ...saved]);
    } catch (e) {
      setAttachmentError(e instanceof Error ? e.message : String(e));
    }
  };

  const submit = () => {
    const t = draft.trim();
    if ((!t && attachments.length === 0) || !ready || !api) return;
    const text = withAttachments(t, attachments);
    void (async () => {
      const cmd = await runTicketCommand(api, text);
      if (cmd?.handled) {
        setCmdMessages((items) => [...items, {
          id: `cmd-${Date.now()}`,
          who: 'otto',
          text: cmd.lines.join('\n'),
          checkBlock: cmd.checkBlock,
        }]);
        setDraft('');
        setAttachments([]);
        return;
      }
      setQueue((items) => [...items, createQueueItem(text, 'queued', rt.activeThreadId)]);
      if (rt.busy) void rt.abort();
      setDraft('');
      setAttachments([]);
    })();
  };

  useEffect(() => {
    if (!ready || !rt.activeThreadId || rt.busy || draining.current || queue.length === 0) return;
    const next = nextQueueItemForThread(queue, rt.activeThreadId);
    if (!next) return;
    draining.current = true;
    persistInFlight({ ...next, state: 'sending' });
    setQueue((items) => items.filter((item) => item.id !== next.id));
    void rt.send(next.text)
      .then(() => {
        clearInFlight(next.id);
        notifyOnboardingFirstMessage();
      })
      .catch(() => {
        clearInFlight(next.id);
        setQueue((items) => dedupeQueue([{ ...next, state: 'failed' }, ...items]));
      })
      .finally(() => {
        draining.current = false;
      });
  }, [queue, ready, rt.activeThreadId, rt.busy, rt.send]);

  // Failed sends remain durable in the queue; the user can retry or remove them.

  return (
    <div
      className={`chat${draggingImage ? ' is-dragging-image' : ''}`}
      onDragOver={(e) => {
        if (!imageFilesFromTransfer(e.dataTransfer).length) return;
        e.preventDefault();
        setDraggingImage(true);
      }}
      onDragLeave={() => setDraggingImage(false)}
      onDrop={(e) => {
        const files = imageFilesFromTransfer(e.dataTransfer);
        if (!files.length) return;
        e.preventDefault();
        setDraggingImage(false);
        void attachImages(files);
      }}
    >
      <div className={`chat__head${sidebarHidden ? ' chat__head--inset' : ''}`}>
        {sidebarHidden && (
          <button type="button" className="topbar__sidebarButton chat__sidebarButton" onClick={onToggleSidebar} aria-label="Open sidebar">
            {Icon.panel}
          </button>
        )}
        <span className="chat__avatar"><OttoMark size={30} className="ottoMark" /></span>
        <div className="chat__titleBlock">
          <div className="chat__title">{headTitle}</div>
          <div className="chat__id" title={st ? chatStatusLine : undefined}>
            {st ? (
              <>
                <span className={`dot ${ready ? 'dot--ok' : 'dot--warn'}`} aria-hidden="true" />
                <span>{ready ? chatStatusLine : formatRuntimeSubtitle(ready, st.reason, labelForModel(selectedModel, modelOptions))}</span>
              </>
            ) : 'connecting…'}
          </div>
        </div>
        <div className="chat__headActions">
          <AppSourceBadge compact />
          {st ? (
            <span className={`pill ${ready ? 'pill--ok' : 'pill--warn'}`}>
              {ready ? 'connected' : 'setup'}
            </span>
          ) : null}
          {!st ? (
            <>
              <button type="button" className="btn btn--ghost-d" onClick={() => { void rt.retry(); }}>{chatCopy.pickerRetry}</button>
              {onOpenSettings && (
                <button type="button" className="btn btn--solid-d" onClick={onOpenSettings}>{chatCopy.pickerOpenSettings}</button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="chat__stream" ref={streamRef}>
        <div className="chat__streamInner">
          {!ready && (
            <div className="inkblock chat__setup">
              {!st ? (
                <>
                  <div className="inkblock__eyebrow"><span className="dot dot--idle" /> {chatCopy.runtimeConnectingEyebrow}</div>
                  <div className="inkblock__title">{chatCopy.runtimeConnectingTitle}</div>
                  <div className="inkblock__meta">
                    <span>{chatCopy.runtimeConnectingBody}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="inkblock__eyebrow"><span className="dot dot--warn" /> {chatCopy.runtimeNotReadyEyebrow}</div>
                  <div className="inkblock__title">{chatCopy.runtimeNotReadyTitle}</div>
                  <div className="inkblock__meta">
                    <span>{st.reason ?? chatCopy.runtimeNotReadyBody}</span>
                  </div>
                </>
              )}
              <div className="inkblock__actions">
                <button type="button" className="btn btn--solid-d" onClick={() => { void rt.retry(); }}>Retry</button>
                {onOpenSettings && <button type="button" className="btn btn--ghost-d" onClick={onOpenSettings}>Open Settings</button>}
              </div>
            </div>
          )}
          {streamMessages.length === 0 && (
            <div className={`chatEmpty${ready ? '' : ' chatEmpty--muted'}`}>
              <div className="eyebrow">{chatCopy.sessionEyebrow}</div>
              <h2 className="chatEmpty__title">{chatCopy.sessionTitle}</h2>
              <p className="chatEmpty__lede">
                {ready ? chatCopy.sessionBody : 'Finish runtime setup above, then send your first message.'}
              </p>
              <div className="chatStarters" aria-label="Starter prompts">
                {chatCopy.starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chatStarter"
                    disabled={!ready}
                    onClick={() => setDraft(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {streamMessages.map((m, i) => {
            const showWho = i === 0 || streamMessages[i - 1].who !== m.who;
            const isUser = m.who === 'user';
            const isError = m.who === 'error';
            const whoLabel = isUser ? 'You' : isError ? 'Error' : 'otto';
            return (
              <div
                key={m.id}
                className={`msgRow${isUser ? ' msgRow--user' : ''}${isError ? ' msgRow--error' : ''}${showWho ? '' : ' msgRow--cont'}`}
              >
                {!isUser && showWho ? (
                  <span className="msgRow__avatar" aria-hidden="true">
                    <OttoMark size={26} className="ottoMark" />
                  </span>
                ) : !isUser ? <span className="msgRow__avatar msgRow__avatar--spacer" aria-hidden="true" /> : null}
                <div className={`msg${isUser ? ' msg--user' : ''}${showWho ? '' : ' msg--cont'}`}>
                  <span className="srOnly">{whoLabel}</span>
                  {m.checkBlock && onNavigate ? (
                    <CheckBlockBanner
                      checkName={m.checkBlock.checkName}
                      message={m.checkBlock.message}
                      receiptId={m.checkBlock.receiptId}
                      standardId={m.checkBlock.standardId}
                      onOpenReceipt={m.checkBlock.receiptId ? () => onNavigate('receipts') : undefined}
                      onOpenStandard={m.checkBlock.standardId ? () => onNavigate('standards') : undefined}
                    />
                  ) : null}
                  {m.receiptInline ? (
                    <ReceiptInlineCard
                      id={m.receiptInline.id}
                      status={m.receiptInline.status}
                      action={m.receiptInline.action}
                      summary={m.receiptInline.summary}
                      authority={m.receiptInline.authority}
                      onOpenReceipts={onNavigate ? () => onNavigate('receipts') : undefined}
                    />
                  ) : null}
                  <div className="msg__body" style={isError ? { color: 'var(--stop)' } : undefined}>
                    {m.text ? <MarkdownText text={m.text} /> : null}
                  </div>
                  {!isUser && !isError && m.text ? (
                    <MessageActions
                      disabled={proposeBusy}
                      onCorrectThis={() => setProposeContext({
                        messageId: m.id,
                        messageText: m.text,
                        who: 'otto',
                      })}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
          {rt.busy && (
            <div className="msgRow">
              <span className="msgRow__avatar" aria-hidden="true"><OttoMark size={26} className="ottoMark" /></span>
              <div className="chat__thinking" aria-live="polite">
                <span className="chat__thinkingDots" aria-hidden="true">
                  <i /><i /><i />
                </span>
                {chatCopy.workingPulse}
              </div>
            </div>
          )}
          <div ref={tailRef} className="chat__tail" aria-hidden="true" />
        </div>
      </div>

      <div className="promptbar">
        {ready && activeQueue.length > 0 && (
          <QueueStrip
            queue={activeQueue}
            onClear={() => setQueue((items) => items.filter((item) => !queueMatchesThread(item, rt.activeThreadId)))}
            onRetryAll={() => setQueue((items) => retryFailedQueueItemsForThread(items, rt.activeThreadId))}
            onRetryOne={(id) => setQueue((items) => retryFailedQueueItemsForThread(items, rt.activeThreadId, id))}
            onRemove={(id) => setQueue((items) => items.filter((item) => item.id !== id))}
          />
        )}
        {attachments.length > 0 && (
          <div className="attachmentTray" aria-label="Image attachments">
            {attachments.map((a) => (
              <div className="attachment" key={a.id}>
                <img src={a.previewUrl} alt="" />
                <div className="attachment__meta">
                  <span>{a.name}</span>
                  <span className="faint">{formatBytes(a.size)}</span>
                </div>
                <button type="button" className="attachment__remove" aria-label={`Remove ${a.name}`} onClick={() => setAttachments((items) => items.filter((x) => x.id !== a.id))}>
                  {Icon.x}
                </button>
              </div>
            ))}
          </div>
        )}
        {attachmentError && <div className="attachmentError">{attachmentError}</div>}
        {ready && st ? (
          <div className="promptbar__pickers" ref={pickerRef}>
            <ModelEffortPickers
              busy={rt.busy}
              selectedModel={selectedModel}
              selectedEffort={selectedEffort}
              modelOpen={modelOpen}
              effortOpen={effortOpen}
              onToggleModel={() => { setModelOpen((x) => !x); setEffortOpen(false); }}
              onToggleEffort={() => { setEffortOpen((x) => !x); setModelOpen(false); }}
              onClose={() => { setModelOpen(false); setEffortOpen(false); }}
              onSelectModel={(value) => { void rt.configure({ modelHandle: value }); }}
              onSelectEffort={(value) => { void rt.configure({ effort: value }); }}
              modelOptions={modelOptions}
            />
          </div>
        ) : null}
        <div className="promptCompose">
          <div className={`promptbox${ready ? '' : ' promptbox--disabled'}`}>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="srOnly"
              onChange={(e) => {
                void attachImages(imageFiles(e.currentTarget.files ?? []));
                e.currentTarget.value = '';
              }}
            />
            <button type="button" className="btn btn--icon promptbox__attach" aria-label="Attach image" disabled={!ready} onClick={() => fileInput.current?.click()}>
              {Icon.image}
            </button>
            <textarea
              ref={textareaRef}
              placeholder={
                ready
                  ? (rt.busy ? 'Steer this reply…' : 'Message otto…')
                  : st
                    ? 'Runtime not ready — finish setup above'
                    : 'Connecting to Letta…'
              }
              aria-label="Message Otto"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onPaste={(e) => {
                const files = imageFilesFromTransfer(e.clipboardData);
                if (!files.length) return;
                e.preventDefault();
                void attachImages(files);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
                else if (e.key === 'Escape') { setDraft(''); e.currentTarget.blur(); }
              }}
              disabled={!ready}
              rows={1}
            />
            {rt.busy && (
              <button type="button" className="btn btn--icon promptbox__stop" aria-label="Abort current run" onClick={rt.abort}>{Icon.stop}</button>
            )}
            <button
              type="button"
              className="btn btn--primary btn--icon promptbox__send"
              aria-label={rt.busy ? 'Queue message' : 'Send message'}
              disabled={!ready || (!draft.trim() && attachments.length === 0)}
              onClick={submit}
            >
              {Icon.send}
            </button>
          </div>
          {ready ? <div className="promptbar__hint">{chatCopy.composerHint}</div> : null}
        </div>
      </div>

      <Modal
        open={!!permission}
        title={permissionCopy.modalTitle}
        onClose={() => {
          if (permissionBusy || !permission) return;
          respondPermission('deny', permissionCopy.deniedByUser);
        }}
      >
        {permission ? (
          <PermissionCard
            request={permission}
            busy={permissionBusy}
            onDecide={(decision, denyMessage) => { void respondPermission(decision, denyMessage); }}
            onCorrectThis={openPermissionCorrection}
          />
        ) : null}
      </Modal>

      <ProposeCorrectionModal
        open={!!proposeContext}
        context={proposeContext}
        busy={proposeBusy}
        onClose={() => { if (!proposeBusy) setProposeContext(null); }}
        onSubmit={(input) => { void submitProposal(input); }}
        classify={api ? (input) => api.curation.proposals.classify(input) : undefined}
        constitutionGet={api ? () => api.constitution.get() : undefined}
      />
    </div>
  );
};

/* ---------- PreviewChat (web preview, file-backed, not wired) ---------- */
const PreviewChat: React.FC = () => (
  <div className="chat">
    <div className="chat__head">
      <span className="chat__avatar" style={{ width: 28, height: 28, borderRadius: 8 }}><OttoMark size={24} className="ottoMark" /></span>
      <div>
        <div style={{ fontWeight: 600 }}>otto</div>
        <div className="chat__id">runtime not connected · desktop bridge unavailable</div>
      </div>
      <span className="pill pill--warn" style={{ marginLeft: 'auto' }}>preview · not connected</span>
    </div>

    <div className="chat__stream">
      <div className="emptySurface emptySurface--chat">
        <div className="eyebrow">chat</div>
        <h2>No live session in web preview.</h2>
        <p>Open the packaged desktop app to connect to local Letta. This preview does not show fake messages.</p>
      </div>
    </div>

    <div className="promptbar">
      {!isReady && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--warn-tint)',
            border: '1px solid #e7dcc0',
            borderRadius: 8,
            padding: '9px 13px',
            fontSize: 13.5,
            color: 'var(--ink-soft)',
          }}
        >
          <span className="dot dot--warn" />
          <span>
            <strong>Setup required</strong> — otto is not connected to a runtime ({requiredMissing.length} required items missing). Open <strong>Settings</strong> to configure.
          </span>
        </div>
      )}
      <div className="promptbox promptbox--disabled">
        <input
          placeholder="Chat is disabled in this preview"
          aria-label="Chat input (disabled in preview)"
          disabled
          readOnly
        />
        <button type="button" className="btn btn--primary" aria-label="Send message" disabled aria-disabled="true">{Icon.send}</button>
      </div>
      <div className="promptbar__meta">
        <span>desktop bridge unavailable</span>
        <span className="faint">runtime: not connected</span>
      </div>
    </div>
  </div>
);
