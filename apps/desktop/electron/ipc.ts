import { type BrowserWindow, ipcMain, shell } from 'electron';
import type { AttachmentInput, ConnectionInfo, ConnectionInput, OttoConfig, PermissionResponse, RuntimePreferences } from './shared/types';
import { ConfigStore } from './config-store';
import { discoverLocalLettaContext, LettaRunner } from './letta-runner';
import { saveAttachment } from './attachments';

export function registerIpc(win: BrowserWindow) {
  const config = new ConfigStore();
  const runner = new LettaRunner(win, config);

  ipcMain.handle('otto:init', () => runner.init());
  ipcMain.handle('otto:status', () => runner.getStatus());
  ipcMain.handle('otto:send', (_e, text: string) => runner.send(text));
  ipcMain.handle('otto:abort', () => runner.abort());
  ipcMain.handle('otto:configure', (_e, input: RuntimePreferences) => runner.configure(input));
  ipcMain.handle('otto:open-letta', () => shell.openPath('/Applications/Letta.app'));

  ipcMain.handle('otto:config:get', () => config.get());
  ipcMain.handle('otto:config:set', (_e, patch: Partial<OttoConfig>) => config.update(patch));
  ipcMain.handle('otto:attachment:save', (_e, input: AttachmentInput) => saveAttachment(input));

  // Connection setup. v1 is local-only: provider auth lives in Letta, not Otto.
  ipcMain.handle(
    'otto:connection:get',
    (): ConnectionInfo => {
      const context = discoverLocalLettaContext(config);
      return {
        baseUrl: context.baseUrl,
        agentId: context.agentId,
      };
    },
  );
  ipcMain.handle('otto:connection:save', (_e, input: ConnectionInput) => {
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
