import { type BrowserWindow, ipcMain } from 'electron';
import type { ConnectionInfo, ConnectionInput, OttoConfig, PermissionResponse } from './shared/types';
import { ConfigStore } from './config-store';
import { LettaRunner } from './letta-runner';
import { hasSecret, setSecret } from './secret-store';

export function registerIpc(win: BrowserWindow) {
  const config = new ConfigStore();
  const runner = new LettaRunner(win, config);

  ipcMain.handle('otto:init', () => runner.init());
  ipcMain.handle('otto:status', () => runner.getStatus());
  ipcMain.handle('otto:send', (_e, text: string) => runner.send(text));
  ipcMain.handle('otto:abort', () => runner.abort());

  ipcMain.handle('otto:config:get', () => config.get());
  ipcMain.handle('otto:config:set', (_e, patch: Partial<OttoConfig>) => config.update(patch));

  // Connection setup. The API key value never crosses back to the renderer — only whether one is set.
  ipcMain.handle(
    'otto:connection:get',
    (): ConnectionInfo => ({
      baseUrl: config.baseUrl(),
      agentId: config.agentId(),
      hasApiKey: hasSecret('LETTA_API_KEY') || !!process.env.LETTA_API_KEY,
    }),
  );
  ipcMain.handle('otto:connection:save', (_e, input: ConnectionInput) => {
    if (input.apiKey !== undefined) setSecret('LETTA_API_KEY', input.apiKey ?? null);
    const patch: Partial<OttoConfig> = {};
    if (input.baseUrl !== undefined) patch.baseUrl = input.baseUrl || null;
    if (input.agentId !== undefined) patch.agentId = input.agentId || null;
    if (Object.keys(patch).length) config.update(patch);
    return runner.init(); // reconnect and return fresh status
  });

  ipcMain.on('otto:permission:respond', (_e, requestId: string, response: PermissionResponse) =>
    runner.resolvePermission(requestId, response),
  );
}
