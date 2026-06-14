import { randomUUID } from 'node:crypto';

export type WsRuntimeEvent = Record<string, unknown> & { type?: string };

/** Map Letta BYOR stream_delta into Otto chat event shape. */
export function normalizeWsEvent(event: WsRuntimeEvent): Record<string, unknown> | null {
  switch (event.type) {
    case 'stream_delta': {
      const delta = event.delta as Record<string, unknown> | undefined;
      if (!delta) return null;
      const messageType = String(delta.message_type ?? '');
      if (messageType !== 'assistant_message') return null;
      const text = extractDeltaText(delta.content);
      if (!text) return null;
      return { type: 'assistant', text, content: delta.content, uuid: randomUUID() };
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
