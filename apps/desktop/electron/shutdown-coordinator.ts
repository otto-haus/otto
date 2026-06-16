import type { BrowserWindow } from 'electron';
import type { LettaRunner } from './letta-runner';
import type { CogneeStore } from './cognee-store';
import { permissionSessionStore } from './permission-session-store';
import { SHUTDOWN_TIMEOUT_MS, clearDirtyShutdownWarning } from './shutdown-lifecycle';

const QUEUE_CLEAR_SCRIPT = `(() => {
  const keys = [
    'otto.chat.queue.v3',
    'otto.chat.queue.v2',
    'otto.chat.queue.v1',
    'otto.chat.inflight.v1',
  ];
  for (const key of keys) localStorage.removeItem(key);
  return { cleared: keys };
})()`;

export type SafeResetResult = {
  ok: true;
  clearedQueueKeys: string[];
  reconnected: boolean;
  reason: string;
};

export type ShutdownCoordinatorDeps = {
  getWin: () => BrowserWindow | null;
  runner: LettaRunner;
  cognee: CogneeStore;
  reinit: () => Promise<{ ready: boolean }>;
};

export class ShutdownCoordinator {
  private shuttingDown = false;

  constructor(private readonly deps: ShutdownCoordinatorDeps) {}

  async gracefulShutdown(reason = 'app-quit'): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    const work = this.runShutdownSteps(reason);
    await Promise.race([
      work,
      new Promise<void>((resolve) => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS)),
    ]);
  }

  /** macOS close-window: tear down runtime without marking app shutdown (dock reopen re-inits). */
  async teardownForWindowClose(): Promise<void> {
    await this.teardownRuntime();
    await this.clearRendererQueue().catch(() => []);
  }

  async safeReset(): Promise<SafeResetResult> {
    await this.teardownRuntime();

    const clearedQueueKeys = await this.clearRendererQueue();
    clearDirtyShutdownWarning();
    const status = await this.deps.reinit();
    return {
      ok: true,
      clearedQueueKeys,
      reconnected: status.ready,
      reason: status.ready
        ? 'Runtime stopped, queue cleared, and session reconnected.'
        : 'Runtime stopped and queue cleared. Reconnect from Settings if Chat stays offline.',
    };
  }

  private async runShutdownSteps(reason: string): Promise<void> {
    void reason;
    await this.teardownForWindowClose();
  }

  private async teardownRuntime(): Promise<void> {
    await this.deps.runner.abort().catch(() => {});
    await this.deps.runner.close().catch(() => {});
    permissionSessionStore.clear();
    this.deps.cognee.stop();
  }

  private async clearRendererQueue(): Promise<string[]> {
    const win = this.deps.getWin();
    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return [];
    try {
      const raw = await win.webContents.executeJavaScript(QUEUE_CLEAR_SCRIPT, true);
      if (raw && typeof raw === 'object' && Array.isArray((raw as { cleared?: unknown }).cleared)) {
        return (raw as { cleared: string[] }).cleared;
      }
    } catch {
      // renderer may be blank during crash recovery
    }
    return [];
  }
}
