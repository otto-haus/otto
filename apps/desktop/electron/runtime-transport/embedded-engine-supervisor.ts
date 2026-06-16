/** Bounded restart policy for otto-owned embedded Letta engine lifecycle (#673). */

export type EmbeddedEngineSupervisorSnapshot = {
  cliPath: string | null;
  /** SDK subprocess pid when exposed; null when unavailable from letta-code-sdk. */
  enginePid: number | null;
  restartCount: number;
  maxRestarts: number;
  lastRestartAt: string | null;
  lastFailureReason: string | null;
  exhausted: boolean;
};

export function embeddedEngineMaxRestarts(): number {
  const raw = process.env.OTTO_EMBEDDED_MAX_RESTARTS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 3;
}

/** Errors that may clear with a fresh SDK subprocess spawn in embedded mode. */
export function isEmbeddedEngineRecoverableError(reason: string): boolean {
  const lower = reason.toLowerCase();
  return (
    lower.includes('econnrefused') ||
    lower.includes('socket hang up') ||
    lower.includes('process exited') ||
    lower.includes('child process') ||
    lower.includes('spawn') ||
    lower.includes('timed out') ||
    lower.includes('transport closed')
  );
}

export class EmbeddedEngineSupervisor {
  private restartCount = 0;
  private lastRestartAt: string | null = null;
  private lastFailureReason: string | null = null;
  private enginePid: number | null = null;

  constructor(private readonly maxRestarts = embeddedEngineMaxRestarts()) {}

  reset(): void {
    this.restartCount = 0;
    this.lastRestartAt = null;
    this.lastFailureReason = null;
  }

  recordRestart(reason: string): void {
    this.restartCount += 1;
    this.lastFailureReason = reason;
    this.lastRestartAt = new Date().toISOString();
  }

  canRestart(): boolean {
    return this.restartCount < this.maxRestarts;
  }

  get exhausted(): boolean {
    return this.restartCount >= this.maxRestarts;
  }

  setEnginePid(pid: number | null): void {
    this.enginePid = pid;
  }

  snapshot(cliPath: string | null): EmbeddedEngineSupervisorSnapshot {
    return {
      cliPath,
      enginePid: this.enginePid,
      restartCount: this.restartCount,
      maxRestarts: this.maxRestarts,
      lastRestartAt: this.lastRestartAt,
      lastFailureReason: this.lastFailureReason,
      exhausted: this.exhausted,
    };
  }
}
