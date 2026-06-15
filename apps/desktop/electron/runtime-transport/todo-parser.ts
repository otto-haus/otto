export type TodoItemStatus = 'pending' | 'in_progress' | 'completed';

export type TodoItem = {
  id: string;
  content: string;
  status: TodoItemStatus;
};

const TODO_TOOL_NAMES = new Set(['todowrite', 'todo_write', 'todo-write']);

export function isTodoToolName(name: string | undefined | null): boolean {
  if (!name) return false;
  return TODO_TOOL_NAMES.has(name.trim().toLowerCase());
}

function normalizeStatus(raw: unknown): TodoItemStatus {
  if (raw === 'completed') return 'completed';
  if (raw === 'in_progress') return 'in_progress';
  return 'pending';
}

function todoContent(rec: Record<string, unknown>, fallback: string): string {
  if (typeof rec.content === 'string' && rec.content.trim()) return rec.content;
  if (typeof rec.description === 'string' && rec.description.trim()) return rec.description;
  return fallback;
}

export function parseTodoItemsFromArgs(argsText: string): TodoItem[] | null {
  if (!argsText.trim()) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(argsText);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { todos?: unknown }).todos)) {
    return null;
  }
  const todos = (parsed as { todos: unknown[] }).todos;
  if (!todos.length) return [];
  return todos.map((item, index) => {
    const rec = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const id = typeof rec.id === 'string' && rec.id ? rec.id : `todo-${index}`;
    return {
      id,
      content: todoContent(rec, `Task ${index + 1}`),
      status: normalizeStatus(rec.status),
    };
  });
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
  return null;
}

/** Accumulate streamed TodoWrite tool-call args and emit parsed lists when JSON is complete. */
export class TodoStreamAccumulator {
  private argsByCallId = new Map<string, string>();
  private nameByCallId = new Map<string, string>();

  reset(): void {
    this.argsByCallId.clear();
    this.nameByCallId.clear();
  }

  ingestStreamDelta(delta: Record<string, unknown>): TodoItem[] | null {
    if (String(delta.message_type ?? '') !== 'tool_call_message') return null;
    const toolCall = readToolCall(delta);
    if (!toolCall?.tool_call_id) return null;
    const id = toolCall.tool_call_id;
    if (toolCall.name) this.nameByCallId.set(id, toolCall.name);
    if (typeof toolCall.arguments === 'string' && toolCall.arguments.length > 0) {
      this.argsByCallId.set(id, `${this.argsByCallId.get(id) ?? ''}${toolCall.arguments}`);
    }
    const name = this.nameByCallId.get(id);
    if (!isTodoToolName(name)) return null;
    return parseTodoItemsFromArgs(this.argsByCallId.get(id) ?? '');
  }
}
