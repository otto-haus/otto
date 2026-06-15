import type { ConnectionInput, RuntimeStatus } from './runtime';
import type { OttoConfig } from '../electron/shared/types';

export type ConnectionMode = NonNullable<OttoConfig['connectionMode']>;

export type ConnectionReconnectFields = {
  baseUrl: string;
  agentId: string;
  primaryAgentId: string;
  connectionMode: ConnectionMode;
};

export type ConnectionReconnectApi = {
  config: { set: (patch: Partial<OttoConfig>) => Promise<OttoConfig> };
  connection: { save: (input: ConnectionInput) => Promise<RuntimeStatus> };
};

/** Persist mode/overrides before IPC reconnect so initWithStaleRecovery sees fresh config (#538). */
export async function saveConnectionAndReconnect(
  api: ConnectionReconnectApi,
  fields: ConnectionReconnectFields,
): Promise<RuntimeStatus> {
  await api.config.set({
    primaryAgentId: fields.primaryAgentId.trim() || fields.agentId.trim() || null,
    connectionMode: fields.connectionMode,
    ...(fields.connectionMode === 'embedded' ? { baseUrl: null } : {}),
  });
  const baseUrl =
    fields.connectionMode === 'embedded' ? null : fields.baseUrl.trim() || null;
  return api.connection.save({
    baseUrl,
    agentId: fields.agentId.trim() || null,
  });
}
