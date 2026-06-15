import type { PermissionDecisionKind, PermissionLogEntry, PermissionRequest } from './shared/types';

const RISK_PATTERNS: Array<{ risk: PermissionLogEntry['risk']; pattern: RegExp }> = [
  { risk: 'high', pattern: /(delete|destroy|send|publish|deploy|merge|push|spend|wire|credential|secret)/i },
  { risk: 'medium', pattern: /(write|edit|install|migrate|exec|run|bash|shell)/i },
];

export function permissionRiskForTool(toolName: string): PermissionLogEntry['risk'] {
  for (const { risk, pattern } of RISK_PATTERNS) {
    if (pattern.test(toolName)) return risk;
  }
  return 'low';
}

/** In-memory permission audit trail for the Permission window (#316). */
export class PermissionLogStore {
  private entries: PermissionLogEntry[] = [];
  private readonly max = 40;

  recordPending(req: PermissionRequest): PermissionLogEntry {
    const entry: PermissionLogEntry = {
      id: `perm-${req.requestId}`,
      at: new Date().toISOString(),
      requestId: req.requestId,
      toolName: req.toolName,
      status: 'pending',
      risk: permissionRiskForTool(req.toolName),
    };
    this.push(entry);
    return entry;
  }

  recordDecision(
    requestId: string,
    toolName: string,
    decision: PermissionDecisionKind,
    opts?: { message?: string; receiptId?: string },
  ): PermissionLogEntry {
    const existing = this.entries.find((e) => e.requestId === requestId && e.status === 'pending');
    const entry: PermissionLogEntry = {
      id: existing?.id ?? `perm-${requestId}`,
      at: new Date().toISOString(),
      requestId,
      toolName,
      status: decision,
      message: opts?.message,
      receiptId: opts?.receiptId,
      risk: permissionRiskForTool(toolName),
    };
    if (existing) {
      this.entries = this.entries.map((e) => (e.id === existing.id ? entry : e));
    } else {
      this.push(entry);
    }
    return entry;
  }

  recent(): PermissionLogEntry[] {
    return [...this.entries].reverse();
  }

  clear(): void {
    this.entries = [];
  }

  private push(entry: PermissionLogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.max) {
      this.entries = this.entries.slice(-this.max);
    }
  }
}

export const permissionLogStore = new PermissionLogStore();
