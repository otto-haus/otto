export { discoverLocalLettaContext } from './runtime-transport/letta-discovery';
export { RuntimeSupervisor } from './runtime-transport/runtime-supervisor';
export { resolveTransportMode } from './runtime-transport/transport-mode';

import type { BrowserWindow } from 'electron';
import type { PermissionResponse, RuntimePreferences, RuntimeStatus } from './shared/types';
import type { ConfigStore } from './config-store';
import { RuntimeSupervisor } from './runtime-transport/runtime-supervisor';

/** Electron main runtime facade — delegates to RuntimeSupervisor (SDK or WS transport). */
export class LettaRunner {
  private supervisor: RuntimeSupervisor;

  constructor(win: BrowserWindow, config: ConfigStore) {
    this.supervisor = new RuntimeSupervisor(win, config);
  }

  getStatus(): RuntimeStatus {
    return this.supervisor.getStatus();
  }

  resolvePermission(requestId: string, response: PermissionResponse) {
    this.supervisor.resolvePermission(requestId, response);
  }

  init(opts?: { freshConversation?: boolean }): Promise<RuntimeStatus> {
    return this.supervisor.init(opts);
  }

  newChat(): Promise<RuntimeStatus> {
    return this.supervisor.newChat();
  }

  configure(input: RuntimePreferences): Promise<RuntimeStatus> {
    return this.supervisor.configure(input);
  }

  send(text: string): Promise<void> {
    return this.supervisor.send(text);
  }

  steer(text: string): Promise<void> {
    return this.supervisor.steer(text);
  }

  abort(): Promise<void> {
    return this.supervisor.abort();
  }
}
