import type { TurnEventType } from './schema';

/**
 * Normalize a loosely-typed Letta runtime message into a TurnTrail-compatible turn event (#727:
 * thought | tool | checkpoint), extended with outbox lifecycle types (token | error | receipt).
 *
 * Pure + driver-free so it is fully unit-testable and reusable by TurnTrail. Returns null for
 * messages that carry no displayable progress (e.g. empty deltas).
 */
export type NormalizedTurnEvent = {
  type: TurnEventType;
  status: string;
  title: string;
  body?: string;
  payload?: unknown;
};

function firstString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

export function normalizeRuntimeMessageToTurnEvent(
  message: Record<string, unknown>,
): NormalizedTurnEvent | null {
  const type = typeof message.type === 'string' ? message.type : '';

  switch (type) {
    case 'assistant': {
      const text = firstString(message.text, message.content);
      if (!text) return null;
      return { type: 'token', status: 'streaming', title: 'Reply', body: text };
    }
    case 'thinking':
    case 'reasoning':
    case 'thought': {
      const text = firstString(message.text, message.reasoning, message.content);
      return { type: 'thought', status: 'running', title: 'Thinking', ...(text ? { body: text } : {}) };
    }
    case 'tool_use':
    case 'tool':
    case 'tool_call':
    case 'function_call': {
      const name = firstString(message.name, message.tool, message.toolName) ?? 'tool';
      return {
        type: 'tool',
        status: typeof message.status === 'string' ? message.status : 'running',
        title: name,
        payload: message.input ?? message.arguments ?? message.args ?? null,
      };
    }
    case 'tool_result': {
      const name = firstString(message.name, message.tool, message.toolName) ?? 'tool';
      return { type: 'tool', status: 'done', title: name, payload: message.result ?? message.output ?? null };
    }
    case 'checkpoint':
    case 'system': {
      const title = firstString(message.title, message.label, message.subtype) ?? 'Checkpoint';
      return { type: 'checkpoint', status: 'info', title };
    }
    case 'error': {
      const text = firstString(message.message, message.error, message.reason) ?? 'error';
      return { type: 'error', status: 'failed', title: 'Error', body: text };
    }
    case 'result': {
      const success = (message as { success?: boolean }).success;
      return {
        type: 'receipt',
        status: success === false ? 'failed' : 'done',
        title: success === false ? 'Turn failed' : 'Turn complete',
      };
    }
    default:
      return null;
  }
}
