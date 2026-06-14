import { describe, expect, test } from 'bun:test';
import type { RuntimeStatus } from '../shared/types';
import { RuntimeSupervisor } from './runtime-supervisor';

function status(ready: boolean, reason?: string): RuntimeStatus {
  return {
    ready,
    reason,
    cliPath: '/tmp/letta',
    cliResolved: true,
    transportMode: ready ? 'ws' : 'ws',
    effectiveTransport: ready ? 'websocket local' : 'sdk subprocess',
  };
}

describe('RuntimeSupervisor auto fallback', () => {
  test('falls back to SDK with visible reason when WS init fails', async () => {
    const wsInit = async () => status(false, 'WebSocket transport unavailable');
    const sdkInit = async () => status(true);

    const supervisor = new RuntimeSupervisor({} as never, {} as never);
    (supervisor as unknown as { mode: string }).mode = 'auto';
    (supervisor as unknown as { ws: { init: typeof wsInit; close: () => Promise<void>; getStatus: () => RuntimeStatus } }).ws = {
      init: wsInit,
      close: async () => {},
      getStatus: () => status(false, 'WebSocket transport unavailable'),
    };
    (supervisor as unknown as { sdk: { init: typeof sdkInit; close: () => Promise<void>; getStatus: () => RuntimeStatus } }).sdk = {
      init: sdkInit,
      close: async () => {},
      getStatus: () => status(true),
    };

    const prev = process.env.OTTO_WS_PROMOTION_APPROVED;
    process.env.OTTO_WS_PROMOTION_APPROVED = '1';
    const result = await supervisor.init();
    if (prev === undefined) delete process.env.OTTO_WS_PROMOTION_APPROVED;
    else process.env.OTTO_WS_PROMOTION_APPROVED = prev;

    expect(result.ready).toBe(true);
    expect(result.transportMode).toBe('auto');
    expect(result.effectiveTransport).toBe('sdk subprocess');
    expect(result.transportFallbackReason).toContain('WebSocket');
  });

  test('auto keeps WS when init succeeds', async () => {
    const wsInit = async () => status(true);
    const sdkInit = async () => status(true);

    const supervisor = new RuntimeSupervisor({} as never, {} as never);
    (supervisor as unknown as { mode: string }).mode = 'auto';
    (supervisor as unknown as { ws: { init: typeof wsInit; close: () => Promise<void> } }).ws = {
      init: wsInit,
      close: async () => {},
      getStatus: () => status(true),
    };
    (supervisor as unknown as { sdk: { init: typeof sdkInit; close: () => Promise<void> } }).sdk = {
      init: sdkInit,
      close: async () => {},
      getStatus: () => status(true),
    };

    const prev = process.env.OTTO_WS_PROMOTION_APPROVED;
    process.env.OTTO_WS_PROMOTION_APPROVED = '1';
    const result = await supervisor.init();
    if (prev === undefined) delete process.env.OTTO_WS_PROMOTION_APPROVED;
    else process.env.OTTO_WS_PROMOTION_APPROVED = prev;

    expect(result.ready).toBe(true);
    expect(result.effectiveTransport).toBe('websocket local');
    expect(result.transportFallbackReason).toBeNull();
  });
});

describe('promotion gate defaults', () => {
  test('default transport mode remains sdk until scorecard passes', async () => {
    const { resolveTransportMode } = await import('./transport-mode');
    const original = process.env.OTTO_RUNTIME_TRANSPORT;
    delete process.env.OTTO_RUNTIME_TRANSPORT;
    expect(resolveTransportMode()).toBe('sdk');
    if (original === undefined) delete process.env.OTTO_RUNTIME_TRANSPORT;
    else process.env.OTTO_RUNTIME_TRANSPORT = original;
  });

  test('auto skips WS when promotion gate is closed', async () => {
    const sdkInit = async () => status(true);
    const wsInit = async () => {
      throw new Error('WS should not be attempted when promotion gate is closed');
    };

    const supervisor = new RuntimeSupervisor({} as never, {} as never);
    (supervisor as unknown as { mode: string }).mode = 'auto';
    (supervisor as unknown as { ws: { init: typeof wsInit; close: () => Promise<void> } }).ws = {
      init: wsInit,
      close: async () => {},
      getStatus: () => status(false),
    };
    (supervisor as unknown as { sdk: { init: typeof sdkInit; close: () => Promise<void> } }).sdk = {
      init: sdkInit,
      close: async () => {},
      getStatus: () => status(true),
    };

    const prev = process.env.OTTO_WS_PROMOTION_APPROVED;
    process.env.OTTO_WS_PROMOTION_APPROVED = '0';
    const result = await supervisor.init();
    if (prev === undefined) delete process.env.OTTO_WS_PROMOTION_APPROVED;
    else process.env.OTTO_WS_PROMOTION_APPROVED = prev;

    expect(result.ready).toBe(true);
    expect(result.effectiveTransport).toBe('sdk subprocess');
    expect(result.transportFallbackReason).toContain('promotion scorecard');
  });
});
