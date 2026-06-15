import type { RuntimeSendPayload } from '../../src/attachment-message';
import type { PermissionResponse, RuntimePreferences, RuntimeStatus } from '../shared/types';

export type RuntimeTransportMode = 'sdk' | 'ws' | 'auto';

export interface SdkTransportDiagnosticsSnapshot {
  pendingPermissionCount: number;
  sessionInitialized: boolean;
  aborted: boolean;
}

export interface WsTransportDiagnosticsSnapshot {
  pendingPermissionCount: number;
  wsConnected: boolean | null;
  wsReadyState: number | null;
  listenerPort: number | null;
  activeRunId: string | null;
  turnIdle: boolean;
  lastReconnectAt: string | null;
  aborted: boolean;
}

export interface OttoRuntimeTransport {
  getStatus(): RuntimeStatus;
  init(opts?: { freshConversation?: boolean }): Promise<RuntimeStatus>;
  newChat(): Promise<RuntimeStatus>;
  configure(input: RuntimePreferences): Promise<RuntimeStatus>;
  send(input: RuntimeSendPayload | string): Promise<void>;
  abort(): Promise<void>;
  resolvePermission(requestId: string, response: PermissionResponse): void;
  close(): Promise<void>;
}
