import { describe, expect, test } from 'bun:test';
import { ShutdownCoordinator } from './shutdown-coordinator';

describe('ShutdownCoordinator', () => {
  test('safeReset aborts, closes runtime, clears permissions, and re-inits', async () => {
    const calls: string[] = [];
    const mockWin = {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        executeJavaScript: async () => ({ cleared: ['otto.chat.queue.v3'] }),
      },
    } as never;
    const coordinator = new ShutdownCoordinator({
      getWin: () => mockWin,
      runner: {
        abort: async () => { calls.push('abort'); },
        close: async () => { calls.push('close'); },
      } as never,
      cognee: {
        stop: () => { calls.push('cognee-stop'); return { status: 'stopped' } as never; },
      } as never,
      reinit: async () => {
        calls.push('reinit');
        return { ready: true };
      },
    });

    const result = await coordinator.safeReset();
    expect(result.ok).toBe(true);
    expect(result.reconnected).toBe(true);
    expect(result.clearedQueueKeys).toContain('otto.chat.queue.v3');
    expect(calls).toEqual(['abort', 'close', 'cognee-stop', 'reinit']);
  });

  test('gracefulShutdown runs shutdown steps once', async () => {
    let closeCount = 0;
    const mockWin = {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        executeJavaScript: async () => ({ cleared: [] }),
      },
    } as never;
    const coordinator = new ShutdownCoordinator({
      getWin: () => mockWin,
      runner: {
        abort: async () => {},
        close: async () => { closeCount += 1; },
      } as never,
      cognee: { stop: () => ({ status: 'stopped' } as never) } as never,
      reinit: async () => ({ ready: false }),
    });

    await coordinator.gracefulShutdown();
    await coordinator.gracefulShutdown();
    expect(closeCount).toBe(1);
  });

  test('teardownForWindowClose aborts and closes runtime without blocking later gracefulShutdown', async () => {
    const calls: string[] = [];
    const mockWin = {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        executeJavaScript: async () => ({ cleared: ['otto.chat.queue.v3'] }),
      },
    } as never;
    const coordinator = new ShutdownCoordinator({
      getWin: () => mockWin,
      runner: {
        abort: async () => { calls.push('abort'); },
        close: async () => { calls.push('close'); },
      } as never,
      cognee: {
        stop: () => { calls.push('cognee-stop'); return { status: 'stopped' } as never; },
      } as never,
      reinit: async () => ({ ready: false }),
    });

    await coordinator.teardownForWindowClose();
    await coordinator.gracefulShutdown();
    expect(calls).toEqual(['abort', 'close', 'cognee-stop', 'abort', 'close', 'cognee-stop']);
  });
});
