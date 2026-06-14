import { type BrowserWindow, ipcMain, shell } from 'electron';
import type { ConnectionInfo, ConnectionInput, CreateProposalFromCorrectionInput, DecideProposalInput, OttoConfig, PermissionResponse, ProposalClassification, ProposalTarget, RuntimePreferences } from './shared/types';
import type { CharterCreateInput, CharterStatus } from './shared/types';
import type { AttachmentInput } from './shared/types';
import { saveAttachment } from './attachments';
import { CharterStore } from './charter-store';
import { ConfigStore } from './config-store';
import { discoverLocalLettaContext, LettaRunner } from './letta-runner';
import { ReceiptStore } from './receipt-store';
import { StandardStore } from './standard-store';
import { PracticeStore } from './practice-store';
import { ProposalStore, classifyProposal } from './proposal-store';
import { RoutineStore } from './routine-store';
import { AutonomyStore } from './autonomy-store';
import { ChannelStore } from './channel-store';
import { KnowledgeStore } from './knowledge-store';
import { RunStore } from './run-store';
import { SkillStore } from './skill-store';
import { TicketOrchestrator } from './ticket-orchestrator';
import { TicketStore } from './ticket-store';
import { WorkerStore } from './worker-store';

export function registerIpc(win: BrowserWindow) {
  const config = new ConfigStore();
  const runner = new LettaRunner(win, config);
  const receipts = new ReceiptStore();
  const charters = new CharterStore();
  const standards = new StandardStore();
  const practices = new PracticeStore();
  const routines = new RoutineStore();
  const proposals = new ProposalStore(undefined, undefined, receipts);
  const knowledge = new KnowledgeStore();
  const autonomy = new AutonomyStore(undefined, undefined, knowledge);
  const skills = new SkillStore();
  const channels = new ChannelStore();
  const tickets = new TicketStore();
  const workers = new WorkerStore();
  const runs = new RunStore();
  const orchestrator = new TicketOrchestrator(tickets, workers, runs, knowledge, autonomy);

  ipcMain.handle('otto:init', () => runner.init());
  ipcMain.handle('otto:new-chat', () => runner.newChat());
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

  ipcMain.handle('otto:receipts:list', () => receipts.list());
  ipcMain.handle('otto:receipts:get', (_e, id: string) => receipts.get(id));

  ipcMain.handle('otto:charters:list', () => charters.listResult());
  ipcMain.handle('otto:charters:get', (_e, slug: string) => charters.detail(slug));
  ipcMain.handle('otto:charters:create', (_e, input: CharterCreateInput) => charters.create(input));
  ipcMain.handle('otto:charters:update-status', (_e, slug: string, status: CharterStatus, summary?: string) =>
    charters.updateStatus(slug, status, summary),
  );
  ipcMain.handle(
    'otto:charters:link-run-receipt',
    (_e, slug: string, input: { runId?: string; receiptId?: string; acId?: string; summary?: string }) =>
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
  ipcMain.handle(
    'otto:curation:proposals:classify',
    (_e, input: { target: ProposalTarget; correction: string }): ProposalClassification =>
      classifyProposal(input.target, input.correction),
  );
  ipcMain.handle('otto:curation:proposals:decide', (_e, id: string, input: DecideProposalInput) =>
    proposals.decide(id, input),
  );
  ipcMain.handle('otto:curation:approvals:list', () => proposals.listApprovals());

  ipcMain.handle('otto:knowledge:list', () => knowledge.listResult());
  ipcMain.handle('otto:knowledge:resolve-role', (_e, role: string) => knowledge.resolveModelForRole(role));

  ipcMain.handle('otto:skills:list', () => skills.listResult());
  ipcMain.handle('otto:skills:get', (_e, slug: string) => skills.get(slug));

  ipcMain.handle('otto:channels:list', () => channels.listResult());

  ipcMain.handle('otto:tickets:list', () => tickets.list());
  ipcMain.handle('otto:tickets:get', (_e, ticketId: string) => tickets.get(ticketId));
  ipcMain.handle('otto:tickets:compile', (_e, input: import('@otto-haus/core').TicketCompileInput) => tickets.compile(input));
  ipcMain.handle('otto:tickets:orchestrate', (_e, input: import('@otto-haus/core').TicketCompileInput & { repoRoot?: string }) =>
    orchestrator.orchestrate(input),
  );
  ipcMain.handle('otto:tickets:orchestrate-existing', (_e, ticketId: string, repoRoot?: string) =>
    orchestrator.orchestrateExisting(ticketId, { repoRoot }),
  );

  ipcMain.handle('otto:workers:list', () => workers.list());
  ipcMain.handle('otto:workers:update-status', (_e, id: string, status: import('@otto-haus/core').WorkerStatus, receiptId?: string) =>
    workers.updateStatus(id, status, receiptId),
  );

  ipcMain.handle('otto:runs:list', () => runs.list());

  ipcMain.handle('otto:autonomy:policy', () => autonomy.loadResult());
  ipcMain.handle('otto:autonomy:evaluate-action', (_e, input: { action: string; context?: string }) =>
    autonomy.evaluateAction(input),
  );

  ipcMain.on('otto:permission:respond', (_e, requestId: string, response: PermissionResponse) =>
    runner.resolvePermission(requestId, response),
  );
}
