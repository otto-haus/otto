import type { PermissionResponse, RuntimePreferences, RuntimeStatus } from '../shared/types';

export type RuntimeTransportMode = 'sdk' | 'ws' | 'auto';

export interface OttoRuntimeTransport {
  getStatus(): RuntimeStatus;
  init(opts?: { freshConversation?: boolean; strictModelHandle?: string | null }): Promise<RuntimeStatus>;
  newChat(): Promise<RuntimeStatus>;
  configure(input: RuntimePreferences): Promise<RuntimeStatus>;
  send(text: string): Promise<void>;
  abort(): Promise<void>;
  resolvePermission(requestId: string, response: PermissionResponse): void;
  close(): Promise<void>;
}
