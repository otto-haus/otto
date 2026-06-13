import { type BrowserWindow, ipcMain } from 'electron';
import type { OttoConfig, PermissionResponse } from './shared/types';
import { ConfigStore } from './config-store';
import { LettaRunner } from './letta-runner';

export function registerIpc(win: BrowserWindow) {
  const config = new ConfigStore();
  const runner = new LettaRunner(win, config);

  ipcMain.handle('otto:init', () => runner.init());
  ipcMain.handle('otto:status', () => runner.getStatus());
  ipcMain.handle('otto:send', (_e, text: string) => runner.send(text));
  ipcMain.handle('otto:abort', () => runner.abort());

  ipcMain.handle('otto:config:get', () => config.get());
  ipcMain.handle('otto:config:set', (_e, patch: Partial<OttoConfig>) => config.update(patch));

  ipcMain.on('otto:permission:respond', (_e, requestId: string, response: PermissionResponse) =>
    runner.resolvePermission(requestId, response),
  );
}
