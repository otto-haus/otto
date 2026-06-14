import { type BrowserWindow, ipcMain } from 'electron';
import type { OttoConfig, PermissionResponse } from './shared/types';
import { ConfigStore } from './config-store';
import { LettaRunner } from './letta-runner';
import { CurationEngine } from '@otto-haus/practices';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function registerIpc(win: BrowserWindow) {
  const config = new ConfigStore();
  const runner = new LettaRunner(win, config);
  let repoRoot = process.env.OTTO_ROOT ?? process.cwd();
  if (!existsSync(join(repoRoot, 'practices')) && existsSync(join(repoRoot, '..', 'practices'))) {
    repoRoot = join(repoRoot, '..');
  } else if (!existsSync(join(repoRoot, 'practices')) && existsSync(join(repoRoot, '..', '..', 'practices'))) {
    repoRoot = join(repoRoot, '..', '..');
  }
  const curation = new CurationEngine({ rootPath: repoRoot });


  ipcMain.handle('otto:init', () => runner.init());
  ipcMain.handle('otto:status', () => runner.getStatus());
  ipcMain.handle('otto:send', (_e, text: string) => runner.send(text));
  ipcMain.handle('otto:abort', () => runner.abort());

  ipcMain.handle('otto:config:get', () => config.get());
  ipcMain.handle('otto:config:set', (_e, patch: Partial<OttoConfig>) => config.update(patch));

  ipcMain.on('otto:permission:respond', (_e, requestId: string, response: PermissionResponse) =>
    runner.resolvePermission(requestId, response),
  );

  ipcMain.handle('otto:curation:list', () => curation.listProposals());
  ipcMain.handle('otto:curation:propose', (_e, payload) => curation.propose(payload));
  ipcMain.handle('otto:curation:ratify', (_e, id, decision) => curation.ratify(id, decision));
  ipcMain.handle('otto:curation:apply', (_e, id) => curation.apply(id));
}

