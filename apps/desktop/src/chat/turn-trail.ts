import { formatToolActivity } from './turn-activity';

export type TurnSpanStatus = 'running' | 'done' | 'error';

export type TurnSpanKind = 'reasoning' | 'tool';

export type TurnSpan = {
  id: string;
  kind: TurnSpanKind;
  toolName?: string;
  label: string;
  detail?: string;
  status: TurnSpanStatus;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
};

export type TurnTrail = {
  spans: TurnSpan[];
  totalDurationMs: number;
};

export type TurnPhase = 'orient' | 'locate' | 'edit' | 'verify';

const LOCATE_TOOLS = new Set(['read', 'read_file', 'grep', 'glob', 'web_search', 'web_fetch']);
const EDIT_TOOLS = new Set(['write', 'write_file', 'edit', 'edit_file', 'bash', 'run_shell', 'shell']);
const ORIENT_TOOLS = new Set(['askuserquestion', 'exitplanmode', 'todowrite', 'todo_write', 'todo-write']);
const VERIFY_CMD = /\b(test|lint|verify|check|typecheck|pytest|vitest|jest|bun\s+test)\b/i;

const SECRET_KEY = /(?:api[_-]?key|token|password|secret|bearer)/i;
const ENV_ASSIGN = /\b[A-Z][A-Z0-9_]{2,}=(?!…)[^\s]+/g;
const SECRET_VALUE = /(?:sk-|ghp_|gho_|xox[baprs]-)[A-Za-z0-9_-]{8,}/g;

export function redactTrailText(raw: string): string {
  let text = raw;
  text = text.replace(SECRET_VALUE, '…');
  text = text.replace(ENV_ASSIGN, (m) => `${m.split('=')[0]}=…`);
  text = text.replace(
    /([\w-]*(?:api[_-]?key|token|password|secret|bearer)[\w-]*)\s*=\s*\S+/gi,
    '$1=…',
  );
  text = text.replace(
    /(--?(?:api[_-]?key|token|password|secret|bearer)(?:=\S+|\s+)\S+)/gi,
    '…',
  );
  if (SECRET_KEY.test(text)) return text.replace(/:\s*\S+/g, ': …');
  return text;
}

function basename(path: string): string {
  const trimmed = path.replace(/\\/g, '/').replace(/\/+$/, '');
  const parts = trimmed.split('/');
  return parts[parts.length - 1] || trimmed;
}

function truncateTarget(raw: string, max = 48): string {
  const redacted = redactTrailText(raw.trim());
  if (redacted.length <= max) return redacted;
  const base = basename(redacted);
  if (base.length <= max && base !== redacted) return base;
  return `${redacted.slice(0, max - 1)}…`;
}

function parseToolInput(input: unknown): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return { command: input };
    }
  }
  if (typeof input === 'object') return input as Record<string, unknown>;
  return {};
}

function hostFromUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    return new URL(raw).host || null;
  } catch {
    return truncateTarget(raw, 32);
  }
}

function fullShellCommand(command: unknown): string | null {
  if (typeof command !== 'string' || !command.trim()) return null;
  return truncateTarget(command.trim(), 80);
}

function firstCommandToken(command: unknown): string | null {
  if (typeof command !== 'string' || !command.trim()) return null;
  const token = command.trim().split(/\s+/)[0] ?? '';
  return token ? truncateTarget(token, 32) : null;
}

function pathTarget(input: Record<string, unknown>, forLabel = false): string | null {
  const path = input.path ?? input.file ?? input.file_path ?? input.filepath;
  if (typeof path !== 'string' || !path.trim()) return null;
  const trimmed = path.trim();
  return forLabel ? basename(trimmed) : truncateTarget(trimmed);
}

function patternTarget(input: Record<string, unknown>): string | null {
  const pattern = input.pattern ?? input.query ?? input.glob_pattern ?? input.glob;
  if (typeof pattern === 'string' && pattern.trim()) return truncateTarget(pattern, 40);
  return null;
}

export function spanLabelFromTool(
  toolName: string,
  input: unknown,
  phase: 'call' | 'result',
): { label: string; detail?: string } {
  const key = toolName.trim().toLowerCase();
  const args = parseToolInput(input);
  const path = pathTarget(args, true);
  const pathDetail = pathTarget(args, false);
  const pattern = patternTarget(args);
  const query = typeof args.query === 'string' ? truncateTarget(args.query, 40) : null;
  const host = hostFromUrl(args.url);
  const argv0 = firstCommandToken(args.command ?? args.cmd);
  const shellDetail = fullShellCommand(args.command ?? args.cmd);

  if (key === 'read' || key === 'read_file') {
    const target = path ?? 'file';
    return phase === 'call'
      ? { label: `Reading ${target}…`, detail: pathDetail ?? undefined }
      : { label: `Read ${target}`, detail: pathDetail ?? undefined };
  }
  if (key === 'grep') {
    const target = pattern ?? 'pattern';
    return phase === 'call'
      ? { label: `Searching for ${target}…`, detail: pattern ?? undefined }
      : { label: `Searched for ${target}`, detail: pattern ?? undefined };
  }
  if (key === 'glob') {
    const target = pattern ?? 'pattern';
    return phase === 'call'
      ? { label: `Finding ${target}…`, detail: pattern ?? undefined }
      : { label: `Found ${target}`, detail: pattern ?? undefined };
  }
  if (key === 'write' || key === 'write_file') {
    const target = path ?? 'file';
    return phase === 'call'
      ? { label: `Writing ${target}…`, detail: pathDetail ?? undefined }
      : { label: `Wrote ${target}`, detail: pathDetail ?? undefined };
  }
  if (key === 'edit' || key === 'edit_file') {
    const target = path ?? 'file';
    return phase === 'call'
      ? { label: `Editing ${target}…`, detail: pathDetail ?? undefined }
      : { label: `Edited ${target}`, detail: pathDetail ?? undefined };
  }
  if (key === 'bash' || key === 'run_shell' || key === 'shell') {
    const target = argv0 ?? 'command';
    return phase === 'call'
      ? { label: `Running ${target}…`, detail: shellDetail ?? argv0 ?? undefined }
      : { label: `Ran ${target}`, detail: shellDetail ?? argv0 ?? undefined };
  }
  if (key === 'web_search') {
    const target = query ?? pattern ?? 'query';
    return phase === 'call'
      ? { label: `Searching web for ${target}…`, detail: query ?? pattern ?? undefined }
      : { label: `Searched web for ${target}`, detail: query ?? pattern ?? undefined };
  }
  if (key === 'web_fetch') {
    const target = host ?? 'page';
    return phase === 'call'
      ? { label: `Fetching ${target}…`, detail: host ?? undefined }
      : { label: `Fetched ${target}`, detail: host ?? undefined };
  }
  if (key === 'reasoning') {
    return phase === 'call' ? { label: 'Reasoning…' } : { label: 'Reasoned' };
  }

  const generic = formatToolActivity(toolName, phase);
  return { label: generic };
}

function isLocateSpan(span: TurnSpan): boolean {
  const tool = span.toolName?.toLowerCase() ?? '';
  return LOCATE_TOOLS.has(tool);
}

function countLocateReadSpans(spans: TurnSpan[]): number {
  return spans.filter((s) => s.kind === 'tool' && isLocateSpan(s)).length;
}

export function formatTrailDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(1, Math.round(ms))}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function collapsedTrailSummary(trail: TurnTrail): string {
  const closed = trail.spans.filter((s) => s.status !== 'running');
  const duration = formatTrailDuration(trail.totalDurationMs);
  const locateCount = countLocateReadSpans(closed);
  if (locateCount >= 2) {
    return `Explored ${locateCount} files · ${duration}`;
  }
  const count = closed.length || trail.spans.length;
  if (count === 0) return '';
  return `${count} step${count === 1 ? '' : 's'} · ${duration}`;
}

export function deriveTurnPhases(trail: TurnTrail): TurnPhase[] {
  if (!trail.spans.length) return [];
  const phases: TurnPhase[] = [];
  const push = (phase: TurnPhase) => {
    if (!phases.includes(phase)) phases.push(phase);
  };

  for (const span of trail.spans) {
    if (span.kind === 'reasoning') {
      push('orient');
      continue;
    }
    const tool = span.toolName?.toLowerCase() ?? '';
    if (!tool) continue;
    if (ORIENT_TOOLS.has(tool)) push('orient');
    if (LOCATE_TOOLS.has(tool)) push('locate');
    if (EDIT_TOOLS.has(tool)) push('edit');
    if ((tool === 'bash' || tool === 'run_shell' || tool === 'shell') && VERIFY_CMD.test(span.detail ?? span.label)) {
      push('verify');
    }
  }
  return phases;
}

export function formatPhaseStrip(phases: TurnPhase[]): string {
  const labels: Record<TurnPhase, string> = {
    orient: 'Orient',
    locate: 'Locate',
    edit: 'Edit',
    verify: 'Verify',
  };
  return phases.map((p) => labels[p]).join(' · ');
}

export function emptyTurnTrail(): TurnTrail {
  return { spans: [], totalDurationMs: 0 };
}

function trailTotalDuration(spans: TurnSpan[]): number {
  return spans.reduce((sum, span) => sum + (span.durationMs ?? 0), 0);
}

function snapshot(spans: TurnSpan[]): TurnTrail {
  return { spans: spans.map((s) => ({ ...s })), totalDurationMs: trailTotalDuration(spans) };
}

function toolNameFromUnknown(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const name = record.name ?? record.tool_name ?? record.toolName;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return null;
}

/**
 * Resolve a tool-call id from any of the field-name variants emitted across the SDK and WS
 * transports. Both open (tool_call) and close (tool_return) paths must read the same set so a
 * span opened under a real id is also closed/relabeled under that same id (see blocker #4).
 */
function pickToolCallId(source: unknown): string | null {
  if (!source || typeof source !== 'object') return null;
  const rec = source as Record<string, unknown>;
  const raw = rec.tool_call_id ?? rec.toolCallId ?? rec.tool_callId ?? rec.toolCallID;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

type ToolCallShape = {
  tool_call_id?: string;
  name?: string;
  arguments?: string;
};

function readToolCall(delta: Record<string, unknown>): ToolCallShape | null {
  const direct = delta.tool_call;
  if (direct && typeof direct === 'object') return direct as ToolCallShape;
  const calls = delta.tool_calls;
  if (Array.isArray(calls) && calls[0] && typeof calls[0] === 'object') {
    return calls[0] as ToolCallShape;
  }
  if (typeof delta.name === 'string') {
    return { tool_call_id: String(delta.tool_call_id ?? delta.id ?? ''), name: delta.name };
  }
  return null;
}

function closeReasoningSpan(spans: TurnSpan[], now: number): void {
  const open = [...spans].reverse().find((s) => s.kind === 'reasoning' && s.status === 'running');
  if (!open) return;
  open.status = 'done';
  open.endedAt = now;
  open.durationMs = Math.max(0, now - open.startedAt);
  const done = spanLabelFromTool('reasoning', null, 'result');
  open.label = done.label;
}

/** Accumulate spans for one in-flight turn — used in main-process transports only. */
export class TurnTrailAccumulator {
  private spans: TurnSpan[] = [];
  private argsByCallId = new Map<string, string>();
  private nameByCallId = new Map<string, string>();
  private seq = 0;

  reset(): void {
    this.spans = [];
    this.argsByCallId.clear();
    this.nameByCallId.clear();
    this.seq = 0;
  }

  finalize(): TurnTrail {
    const now = Date.now();
    for (const span of this.spans) {
      if (span.status === 'running') {
        span.status = 'done';
        span.endedAt = now;
        span.durationMs = Math.max(0, now - span.startedAt);
      }
    }
    return snapshot(this.spans);
  }

  snapshot(): TurnTrail {
    return snapshot(this.spans);
  }

  ingestWsDelta(delta: Record<string, unknown>): TurnTrail | null {
    const messageType = String(delta.message_type ?? '');
    if (messageType === 'reasoning_message' || messageType === 'hidden_reasoning_message') {
      return this.openReasoning();
    }
    if (messageType === 'tool_call_message') {
      return this.ingestToolCallDelta(delta);
    }
    if (messageType === 'tool_return_message') {
      return this.closeToolReturn(delta);
    }
    return null;
  }

  ingestRuntimeMessage(message: Record<string, unknown>): TurnTrail | null {
    switch (message.type) {
      case 'reasoning':
        return this.openReasoning();
      case 'tool_call': {
        const toolName = String(message.toolName ?? message.name ?? 'tool');
        const input = message.toolInput ?? message.input ?? message.arguments;
        const callId =
          pickToolCallId(message)
          ?? (typeof message.id === 'string' && message.id.trim() ? message.id.trim() : `sdk-${++this.seq}`);
        return this.openToolSpan(callId, toolName, input);
      }
      case 'tool_result': {
        // Resolve the real id when present; otherwise closeSpan falls back to the most recent
        // still-running tool span. Do NOT synthesize `sdk-${seq}` here — interleaved reasoning
        // spans bump `seq`, so a synthetic id would miss the span it was meant to close.
        const id = pickToolCallId(message) ?? (typeof message.id === 'string' ? message.id.trim() : '');
        return this.closeSpan(id, 'done');
      }
      case 'stream_event': {
        const event = message.event;
        if (!event || typeof event !== 'object') return null;
        const payload = event as Record<string, unknown>;
        if (payload.message_type) return this.ingestWsDelta(payload);
        return null;
      }
      case 'activity': {
        if (message.kind === 'reasoning') return this.openReasoning();
        return null;
      }
      default:
        return null;
    }
  }

  private openReasoning(): TurnTrail {
    const now = Date.now();
    closeReasoningSpan(this.spans, now);
    const { label } = spanLabelFromTool('reasoning', null, 'call');
    this.spans.push({
      id: `reasoning-${++this.seq}`,
      kind: 'reasoning',
      toolName: 'reasoning',
      label,
      status: 'running',
      startedAt: now,
    });
    return this.snapshot();
  }

  private ingestToolCallDelta(delta: Record<string, unknown>): TurnTrail | null {
    const calls = delta.tool_calls;
    if (Array.isArray(calls) && calls.length > 0) {
      let trail: TurnTrail | null = null;
      for (const call of calls) {
        if (call && typeof call === 'object') {
          trail = this.ingestSingleToolCall(call as ToolCallShape, delta);
        }
      }
      return trail;
    }
    const toolCall = readToolCall(delta);
    if (!toolCall) return null;
    return this.ingestSingleToolCall(toolCall, delta);
  }

  private ingestSingleToolCall(toolCall: ToolCallShape, delta: Record<string, unknown>): TurnTrail | null {
    const callId =
      pickToolCallId(toolCall)
      ?? pickToolCallId(delta)
      ?? `ws-${++this.seq}`;
    if (toolCall?.name) this.nameByCallId.set(callId, toolCall.name);
    if (typeof toolCall?.arguments === 'string' && toolCall.arguments.length > 0) {
      this.argsByCallId.set(callId, `${this.argsByCallId.get(callId) ?? ''}${toolCall.arguments}`);
    }
    const name = this.nameByCallId.get(callId) ?? toolNameFromUnknown(delta.name) ?? 'tool';
    if (name.trim().toLowerCase() === 'todowrite') return null;
    let args: unknown = this.argsByCallId.get(callId);
    if (args) {
      try {
        args = JSON.parse(String(args));
      } catch {
        /* stream may be partial */
      }
    }
    return this.openToolSpan(callId, name, args);
  }

  private openToolSpan(callId: string, toolName: string, input: unknown): TurnTrail {
    const now = Date.now();
    closeReasoningSpan(this.spans, now);
    // Remember the call args so the close/relabel can keep the real target (e.g. "Read a.ts"
    // not "Read file"). WS already accumulates partial args under this id, so don't clobber them.
    if (input != null && !this.argsByCallId.has(callId)) {
      const serialized = typeof input === 'string'
        ? input
        : (() => {
            try {
              return JSON.stringify(input);
            } catch {
              return null;
            }
          })();
      if (serialized) this.argsByCallId.set(callId, serialized);
    }
    const existing = this.spans.find((s) => s.id === callId && s.status === 'running');
    if (existing) {
      const { label, detail } = spanLabelFromTool(toolName, input, 'call');
      existing.label = label;
      existing.detail = detail;
      existing.toolName = toolName;
      return this.snapshot();
    }
    const { label, detail } = spanLabelFromTool(toolName, input, 'call');
    this.spans.push({
      id: callId,
      kind: 'tool',
      toolName,
      label,
      detail,
      status: 'running',
      startedAt: now,
    });
    return this.snapshot();
  }

  private closeToolReturn(delta: Record<string, unknown>): TurnTrail | null {
    // Read the same id variants the open path uses; fall back to the most recent running tool
    // span when the close delta omits/renames the id, so the span still closes (blocker #4).
    const callId =
      pickToolCallId(delta)
      ?? pickToolCallId(delta.tool_call)
      ?? this.lastRunningToolId();
    if (!callId) return null;
    const span = this.spans.find((s) => s.id === callId);
    const toolName = span?.toolName ?? this.nameByCallId.get(callId) ?? 'tool';
    const input = (() => {
      const raw = this.argsByCallId.get(callId);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    })();
    const closed = this.closeSpan(callId, 'done', toolName, input);
    return closed;
  }

  /** Id of the most recent still-running tool span, used as a close fallback. */
  private lastRunningToolId(): string {
    const span = [...this.spans].reverse().find((s) => s.kind === 'tool' && s.status === 'running');
    return span?.id ?? '';
  }

  private closeSpan(
    callId: string,
    status: TurnSpanStatus,
    toolName?: string,
    input?: unknown,
  ): TurnTrail {
    const now = Date.now();
    let span = callId ? this.spans.find((s) => s.id === callId && s.status === 'running') : undefined;
    if (!span) {
      // Some transports omit or rename the id on close; match the most recent still-running
      // tool span instead of leaving it stuck as 'running' until finalize() (blocker #4).
      span = [...this.spans].reverse().find((s) => s.kind === 'tool' && s.status === 'running');
    }
    if (span) {
      span.status = status;
      span.endedAt = now;
      span.durationMs = Math.max(0, now - span.startedAt);
      const resolvedTool = toolName ?? span.toolName;
      const resolvedInput = input ?? (() => {
        const raw = this.argsByCallId.get(span!.id);
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      })();
      if (span.kind === 'tool' && resolvedTool) {
        const { label, detail } = spanLabelFromTool(resolvedTool, resolvedInput, 'result');
        span.label = label;
        if (detail) span.detail = detail;
      }
    }
    return this.snapshot();
  }
}

/**
 * Index of the assistant message that owns the current turn, or -1 if none.
 *
 * Scopes the search to messages AFTER the most recent user message so a tool-only turn (one that
 * produces spans but no assistant text) never attaches its trail to a previous answer (blocker #3).
 */
export function currentTurnAssistantIndex(messages: ReadonlyArray<{ who: string }>): number {
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.who === 'user') {
      lastUserIdx = i;
      break;
    }
  }
  for (let i = messages.length - 1; i > lastUserIdx; i--) {
    if (messages[i]?.who === 'otto') return i;
  }
  return -1;
}

export function trailTraceSummary(trail: TurnTrail): Record<string, unknown> {
  return {
    spanCount: trail.spans.length,
    totalDurationMs: trail.totalDurationMs,
    summary: collapsedTrailSummary(trail),
    spans: trail.spans.map((s) => ({
      id: s.id,
      kind: s.kind,
      toolName: s.toolName,
      label: s.label,
      detail: s.detail,
      status: s.status,
      durationMs: s.durationMs,
    })),
  };
}
