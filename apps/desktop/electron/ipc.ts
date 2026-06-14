import { type BrowserWindow, ipcMain, shell } from 'electron';
import type { ConnectionInfo, ConnectionInput, CreateProposalFromCorrectionInput, DecideProposalInput, OttoConfig, PermissionResponse, RuntimePreferences } from './shared/types';
import type { CharterCreateInput, CharterStatus } from './shared/types';
import { CharterStore } from './charter-store';
import { ConfigStore } from './config-store';
import { LettaRunner } from './letta-runner';
import { ReceiptStore } from './receipt-store';
import { StandardStore } from './standard-store';
import { PracticeStore } from './practice-store';
import { ProposalStore } from './proposal-store';
import { RoutineStore } from './routine-store';
import { AutonomyStore } from './autonomy-store';

export function registerIpc(win: BrowserWindow) {
  const config = new ConfigStore();
  const runner = new LettaRunner(win, config);
  const receipts = new ReceiptStore();
  const charters = new CharterStore();
  const standards = new StandardStore();
  const practices = new PracticeStore();
  const routines = new RoutineStore();
  const proposals = new ProposalStore();
  const autonomy = new AutonomyStore();

  ipcMain.handle('otto:init', () => runner.init());
  ipcMain.handle('otto:status', () => runner.getStatus());
  ipcMain.handle('otto:send', (_e, text: string) => runner.send(text));
  ipcMain.handle('otto:abort', () => runner.abort());
  ipcMain.handle('otto:configure', (_e, input: RuntimePreferences) => runner.configure(input));
  ipcMain.handle('otto:open-letta', () => shell.openPath('/Applications/Letta.app'));

  ipcMain.handle('otto:config:get', () => config.get());
  ipcMain.handle('otto:config:set', (_e, patch: Partial<OttoConfig>) => config.update(patch));

  // Connection setup. v1 is local-only: provider auth lives in Letta, not Otto.
  ipcMain.handle(
    'otto:connection:get',
    (): ConnectionInfo => ({
      baseUrl: config.baseUrl(),
      agentId: config.agentId(),
    }),
  );
  ipcMain.handle('otto:connection:save', (_e, input: ConnectionInput) => {
    const patch: Partial<OttoConfig> = {};
    if (input.baseUrl !== undefined) patch.baseUrl = input.baseUrl || null;
    if (input.agentId !== undefined) patch.agentId = input.agentId || null;
    if (Object.keys(patch).length) config.update(patch);
    return runner.init(); // reconnect and return fresh status
  });

  ipcMain.handle('otto:receipts:list', () => receipts.list());
  ipcMain.handle('otto:receipts:get', (_e, id: string) => receipts.get(id));

  ipcMain.handle('otto:charters:list', () => charters.listResult());
  ipcMain.handle('otto:charters:get', (_e, slug: string) => charters.detail(slug));
  ipcMain.handle('otto:charters:create', (_e, input: CharterCreateInput) => charters.create(input));
  ipcMain.handle('otto:charters:update-status', (_e, slug: string, status: CharterStatus, summary?: string) =>
    charters.updateStatus(slug, status, summary),
  );
  ipcMain.handle('otto:charters:link-run-receipt', (_e, slug: string, input: { runId?: string; receiptId?: string; summary?: string }) =>
    charters.linkRunReceipt(slug, input),
  );

  ipcMain.handle('otto:standards:list', () => standards.listResult());
  ipcMain.handle('otto:standards:get', (_e, slug: string) => standards.get(slug));
  ipcMain.handle('otto:standards:citations-for-text', (_e, text: string) => standards.citationsForText(text));

  ipcMain.handle('otto:practices:list', () => practices.listResult());
  ipcMain.handle('otto:practices:get', (_e, slug: string) => practices.get(slug));
  ipcMain.handle('otto:practices:resolve-for-text', (_e, text: string) => practices.resolveForText(text));

  ipcMain.handle('otto:routines:list', () => routines.listResult());
  ipcMain.handle('otto:routines:get', (_e, slug: string) => routines.get(slug));
  ipcMain.handle('otto:routines:activation-gate', (_e, slug: string) => routines.activationGate(slug));
  ipcMain.handle('otto:routines:run-manual', (_e, slug: string) => routines.runManual(slug));

  ipcMain.handle('otto:curation:proposals:list', () => proposals.list());
  ipcMain.handle('otto:curation:proposals:get', (_e, id: string) => proposals.get(id));
  ipcMain.handle('otto:curation:proposals:create-from-correction', (_e, input: CreateProposalFromCorrectionInput) =>
    proposals.createFromCorrection(input),
  );
  ipcMain.handle('otto:curation:proposals:decide', (_e, id: string, input: DecideProposalInput) =>
    proposals.decide(id, input),
  );

  ipcMain.handle('otto:autonomy:policy', () => autonomy.loadResult());
  ipcMain.handle('otto:autonomy:evaluate-action', (_e, input: { action: string; context?: string }) =>
    autonomy.evaluateAction(input),
  );

  ipcMain.on('otto:permission:respond', (_e, requestId: string, response: PermissionResponse) =>
    runner.resolvePermission(requestId, response),
  );
}
