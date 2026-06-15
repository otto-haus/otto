import { describe, expect, it } from 'bun:test';
import { saveConnectionAndReconnect, type ConnectionReconnectApi } from '../src/connection-reconnect';

describe('saveConnectionAndReconnect (#538)', () => {
  it('persists connectionMode before connection.save reconnect', async () => {
    const order: string[] = [];
    const api: ConnectionReconnectApi = {
      config: {
        set: async (patch) => {
          order.push(`config.set:${patch.connectionMode ?? ''}`);
          return {} as Awaited<ReturnType<ConnectionReconnectApi['config']['set']>>;
        },
      },
      connection: {
        save: async () => {
          order.push('connection.save');
          return { ready: true, code: 'ready' as const, cliPath: '', cliResolved: true };
        },
      },
    };

    await saveConnectionAndReconnect(api, {
      baseUrl: 'http://127.0.0.1:8283',
      agentId: 'agent-1',
      primaryAgentId: '',
      connectionMode: 'embedded',
    });

    expect(order).toEqual(['config.set:embedded', 'connection.save']);
  });

  it('clears manual baseUrl when saving embedded mode (#705)', async () => {
    let savedBaseUrl: string | null | undefined;
    const api: ConnectionReconnectApi = {
      config: {
        set: async () => ({} as Awaited<ReturnType<ConnectionReconnectApi['config']['set']>>),
      },
      connection: {
        save: async (input) => {
          savedBaseUrl = input.baseUrl;
          return { ready: true, code: 'ready' as const, cliPath: '', cliResolved: true };
        },
      },
    };

    await saveConnectionAndReconnect(api, {
      baseUrl: 'http://127.0.0.1:8283',
      agentId: 'agent-1',
      primaryAgentId: '',
      connectionMode: 'embedded',
    });

    expect(savedBaseUrl).toBeNull();
  });

  it('persists manual baseUrl for existing local mode (#705)', async () => {
    let savedBaseUrl: string | null | undefined;
    const api: ConnectionReconnectApi = {
      config: {
        set: async () => ({} as Awaited<ReturnType<ConnectionReconnectApi['config']['set']>>),
      },
      connection: {
        save: async (input) => {
          savedBaseUrl = input.baseUrl;
          return { ready: true, code: 'ready' as const, cliPath: '', cliResolved: true };
        },
      },
    };

    await saveConnectionAndReconnect(api, {
      baseUrl: 'http://127.0.0.1:8283',
      agentId: '',
      primaryAgentId: '',
      connectionMode: 'existing',
    });

    expect(savedBaseUrl).toBe('http://127.0.0.1:8283');
  });
});
