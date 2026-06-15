export type TurnActivityKind = 'thinking' | 'reasoning' | 'tool' | 'tool_result';

export type TurnActivity = {
  kind: TurnActivityKind;
  label: string;
};

const TOOL_VERB: Record<string, string> = {
  read: 'Reading',
  read_file: 'Reading file',
  write: 'Writing',
  write_file: 'Writing file',
  edit: 'Editing',
  edit_file: 'Editing file',
  grep: 'Searching',
  glob: 'Finding files',
  bash: 'Running command',
  run_shell: 'Running command',
  shell: 'Running command',
  web_search: 'Searching web',
  web_fetch: 'Fetching page',
  askuserquestion: 'Waiting for input',
  exitplanmode: 'Planning',
};

function humanizeToolName(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (TOOL_VERB[key]) return TOOL_VERB[key];
  const spaced = key.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!spaced) return 'Running tool';
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatToolActivity(toolName: string, phase: 'call' | 'result'): string {
  const verb = humanizeToolName(toolName);
  if (phase === 'result') return `${verb} — done`;
  return `${verb}…`;
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

export function activityFromWsDelta(delta: Record<string, unknown>): TurnActivity | null {
  const messageType = String(delta.message_type ?? '');
  if (messageType === 'reasoning_message' || messageType === 'hidden_reasoning_message') {
    return { kind: 'reasoning', label: 'Reasoning…' };
  }
  if (messageType === 'tool_call_message') {
    const toolName = toolNameFromUnknown(delta.name)
      ?? toolNameFromUnknown(delta.tool_call)
      ?? toolNameFromUnknown(delta.tool_calls)
      ?? 'tool';
    return { kind: 'tool', label: formatToolActivity(toolName, 'call') };
  }
  if (messageType === 'tool_return_message') {
    return { kind: 'tool_result', label: 'Tool finished' };
  }
  return null;
}

export function activityFromRuntimeMessage(message: Record<string, unknown>): TurnActivity | null {
  switch (message.type) {
    case 'activity': {
      const label = String(message.label ?? '').trim();
      if (!label) return null;
      const kind = message.kind;
      return {
        kind: kind === 'reasoning' || kind === 'tool' || kind === 'tool_result' ? kind : 'thinking',
        label,
      };
    }
    case 'tool_call': {
      const toolName = String(message.toolName ?? message.name ?? 'tool');
      return { kind: 'tool', label: formatToolActivity(toolName, 'call') };
    }
    case 'tool_result':
      return { kind: 'tool_result', label: 'Tool finished' };
    case 'reasoning':
      return { kind: 'reasoning', label: 'Reasoning…' };
    case 'stream_event': {
      const event = message.event;
      if (!event || typeof event !== 'object') return null;
      const payload = event as Record<string, unknown>;
      if (payload.message_type) return activityFromWsDelta(payload);
      const delta = payload.delta;
      if (delta && typeof delta === 'object') {
        const deltaRecord = delta as Record<string, unknown>;
        if (deltaRecord.reasoning) return { kind: 'reasoning', label: 'Reasoning…' };
        if (deltaRecord.type === 'reasoning') return { kind: 'reasoning', label: 'Reasoning…' };
      }
      return null;
    }
    default:
      return null;
  }
}
