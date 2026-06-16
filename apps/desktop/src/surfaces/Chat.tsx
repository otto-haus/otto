import { buildRuntimeSendPayload } from '../attachment-message';
import type React from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { syncComposerTextareaHeight } from '../chat/composer-textarea';
import { Icon } from '../components/icons';
import { AppSourceBadge } from '../components/AppSourceBadge';
import { useToast } from '../components/toast-context';
import { isElectron, ottoApi, type EffortLevel, type LettaModelOption, type SavedAttachment } from '../runtime';
import { useRuntimeContext } from '../runtime-context';
import type { SurfaceId } from '../components/Sidebar';
import { OttoMark } from '../components/OttoMark';
import { CheckBlockBanner, ContextDrawer, MessageActions, Modal, PermissionCard, ReceiptInlineCard, ToolActivityCard, type PermissionDecision, type PermissionRequestView } from '../components/ui';
import { TodoPanel } from '../components/TodoPanel';
import { displayThreadTitle } from '../components/ui/ThreadList';
import { chatCopy, permissionCopy, previewCopy, projectCopy, toastCopy } from '../copy/surfaces';
import { openReceipt, openStandard } from '../surface-selection-nav';
import { ProjectWindow } from './ProjectWindow';
import { PermissionWindow } from './PermissionWindow';
import {
  dequeuePermissionRequest,
  enqueuePermissionRequest,
  headPermissionRequest,
} from './chat-permission-queue';
import { useChatThreads } from '../chat/useChatThreads';
import { StreamMarkdown } from '../chat/markdown/MarkdownBlock';
import { MessageAttachmentStrip } from '../chat/MessageAttachmentStrip';
import { parseSentMessageDisplay, pathToAttachmentPreviewUrl } from '../chat/message-attachment-display';
import { notifyOnboardingFirstMessage, resolveOnboardingStarterAction } from '../onboarding-storage';
import { ProposeCorrectionModal, type ProposeCorrectionContext } from '../chat/ProposeCorrectionModal';
import {
  readStoredAttachments,
  readStoredDraft,
  writeStoredAttachments,
  writeStoredDraft,
} from '../chat/composer-storage';
import { serializeConversationMarkdown } from '../chat/conversation-markdown';
import { runTicketCommand } from '../chat/ticket-commands';
import { formatResolvedModelLabel, helpTextForModelOption } from '../chat/model-option-help';
import {
  composerDraftFromQueueText,
  splitQueueText,
  type QueueAttachmentRef,
} from '../chat/queue-storage';
import { useOutbox } from '../chat/useOutbox';
import { OutboxBanner } from '../chat/OutboxBanner';
import { ModelFallbackBanner } from '../chat/ModelFallbackBanner';
import type { ProposalTarget } from '@otto-haus/core';
import type { ChatMsg } from '../runtime';
import { TurnTrailLive } from '../chat/TurnTrailLive';
import { TurnTrailSummary } from '../chat/TurnTrailSummary';
import { useLabs } from '../labs/labs-context';
import { useOttoDebugContextMenu } from '../debug/useOttoDebugContextMenu';
import { TruncatedMessageRestore } from '../chat/TruncatedMessageRestore';
import { PreviewPane } from '../components/PreviewPane';
import { previewFromCodeBlock, previewFromText } from '../preview/preview-content';
import { usePreviewPane } from '../preview/usePreviewPane';
import { openSettingsSection } from '../settings-section-nav';
import { isTypingTarget, jumpTurnAnchor, turnAnchorIndices } from '../chat/turn-navigation';
import {
  curateModelOptions,
  labelForCuratedModel,
  visiblePickerModels,
} from '../chat/model-picker-curation';
import {
  composerHintKey,
  DEFAULT_COMPOSER_SEND_SHORTCUT,
  normalizeComposerSendShortcut,
  shouldComposerShortcutSubmit,
} from '../chat/composer-keyboard';
import {
  nextActionFor,
  runtimeSetupTitle,
  type ConnectionMode,
} from '../../electron/shared/runtime-status-ui';
import { ReadinessPanel } from '../ReadinessPanel';

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

type ChatRuntimeStatus = NonNullable<ReturnType<typeof useRuntimeContext>['status']>;

const runtimeSetupBannerNextAction = (
  st: ChatRuntimeStatus,
  connectionMode: ConnectionMode | undefined,
): string | null => {
  if (!st.code || st.code === 'ready') return null;
  return nextActionFor(st.code, { connectionMode });
};

const formatRuntimeSubtitle = (
  ready: boolean,
  st: Pick<ChatRuntimeStatus, 'code' | 'reason'> | undefined,
  modelLabel: string,
): string => {
  if (ready) return modelLabel;
  if (st?.code === 'no-agent') return chatCopy.runtimeNoAgentSubtitle;
  const text = st?.reason?.trim() ?? chatCopy.connectingLabel;
  if (text.length <= 96) return text;
  return `${text.slice(0, 93)}…`;
};

/** Same gate as Memory Observatory `connected` in Panes — live runtime ready, not MemFS. */
const isCoreMemoryReachable = (st: ChatRuntimeStatus): boolean => !!st.ready;


const lettaMemoryStatusLabel = (st: ChatRuntimeStatus): string =>
  isCoreMemoryReachable(st) ? chatCopy.memoryOn : chatCopy.memoryOff;

/**
 * Product subtitle — model + memory state only; no raw agent/conversation ids (#081)
 * and no transport/WS-promotion jargon (kept in the debug tooltip below).
 */
const formatChatSessionSubtitle = (
  st: ChatRuntimeStatus,
  modelLabel: string,
): string =>
  [
    modelLabel,
    lettaMemoryStatusLabel(st),
  ].filter(Boolean).join(' · ');

/** Debug/support tooltip only — not shown in default connected chrome. */
const formatChatDebugTitle = (st: ChatRuntimeStatus, modelLabel: string): string =>
  [
    st.agentId ?? 'no agent',
    modelLabel,
    st.modelFallbackReason ?? null,
    st.transportFallbackReason ?? null,
    st.conversationId ?? 'no conversation',
    lettaMemoryStatusLabel(st),
  ].filter(Boolean).join(' · ');

const ModelEffortPickers: React.FC<{
  busy: boolean;
  selectedModel: string | null;
  resolvedModelLabel: string | null;
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
  resolvedModelLabel,
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
}) => {
  const [showLegacy, setShowLegacy] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customHandle, setCustomHandle] = useState('');
  const curatedModels = curateModelOptions(modelOptions);
  const visibleModels = visiblePickerModels(curatedModels, showLegacy, selectedModel);
  const hiddenLegacyCount = curatedModels.filter((model) => model.tier !== 'primary').length;

  const applyCustomHandle = () => {
    const handle = customHandle.trim();
    if (!handle) return;
    onClose();
    setCustomOpen(false);
    setCustomHandle('');
    onSelectModel(handle);
  };

  return (
  <div className={`promptControls${compact ? ' promptControls--head' : ''}`} onClick={(e) => e.stopPropagation()}>
    <div className="picker" data-open={modelOpen ? 'true' : 'false'}>
      <button
        type="button"
        className="picker__button"
        onClick={onToggleModel}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={modelOpen}
        aria-label={resolvedModelLabel
          ? `Model: ${labelForModel(selectedModel, modelOptions)} (${chatCopy.autoModelResolvedPrefix}: ${resolvedModelLabel})`
          : `Model: ${labelForModel(selectedModel, modelOptions)}`}
        title={resolvedModelLabel
          ? `${chatCopy.autoModelResolvedPrefix}: ${resolvedModelLabel}`
          : undefined}
      >
        <span>{labelForModel(selectedModel, modelOptions)}</span>
        {resolvedModelLabel && (
          <span className="picker__resolved mono faint">{chatCopy.autoModelResolvedPrefix}: {resolvedModelLabel}</span>
        )}
        <span className="picker__chev">›</span>
      </button>
      {modelOpen && (
        <div
          className={`picker__menu picker__menu--model${menuPlacement === 'down' ? ' picker__menu--down' : ''}`}
          role="menu"
          aria-label={chatCopy.selectModelTitle}
        >
          <div className="picker__title">{chatCopy.selectModelTitle}</div>
          {visibleModels.map((m) => {
            const helpText = helpTextForModelOption(m);
            const resolvedForOption = selectedModel === m.handle ? resolvedModelLabel : null;
            return (
              <button
                type="button"
                key={m.handle}
                role="menuitemradio"
                aria-checked={selectedModel === m.handle}
                aria-describedby={helpText ? `model-help-${m.handle}` : undefined}
                title={helpText ?? undefined}
                className={`picker__option${helpText ? ' picker__option--with-help' : ''}${selectedModel === m.handle ? ' is-selected' : ''}`}
                onClick={() => {
                  onClose();
                  onSelectModel(m.handle);
                }}
              >
                <span className="picker__optionMain">
                  <span className="picker__optionLabel">
                    {labelForCuratedModel(m)}
                    {(m.deprecated || m.tier === 'legacy') && (
                      <span className="picker__badge">
                        {m.deprecated ? chatCopy.modelDeprecatedBadge : chatCopy.modelLegacyBadge}
                      </span>
                    )}
                  </span>
                  {helpText && (
                    <span className="picker__optionDesc" id={`model-help-${m.handle}`}>{helpText}</span>
                  )}
                  {resolvedForOption && (
                    <span className="picker__optionResolved mono faint">
                      {chatCopy.autoModelResolvedPrefix}: {resolvedForOption}
                    </span>
                  )}
                </span>
                <span className="mono faint">{m.handle}</span>
              </button>
            );
          })}
          {hiddenLegacyCount > 0 && (
            <button
              type="button"
              className="picker__advanced"
              onClick={() => {
                setCustomOpen(false);
                setShowLegacy((value) => !value);
              }}
            >
              {showLegacy ? chatCopy.hideLegacyModels : chatCopy.showLegacyModels}
            </button>
          )}
          {!customOpen ? (
            <button
              type="button"
              className="picker__advanced"
              onClick={() => setCustomOpen(true)}
            >
              {chatCopy.customModelAction}
            </button>
          ) : (
            <div className="picker__custom">
              <label className="picker__customLabel" htmlFor="otto-custom-model-handle">{chatCopy.customModelPrompt}</label>
              <div className="picker__customRow">
                <input
                  id="otto-custom-model-handle"
                  className="picker__customInput mono"
                  value={customHandle}
                  onChange={(event) => setCustomHandle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      applyCustomHandle();
                    }
                  }}
                  placeholder="provider/model"
                  autoFocus
                />
                <button type="button" className="btn btn--ghost" onClick={applyCustomHandle} disabled={!customHandle.trim()}>
                  {chatCopy.customModelApply}
                </button>
              </div>
            </div>
          )}
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
};

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

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  tiff: 'image/tiff',
};

const mimeFromAttachmentName = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'image/png';
};

const pathToPreviewUrl = pathToAttachmentPreviewUrl;

const attachmentDraftsFromQueueRefs = (refs: QueueAttachmentRef[]): AttachmentDraft[] =>
  refs.map((ref, index) => ({
    id: ref.id ?? `recalled-${index}-${ref.path || ref.name}`,
    name: ref.name,
    mime: mimeFromAttachmentName(ref.name),
    path: ref.path,
    url: pathToPreviewUrl(ref.path),
    size: 0,
    previewUrl: pathToPreviewUrl(ref.path),
  }));

const attachmentDraftsFromStored = (items: SavedAttachment[]): AttachmentDraft[] =>
  items.map((item) => ({ ...item, previewUrl: item.url }));

const persist = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* best effort */ }
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
  const { isFeatureEnabled } = useLabs();
  const showTurnPhases = isFeatureEnabled('turn_phase_timeline');
  const chatDebugMenu = useOttoDebugContextMenu('chat');
  const runtimeStatusDebugMenu = useOttoDebugContextMenu('runtime-status');
  const runtimeSetupDebugMenu = useOttoDebugContextMenu('runtime-setup');
  const { threads } = useChatThreads(rt.activeThreadId);
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const activeThreadIdRef = useRef(rt.activeThreadId);
  activeThreadIdRef.current = rt.activeThreadId;
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [draggingImage, setDraggingImage] = useState(false);
  const outbox = useOutbox(rt.activeThreadId);
  const [recalledQueueId, setRecalledQueueId] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<LettaModelOption[]>(FALLBACK_MODEL_OPTIONS);
  const [modelOpen, setModelOpen] = useState(false);
  const [effortOpen, setEffortOpen] = useState(false);
  const [permissionQueue, setPermissionQueue] = useState<PermissionRequestView[]>([]);
  const [composerSendShortcut, setComposerSendShortcut] = useState(DEFAULT_COMPOSER_SEND_SHORTCUT);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('embedded');
  const [permissionBusy, setPermissionBusy] = useState(false);
  const permission = headPermissionRequest(permissionQueue);
  const pendingPermissionCount = permissionQueue.length;
  const [contextPanel, setContextPanel] = useState<'project' | 'permission' | null>(null);
  const [proposeContext, setProposeContext] = useState<ProposeCorrectionContext | null>(null);
  const [proposeBusy, setProposeBusy] = useState(false);
  const [cmdMessages, setCmdMessages] = useState<ChatMsg[]>([]);
  const [expandedMessageTexts, setExpandedMessageTexts] = useState<Record<string, string>>({});
  const preview = usePreviewPane();
  const previewShellRef = useRef<HTMLDivElement | null>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number; containerWidth: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<HTMLDivElement | null>(null);
  const tailRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const turnFocusRef = useRef(0);
  const st = rt.status;
  const ready = !!st?.ready;
  const requestedModel = st?.modelHandle ?? null;
  const activeModel = st?.model ?? st?.modelHandle ?? null;
  const selectedModel = requestedModel ?? activeModel;
  const selectedEffort = st?.effort ?? 'high';
  const resolvedModelLabel = formatResolvedModelLabel(requestedModel, activeModel, modelOptions, labelForModel);
  const activeThreadTitle = threads.find((t) => t.id === rt.activeThreadId)?.title;
  const headTitle = displayThreadTitle(activeThreadTitle ?? 'New chat');
  const setupNextAction = st && !ready ? runtimeSetupBannerNextAction(st, connectionMode) : null;
  const modelStatusLabel = resolvedModelLabel
    ? `${labelForModel(requestedModel, modelOptions)} → ${resolvedModelLabel}`
    : labelForModel(selectedModel, modelOptions);
  const chatSessionSubtitle = st ? formatChatSessionSubtitle(st, modelStatusLabel) : chatCopy.connectingLabel;
  const chatDebugTitle = st ? formatChatDebugTitle(st, modelStatusLabel) : undefined;
  const memoryLabel = st && isCoreMemoryReachable(st) ? chatCopy.memoryOn : chatCopy.memoryOff;

  const openMemoryObservatory = () => {
    openSettingsSection('memory');
    if (onNavigate) onNavigate('settings');
    else onOpenSettings?.();
  };

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    void api.models.list()
      .then((models) => {
        if (cancelled || !models.length) return;
        setModelOptions(models);
        // Do not auto-rewrite the user's persisted model when discovery is transient or incomplete.
      })
      .catch(() => {
        if (!cancelled) setModelOptions(FALLBACK_MODEL_OPTIONS);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!api?.config?.get) return;
    void api.config.get().then((cfg) => {
      setComposerSendShortcut(normalizeComposerSendShortcut(cfg.composerSendShortcut));
      setConnectionMode(cfg.connectionMode ?? 'embedded');
    });
  }, [api]);

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
    return api.onPermission((req) => {
      setPermissionQueue((queue) => enqueuePermissionRequest(queue, req as PermissionRequestView));
      setContextPanel('permission');
    });
  }, [api]);

  useEffect(() => {
    const onStarter = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string; send?: boolean }>).detail;
      const action = resolveOnboardingStarterAction(detail, { ready: !!ready, hasApi: !!api });
      if (action.kind === 'queue') {
        if (rt.activeThreadId) void outbox.enqueue({ threadId: rt.activeThreadId, text: action.text });
      } else if (action.kind === 'draft') {
        setDraft(action.text);
      }
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
      setPermissionBusy(false);
      setPermissionQueue((queue) => {
        const next = dequeuePermissionRequest(queue);
        if (next.length === 0) {
          setContextPanel((panel) => (panel === 'permission' ? null : panel));
        }
        return next;
      });
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

  const streamMessages = useMemo(
    () => [...rt.messages, ...cmdMessages],
    [rt.messages, cmdMessages],
  );
  const turnAnchors = useMemo(() => turnAnchorIndices(streamMessages), [streamMessages]);
  const hasRunningTool = streamMessages.some((m) => m.toolActivity?.status === 'running');

  const copyMessageText = async (text: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.push({ title: chatCopy.copiedToast, tone: 'ok' });
    } catch {
      toast.push({ title: chatCopy.copyFailedToast, tone: 'warn' });
    }
  };
  const activeQueue = outbox.items;
  const lastRuntimeMessage = rt.messages[rt.messages.length - 1];
  const assistantStreaming = rt.busy && lastRuntimeMessage?.who === 'otto' && !!lastRuntimeMessage.text;
  const streamingRuntimeMessageIndex = assistantStreaming ? rt.messages.length - 1 : -1;
  const activityLabel = rt.turnActivity?.label ?? chatCopy.workingPulse;
  const liveTrailSteps = rt.turnTrail?.spans.length ?? 0;
  const headerSubtitle = st
    ? (rt.busy
      ? (liveTrailSteps > 0
        ? rt.turnTrail!.spans[rt.turnTrail!.spans.length - 1]?.label ?? activityLabel
        : activityLabel)
      : ready
        ? chatSessionSubtitle
        : formatRuntimeSubtitle(ready, st, labelForModel(selectedModel, modelOptions)))
    : chatCopy.connectingLabel;

  const copyConversationMarkdown = async () => {
    if (streamMessages.length === 0) {
      toast.push({
        title: chatCopy.copyMarkdownFailed,
        body: chatCopy.copyMarkdownEmpty,
        tone: 'warn',
      });
      return;
    }
    const markdown = serializeConversationMarkdown({
      title: headTitle,
      threadId: rt.activeThreadId,
      conversationId: st?.conversationId ?? null,
      messages: streamMessages,
    });
    try {
      await navigator.clipboard.writeText(markdown);
      toast.push({
        title: chatCopy.copyMarkdownDone,
        body: chatCopy.copyMarkdownDoneBody,
        tone: 'ok',
      });
    } catch (e) {
      toast.push({
        title: chatCopy.copyMarkdownFailed,
        body: e instanceof Error ? e.message : String(e),
        tone: 'warn',
      });
    }
  };

  useEffect(() => {
    turnFocusRef.current = turnAnchors.length
      ? (turnAnchors[turnAnchors.length - 1] ?? 0)
      : 0;
  }, [rt.activeThreadId, turnAnchors]);

  useEffect(() => {
    setCmdMessages([]);
    setRecalledQueueId(null);
    setExpandedMessageTexts({});
    setPermissionQueue([]);
    setPermissionBusy(false);
    setProposeContext(null);
    setProposeBusy(false);
    setContextPanel((panel) => (panel === 'permission' ? null : panel));
    setDraft(readStoredDraft(rt.activeThreadId));
    setAttachments(attachmentDraftsFromStored(readStoredAttachments(rt.activeThreadId)));
  }, [rt.activeThreadId]);

  const wasBusyRef = useRef(rt.busy);
  useEffect(() => {
    const wasBusy = wasBusyRef.current;
    wasBusyRef.current = rt.busy;
    if (wasBusy && !rt.busy && permissionQueue.length > 0) {
      setPermissionQueue([]);
      setPermissionBusy(false);
      setProposeContext(null);
      setProposeBusy(false);
      setContextPanel((panel) => (panel === 'permission' ? null : panel));
    }
  }, [rt.busy, permissionQueue.length]);

  useEffect(() => {
    writeStoredDraft(activeThreadIdRef.current, draft);
  }, [draft]);

  useEffect(() => {
    writeStoredAttachments(
      activeThreadIdRef.current,
      attachments.map(({ previewUrl: _previewUrl, ...rest }) => rest),
    );
  }, [attachments]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    syncComposerTextareaHeight(el);
  }, [draft]);

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: streamMessages.length > 1 ? 'smooth' : 'auto', block: 'end' });
  }, [streamMessages.length, rt.busy, activeQueue.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        if (isTypingTarget(document.activeElement)) return;
        event.preventDefault();
        preview.toggle();
        return;
      }
      if (!event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (isTypingTarget(document.activeElement)) return;
      if (!turnAnchors.length) return;
      event.preventDefault();
      const direction = event.key === 'ArrowUp' ? 'prev' : 'next';
      const nextIndex = jumpTurnAnchor(turnAnchors, turnFocusRef.current, direction);
      if (nextIndex == null) return;
      turnFocusRef.current = nextIndex;
      document.getElementById(`chat-turn-${streamMessages[nextIndex]?.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [streamMessages, turnAnchors, preview.toggle]);

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

  const recallQueueItem = (id: string) => {
    void (async () => {
      const recalled = await outbox.recall(id);
      if (!recalled) return;
      const { body, attachments: attachmentRefs } = composerDraftFromQueueText(recalled.text);
      const mergedRefs = recalled.attachments.length
        ? recalled.attachments.map((a) => ({ name: a.name, path: a.path ?? '', id: '', mime: a.mime }))
        : attachmentRefs;
      const unresolvedIds = mergedRefs.filter((ref) => ref.id && !ref.path).map((ref) => ref.id!);
      const resolved = unresolvedIds.length && api ? await api.attachments.resolve(unresolvedIds) : [];
      const withPaths = mergedRefs.map((ref) => {
        if (ref.path) return ref;
        const found = resolved.find((record) => record.id === ref.id);
        return found ? { ...ref, path: found.path } : ref;
      });
      setDraft(body);
      setAttachments(attachmentDraftsFromQueueRefs(withPaths));
      setRecalledQueueId(id);
      toast.push({ title: chatCopy.queueRecalledToast, tone: 'ok' });
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(body.length, body.length);
      });
    })();
  };

  const enqueueOutboxPayload = (threadId: string, payload: ReturnType<typeof buildRuntimeSendPayload>) => {
    void outbox.enqueue({
      threadId,
      text: payload.storedText,
      attachments: payload.attachments.map(({ name, path, mime }) => ({ name, path, mime })),
      model: selectedModel ?? undefined,
      effort: selectedEffort,
    });
  };

  const submit = () => {
    const t = draft.trim();
    if ((!t && attachments.length === 0) || !api) return;
    const payload = buildRuntimeSendPayload(t, attachments.map(({ id, name, path, mime }) => ({
      id,
      name,
      path,
      mime,
    })));
    const recalledId = recalledQueueId;
    void (async () => {
      const cmd = await runTicketCommand(api, payload.storedText);
      if (cmd?.handled) {
        setCmdMessages((items) => [...items, {
          id: `cmd-${Date.now()}`,
          who: 'otto',
          text: cmd.lines.join('\n'),
          checkBlock: cmd.checkBlock,
        }]);
        setDraft('');
        setAttachments([]);
        if (recalledId) setRecalledQueueId(null);
        return;
      }
      const threadId = rt.activeThreadId;
      const steering = rt.busy;
      const pendingQueued = outbox.items.some(
        (item) => item.threadId === threadId && item.state === 'queued',
      );
      if (threadId && (!ready || steering || pendingQueued)) {
        if (recalledId) setRecalledQueueId(null);
        enqueueOutboxPayload(threadId, payload);
        if (steering) void rt.abort();
        setDraft('');
        setAttachments([]);
        return;
      }
      if (recalledId) setRecalledQueueId(null);
      setDraft('');
      setAttachments([]);
      try {
        await rt.send(payload);
        notifyOnboardingFirstMessage();
      } catch {
        if (threadId) enqueueOutboxPayload(threadId, payload);
      }
    })();
  };

  // Draining the durable queue is owned by the MAIN-process pump (#754).

  const openMessagePreview = (message: ChatMsg) => {
    if (!message.text?.trim()) return;
    const next = previewFromText(message.text, {
      title: message.who === 'user' ? previewCopy.userMessageTitle : previewCopy.assistantMessageTitle,
      sourceId: message.id,
    });
    if (next) preview.show(next);
  };

  const onPreviewResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const shell = previewShellRef.current;
    if (!shell) return;
    event.preventDefault();
    resizeRef.current = {
      startX: event.clientX,
      startWidth: preview.width,
      containerWidth: shell.getBoundingClientRect().width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const state = resizeRef.current;
      if (!state) return;
      preview.setClampedWidth(state.startWidth - (event.clientX - state.startX), state.containerWidth);
    };
    const onPointerUp = () => {
      resizeRef.current = null;
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [preview.setClampedWidth]);

  const onStreamClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const pre = target.closest('pre.md__pre');
    if (!pre || !streamRef.current?.contains(pre)) return;
    const code = pre.querySelector('code')?.textContent ?? '';
    const lang = pre.getAttribute('data-preview-lang') ?? undefined;
    const next = previewFromCodeBlock(code, lang, { title: previewCopy.codeBlockTitle });
    if (next) preview.show(next);
  };

  return (
    <div className={`chatWithPreview${preview.open ? ' chatWithPreview--open' : ''}`} ref={previewShellRef}>
    <div
      className={`chat${draggingImage ? ' is-dragging-image' : ''}`}
      onContextMenu={chatDebugMenu.onContextMenu}
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
        <div className="chat__column chat__headInner">
          <span className="chat__avatar"><OttoMark size={30} className="ottoMark" dimmed={!ready} /></span>
          <div className="chat__titleBlock">
            <div className="chat__title">{headTitle}</div>
            <div className="chat__id" title={chatDebugTitle} onContextMenu={runtimeStatusDebugMenu.onContextMenu}>
              {st ? (
                <>
                  <span className={`dot ${rt.busy ? 'dot--idle' : ready ? 'dot--ok' : 'dot--warn'}`} aria-hidden="true" />
                  {rt.busy || !ready ? (
                    <span className="chat__idLabel">{headerSubtitle}</span>
                  ) : (
                    <>
                      <span className="chat__idLabel">{modelStatusLabel}</span>
                      <span className="chat__idSep" aria-hidden="true">·</span>
                      <button
                        type="button"
                        className="chat__memoryLink"
                        onClick={openMemoryObservatory}
                        title={chatCopy.memoryLinkTitle}
                      >
                        {memoryLabel}
                      </button>
                    </>
                  )}
                </>
              ) : chatCopy.connectingLabel}
            </div>
          </div>
          <div className="chat__headActions">
            <button
              type="button"
              className={`btn btn--ghost-d${contextPanel === 'project' ? ' is-active' : ''}`}
              aria-pressed={contextPanel === 'project'}
              onClick={() => setContextPanel((p) => (p === 'project' ? null : 'project'))}
            >
              {projectCopy.windowTitle}
            </button>
            <button
              type="button"
              className={`btn btn--ghost-d${contextPanel === 'permission' ? ' is-active' : ''}`}
              aria-pressed={contextPanel === 'permission'}
              onClick={() => setContextPanel((p) => (p === 'permission' ? null : 'permission'))}
            >
              {permissionCopy.windowTitle}
              {pendingPermissionCount > 0 ? (
                <span className="nav__badge nav__badge--warn">{pendingPermissionCount}</span>
              ) : null}
            </button>
            <AppSourceBadge compact />
            {st ? (
              <>
                <button
                  type="button"
                  className={`btn btn--ghost-d${preview.open ? ' btn--primary' : ''}`}
                  title={previewCopy.toggleHint}
                  aria-pressed={preview.open}
                  onClick={preview.toggle}
                >
                  {previewCopy.toggleLabel}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost-d"
                  disabled={streamMessages.length === 0}
                  title={chatCopy.copyMarkdownHint}
                  onClick={() => { void copyConversationMarkdown(); }}
                >
                  {chatCopy.copyMarkdown}
                </button>
                {!ready ? (
                  <span className="pill pill--warn">{chatCopy.setupPill}</span>
                ) : null}
              </>
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
      </div>

      <div className="chat__bodyRow">
      <div className="chat__stream" ref={streamRef} onClick={onStreamClick}>
        <div className="chat__streamInner">
          {rt.activeTodos.length > 0 && <TodoPanel todos={rt.activeTodos} />}
          {!ready && (
            <div className="inkblock chat__setup" onContextMenu={runtimeSetupDebugMenu.onContextMenu}>
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
                  <div className="inkblock__title">{runtimeSetupTitle(st.code)}</div>
                  <ReadinessPanel variant="onboarding" />
                  {st.code === 'usage-limit' ? (
                    <p className="faint inkblock__meta">{chatCopy.usageLimitSetupSuffix}</p>
                  ) : null}
                  {setupNextAction ? (
                    <p className="faint inkblock__meta">{chatCopy.runtimeSetupNextPrefix}: {setupNextAction}</p>
                  ) : null}
                </>
              )}
              <div className="inkblock__actions">
                <button type="button" className="btn btn--solid-d" onClick={() => { void rt.retry(); }}>{chatCopy.pickerRetry}</button>
                {onOpenSettings && <button type="button" className="btn btn--ghost-d" onClick={onOpenSettings}>{chatCopy.pickerOpenSettings}</button>}
                {ottoApi()?.diagnostics ? (
                  <button
                    type="button"
                    className="btn btn--ghost-d"
                    onClick={() => {
                      void ottoApi()?.diagnostics?.export().then((result) => {
                        void ottoApi()?.diagnostics?.reveal(result.bundlePath);
                      });
                    }}
                  >
                    {chatCopy.exportDiagnostics}
                  </button>
                ) : null}
              </div>
              <p className="faint" style={{ marginTop: 8, fontSize: 13 }}>{chatCopy.diagnosticsHint}</p>
            </div>
          )}
          {streamMessages.length === 0 && ready && (
            <div className="chatEmpty">
              <h2 className="chatEmpty__title">{chatCopy.sessionTitle}</h2>
              <div className="chatStarters" aria-label="Starter prompts">
                {chatCopy.starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chatStarter"
                    disabled={!ready}
                    title={ready ? undefined : chatCopy.starterBlockedTitle}
                    onClick={() => setDraft(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {streamMessages.map((m, i) => {
            if (m.who === 'tool' && m.toolActivity) {
              return (
                <div key={m.id} className="msgRow msgRow--tool">
                  <span className="msgRow__avatar msgRow__avatar--spacer" aria-hidden="true" />
                  <ToolActivityCard
                    activity={m.toolActivity}
                    timestamp={m.at}
                    onCopied={() => toast.push({ title: chatCopy.copiedToast, tone: 'ok' })}
                  />
                </div>
              );
            }
            const showWho = i === 0 || streamMessages[i - 1].who !== m.who;
            const isUser = m.who === 'user';
            const isError = m.who === 'error';
            const isStreamingMessage = assistantStreaming && i === streamingRuntimeMessageIndex && !isUser && !isError;
            const displayText = expandedMessageTexts[m.id] ?? m.text;
            const whoLabel = isUser ? 'You' : isError ? chatCopy.errorWhoLabel : 'otto';
            return (
              <div
                key={m.id}
                id={showWho ? `chat-turn-${m.id}` : undefined}
                className={`msgRow${isUser ? ' msgRow--user' : ''}${isError ? ' msgRow--error' : ''}${showWho ? '' : ' msgRow--cont'}`}
              >
                {!isUser && showWho ? (
                  <span className="msgRow__avatar" aria-hidden="true">
                    <OttoMark size={32} className="ottoMark" />
                  </span>
                ) : !isUser ? <span className="msgRow__avatar msgRow__avatar--spacer" aria-hidden="true" /> : null}
                <div className={`msg${isUser ? ' msg--user' : ''}${showWho ? '' : ' msg--cont'}`}>
                  <span className="srOnly">{whoLabel}</span>
                  {m.at ? <time className="msg__time" dateTime={m.at}>{new Date(m.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time> : null}
                  {m.checkBlock && onNavigate ? (
                    <CheckBlockBanner
                      checkName={m.checkBlock.checkName}
                      message={m.checkBlock.message}
                      receiptId={m.checkBlock.receiptId}
                      standardId={m.checkBlock.standardId}
                      onOpenReceipt={m.checkBlock.receiptId
                        ? () => openReceipt(m.checkBlock!.receiptId!, onNavigate)
                        : undefined}
                      onOpenStandard={m.checkBlock.standardId
                        ? () => openStandard(m.checkBlock!.standardId!, onNavigate)
                        : undefined}
                    />
                  ) : null}
                  {m.receiptInline ? (
                    <ReceiptInlineCard
                      id={m.receiptInline.id}
                      status={m.receiptInline.status}
                      action={m.receiptInline.action}
                      summary={m.receiptInline.summary}
                      authority={m.receiptInline.authority}
                      onOpenReceipts={onNavigate && m.receiptInline
                        ? () => openReceipt(m.receiptInline!.id, onNavigate)
                        : undefined}
                    />
                  ) : null}
                  {isError ? (
                    <div className="msg__body" style={{ color: 'var(--stop)' }}>
                      {displayText ? (
                        <StreamMarkdown text={displayText} streaming={isStreamingMessage} />
                      ) : null}
                      {m.details ? (
                        <details className="msg__details">
                          <summary>{chatCopy.errorDetailsSummary}</summary>
                          <pre className="mono faint">{m.details}</pre>
                        </details>
                      ) : null}
                    </div>
                  ) : (
<>
                      {!isUser && m.trail && m.trail.spans.length > 0 ? (
                        <TurnTrailSummary trail={m.trail} showPhases={showTurnPhases} />
                      ) : null}
                      <div className="msg__body">
                        {displayText ? (
                          isUser ? (() => {
                            const { displayBody, attachments } = parseSentMessageDisplay(displayText);
                            return (
                              <>
                                {displayBody ? (
                                  <StreamMarkdown text={displayBody} streaming={false} />
                                ) : null}
                                {attachments.length > 0 ? (
                                  <MessageAttachmentStrip attachments={attachments} />
                                ) : null}
                              </>
                            );
                          })() : (
                            <StreamMarkdown text={displayText} streaming={isStreamingMessage} />
                          )
                        ) : null}
                      </div>
                    </>
                  )}
                  <TruncatedMessageRestore
                    message={m}
                    threadId={rt.activeThreadId}
                    expandedText={expandedMessageTexts[m.id]}
                    onExpand={(messageId, fullText) => {
                      setExpandedMessageTexts((prev) => ({ ...prev, [messageId]: fullText }));
                    }}
                  />
                  {displayText ? (
                    <MessageActions
                      disabled={proposeBusy}
                      onCopy={() => { void copyMessageText(displayText); }}
                      onPreview={isUser ? () => openMessagePreview(m) : undefined}
                      onCorrectThis={!isUser && !isError ? () => setProposeContext({
                        messageId: m.id,
                        messageText: displayText,
                        who: 'otto',
                      }) : undefined}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
          {rt.busy && liveTrailSteps > 0 && !assistantStreaming && !hasRunningTool ? (
            <div className="msgRow">
              <span className="msgRow__avatar" aria-hidden="true"><OttoMark size={26} className="ottoMark" /></span>
              <div className="chat__thinking chat__thinking--trail" aria-live="polite">
                <TurnTrailLive trail={rt.turnTrail} fallbackLabel={chatCopy.workingPulse} />
              </div>
            </div>
          ) : rt.busy && !assistantStreaming ? (
            <div className="msgRow">
              <span className="msgRow__avatar" aria-hidden="true"><OttoMark size={32} className="ottoMark" /></span>
              <div
                className={`chat__thinking${rt.turnActivity ? ` chat__thinking--${rt.turnActivity.kind}` : ''}`}
                aria-live="polite"
                aria-label={activityLabel}
              >
                <span className="chat__thinkingDots" aria-hidden="true">
                  <i /><i /><i />
                </span>
                {activityLabel}
              </div>
            </div>
          ) : null}
          <div ref={tailRef} className="chat__tail" aria-hidden="true" />
        </div>
      </div>

      <ContextDrawer
        open={contextPanel === 'project'}
        title={projectCopy.windowTitle}
        onClose={() => setContextPanel((p) => (p === 'project' ? null : p))}
      >
        <ProjectWindow />
      </ContextDrawer>
      <ContextDrawer
        open={contextPanel === 'permission'}
        title={permissionCopy.windowTitle}
        onClose={() => setContextPanel((p) => (p === 'permission' ? null : p))}
      >
        <PermissionWindow
          pending={permission}
          pendingCount={pendingPermissionCount}
          busy={permissionBusy}
          onDecide={(decision, denyMessage) => { void respondPermission(decision, denyMessage); }}
          onCorrectThis={openPermissionCorrection}
        />
      </ContextDrawer>
      </div>

      <div className="promptbar">
        <div className="chat__column">
        {ready && (
          <ModelFallbackBanner
            ready={ready}
            requested={requestedModel}
            active={activeModel}
            fallbackReason={st?.modelFallbackReason}
            labelFor={(handle) => labelForModel(handle, modelOptions)}
          />
        )}
        {ready && activeQueue.length > 0 && (
          <OutboxBanner
            items={outbox.items}
            threadId={rt.activeThreadId}
            recalledId={recalledQueueId}
            onClear={() => {
              setRecalledQueueId(null);
              void outbox.clear();
            }}
            onRetryAll={() => void outbox.retryAll()}
            onRetryOne={(id) => void outbox.retry(id)}
            onRecall={recallQueueItem}
            onRemove={(id) => {
              if (recalledQueueId === id) setRecalledQueueId(null);
              void outbox.cancel(id);
            }}
            getDetail={outbox.detail}
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
        <div className="promptCompose">
          <div className={`promptbox${ready ? '' : ' promptbox--send-blocked'}`}>
            <textarea
              ref={textareaRef}
              placeholder={
                ready
                  ? (rt.busy ? chatCopy.composerPlaceholderBusy : chatCopy.composerPlaceholderReady)
                  : st?.code === 'usage-limit'
                    ? chatCopy.composerPlaceholderUsageLimit
                    : st
                      ? chatCopy.composerPlaceholderDraftWhileSetup
                      : chatCopy.runtimeConnectingTitle
              }
              aria-label={chatCopy.composerAriaLabel}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onPaste={(e) => {
                const files = imageFilesFromTransfer(e.clipboardData);
                if (!files.length) return;
                e.preventDefault();
                void attachImages(files);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setDraft('');
                  e.currentTarget.blur();
                  return;
                }
                const canSend = ready && (draft.trim() || attachments.length > 0);
                if (
                  canSend
                  && shouldComposerShortcutSubmit(e.key, e.shiftKey, composerSendShortcut)
                ) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
            />
            <button
              type="button"
              className="btn btn--primary btn--icon promptbox__send"
              aria-label={rt.busy ? 'Queue message' : 'Send message'}
              title={ready ? undefined : chatCopy.composerSendBlockedTitle}
              disabled={!ready || (!draft.trim() && attachments.length === 0)}
              onClick={submit}
            >
              {Icon.send}
            </button>
          </div>
          <div className="promptbar__footer">
            <div className="promptbar__hint">
              {ready
                ? (composerHintKey(composerSendShortcut) === 'enter'
                  ? chatCopy.composerHintEnter
                  : chatCopy.composerHintTab)
                : chatCopy.composerNotReadyHint}
            </div>
            {ready && st ? (
              <div className="promptbar__pickers" ref={pickerRef}>
                <ModelEffortPickers
                  busy={rt.busy}
                  selectedModel={selectedModel}
                  resolvedModelLabel={resolvedModelLabel}
                  selectedEffort={selectedEffort}
                  modelOpen={modelOpen}
                  effortOpen={effortOpen}
                  onToggleModel={() => { setModelOpen((x) => !x); setEffortOpen(false); }}
                  onToggleEffort={() => { setEffortOpen((x) => !x); setModelOpen(false); }}
                  onClose={() => { setModelOpen(false); setEffortOpen(false); }}
                  onSelectModel={(value) => { void rt.configure({ modelHandle: value }); }}
                  onSelectEffort={(value) => { void rt.configure({ effort: value }); }}
                  modelOptions={modelOptions}
                  compact
                  menuPlacement="up"
                />
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </div>

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
    <PreviewPane
      open={preview.open}
      width={preview.width}
      content={preview.content}
      onClose={preview.close}
      onResizeStart={onPreviewResizeStart}
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
      <div className="chat__column">
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
          <strong>This is the web preview.</strong> Open the desktop app to connect to a local Letta runtime.
        </span>
      </div>
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
  </div>
);
