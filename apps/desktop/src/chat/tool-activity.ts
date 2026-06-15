export type ToolActivityStatus = 'running' | 'done' | 'error';

export type ToolActivity = {
  toolCallId: string;
  toolName: string;
  toolInput?: Record<string, unknown>;
  status: ToolActivityStatus;
  output?: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
};

export function summarizeToolInput(toolName: string, input: Record<string, unknown> = {}): string {
  const normalized = toolName.toLowerCase();
  if (normalized.includes('bash') || normalized === 'run_shell' || normalized === 'shell') {
    const cmd = input.command ?? input.cmd ?? input.script;
    if (typeof cmd === 'string' && cmd.trim()) {
      return cmd.length > 80 ? `${cmd.slice(0, 77)}…` : cmd;
    }
  }
  const keys = Object.keys(input);
  if (keys.length === 1) {
    const value = input[keys[0]!];
    if (typeof value === 'string' && value.trim()) {
      return value.length > 80 ? `${value.slice(0, 77)}…` : value;
    }
  }
  if (!keys.length) return '';
  return `${keys.slice(0, 2).join(', ')}${keys.length > 2 ? '…' : ''}`;
}

export function formatToolSummary(
  toolName: string,
  toolInput: Record<string, unknown> | undefined,
  status: ToolActivityStatus,
): string {
  const verb = status === 'running' ? 'Running' : status === 'error' ? 'Failed' : 'Ran';
  const detail = summarizeToolInput(toolName, toolInput ?? {});
  const label = formatToolLabel(toolName);
  return detail ? `${verb} ${label}(${detail})` : `${verb} ${label}`;
}

export function formatToolLabel(toolName: string): string {
  if (toolName.toLowerCase() === 'run_shell') return 'Bash';
  return toolName;
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function formatMessageTime(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function mergeToolResult(
  messages: Array<{ toolActivity?: ToolActivity | null }>,
  toolCallId: string,
  content: string,
  isError: boolean,
  endedAt: string,
): boolean {
  let idx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const activity = messages[i]?.toolActivity;
    if (activity?.toolCallId === toolCallId && activity.status === 'running') {
      idx = i;
      break;
    }
  }
  if (idx < 0) return false;
  const msg = messages[idx]!;
  const activity = msg.toolActivity!;
  const durationMs = Math.max(0, Date.parse(endedAt) - Date.parse(activity.startedAt));
  msg.toolActivity = {
    ...activity,
    status: isError ? 'error' : 'done',
    output: content,
    endedAt,
    durationMs,
  };
  return true;
}
