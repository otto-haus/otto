import { randomUUID } from 'node:crypto';
import type { TodoItem } from './todo-parser';
import { activityFromWsDelta } from '../../src/chat/turn-activity';
import type { TurnTrailAccumulator } from '../../src/chat/turn-trail';

export type WsRuntimeEvent = Record<string, unknown> & { type?: string };

export type WsNormalizeContext = {
  todoAccumulator?: { ingestStreamDelta(delta: Record<string, unknown>): TodoItem[] | null };
  trailAccumulator?: TurnTrailAccumulator;
  /** Stable id for all assistant deltas of one turn (#779). */
  assistantStreamId?: string;
};

/** Map Letta BYOR stream_delta into Otto chat event shape. */
export function normalizeWsEvent(
  event: WsRuntimeEvent,
  ctx: WsNormalizeContext = {},
): Record<string, unknown> | null {
  switch (event.type) {
    case 'stream_delta': {
      const delta = event.delta as Record<string, unknown> | undefined;
      if (!delta) return null;
      const messageType = String(delta.message_type ?? '');
      if (ctx.trailAccumulator) {
        ctx.trailAccumulator.ingestWsDelta(delta);
      }
      if (messageType === 'tool_call_message' && ctx.todoAccumulator) {
        const todos = ctx.todoAccumulator.ingestStreamDelta(delta);
        if (todos) {
          return { type: 'todo_update', todos, uuid: randomUUID() };
        }
      }
      if (messageType === 'loop_error') {
        return {
          type: 'error',
          message: String(delta.message ?? delta.error ?? 'Runtime loop error'),
          uuid: randomUUID(),
        };
      }
      if (messageType === 'assistant_message') {
        const text = extractDeltaText(delta.content);
        if (!text) return null;
        return {
          type: 'assistant',
          text,
          content: delta.content,
          uuid: ctx.assistantStreamId ?? randomUUID(),
        };
      }
      if (messageType === 'tool_call_message' || messageType === 'tool_call') {
        const { toolCallId, toolName, toolInput } = readToolCallFromDelta(delta);
        return { type: 'tool_call', toolCallId, toolName, toolInput, uuid: randomUUID() };
      }
      if (messageType === 'tool_return_message' || messageType === 'tool_result') {
        const toolCallId = pickToolCallIdFromDelta(delta);
        const content = extractDeltaText(delta.content) ?? String(delta.tool_return ?? delta.output ?? '');
        const isError = Boolean(delta.is_error ?? delta.isError);
        return { type: 'tool_result', toolCallId, content, isError, uuid: randomUUID() };
      }
      const activity = activityFromWsDelta(delta);
      if (activity) {
        return { type: 'activity', kind: activity.kind, label: activity.label, uuid: randomUUID() };
      }
      return null;
    }
    case 'error':
      return {
        type: 'error',
        message: String(event.message ?? event.error ?? 'Runtime error'),
        uuid: randomUUID(),
      };
    default:
      return null;
  }
}

export function isLoopIdle(event: WsRuntimeEvent): boolean {
  if (event.type !== 'update_loop_status') return false;
  const loop = event.loop_status as { status?: string; active_run_ids?: unknown[] } | undefined;
  return loop?.status === 'WAITING_ON_INPUT' && (!loop.active_run_ids || loop.active_run_ids.length === 0);
}

export function isDeviceOnline(event: WsRuntimeEvent): boolean {
  if (event.type !== 'update_device_status') return false;
  const device = event.device_status as { is_online?: boolean } | undefined;
  return device?.is_online === true;
}

/** Count attachment lines appended by Chat `withAttachments()`. */
export function countAttachmentsInPrompt(text: string): number {
  const marker = text.match(/Attached local images?:\r?\n/i);
  if (!marker || marker.index === undefined) return 0;
  const tail = text.slice(marker.index + marker[0].length);
  let count = 0;
  for (const line of tail.split(/\r?\n/)) {
    if (/^\d+\.\s/.test(line)) count += 1;
    else if (line.trim() && count > 0) break;
  }
  return count;
}

export const TURN_IDLE_TIMEOUT_BASE_MS = 120_000;
export const TURN_IDLE_TIMEOUT_PER_ATTACHMENT_MS = 30_000;
export const TURN_IDLE_TIMEOUT_MAX_MS = 600_000;
export const DEFAULT_CONNECT_TIMEOUT_MS = 45_000;

/** Scale turn idle wait for attachment-heavy prompts; override with OTTO_WS_TURN_IDLE_TIMEOUT_MS. */
export function turnIdleTimeoutMs(
  text: string,
  connectTimeoutMs = DEFAULT_CONNECT_TIMEOUT_MS,
  attachmentCount?: number,
): number {
  const override = Number(process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS);
  if (Number.isFinite(override) && override > 0) return override;
  const attachments = attachmentCount ?? countAttachmentsInPrompt(text);
  const scaled = TURN_IDLE_TIMEOUT_BASE_MS + attachments * TURN_IDLE_TIMEOUT_PER_ATTACHMENT_MS;
  return Math.max(connectTimeoutMs, Math.min(scaled, TURN_IDLE_TIMEOUT_MAX_MS));
}

type ToolCallShape = {
  tool_call_id?: string;
  toolCallId?: string;
  name?: string;
  tool_name?: string;
  toolName?: string;
  arguments?: string | Record<string, unknown>;
};

function readNestedToolCall(delta: Record<string, unknown>): ToolCallShape | null {
  const direct = delta.tool_call;
  if (direct && typeof direct === 'object') return direct as ToolCallShape;
  const calls = delta.tool_calls;
  if (Array.isArray(calls) && calls[0] && typeof calls[0] === 'object') {
    return calls[0] as ToolCallShape;
  }
  return null;
}

function parseToolInput(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function readToolCallFromDelta(delta: Record<string, unknown>): {
  toolCallId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
} {
  const nested = readNestedToolCall(delta);
  const toolCallId = String(
    nested?.tool_call_id ?? nested?.toolCallId
    ?? delta.tool_call_id ?? delta.toolCallId
    ?? randomUUID(),
  );
  const toolName = String(
    nested?.name ?? nested?.tool_name ?? nested?.toolName
    ?? delta.tool_name ?? delta.toolName ?? delta.name
    ?? 'tool',
  );
  const toolInput = nested?.arguments !== undefined
    ? parseToolInput(nested.arguments)
    : parseToolInput(delta.tool_input ?? delta.toolInput ?? delta.arguments ?? {});
  return { toolCallId, toolName, toolInput };
}

function pickToolCallIdFromDelta(delta: Record<string, unknown>): string {
  const nested = readNestedToolCall(delta);
  const raw = delta.tool_call_id ?? delta.toolCallId
    ?? nested?.tool_call_id ?? nested?.toolCallId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : '';
}

function extractDeltaText(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const parts = content
      .map((part) => {
        if (part && typeof part === 'object' && 'text' in part) return String((part as { text: unknown }).text);
        return '';
      })
      .filter(Boolean);
    return parts.length ? parts.join('') : null;
  }
  if (content && typeof content === 'object' && 'text' in content) return String((content as { text: unknown }).text);
  return null;
}
