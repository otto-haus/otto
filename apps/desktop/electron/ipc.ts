import { type BrowserWindow, app, clipboard, ipcMain, shell } from 'electron';
import type { ConnectionInfo, ConnectionInput, CreateProposalFromCorrectionInput, DecideProposalInput, DreamSettings, LabsConfig, MemoryListResult, OttoConfig, PermissionRequest, PermissionResponse, ProposalClassification, ProposalTarget, RuntimePreferences, RuntimeStatus } from './shared/types';
import { applyLabsConfigPatch, assertConnectionModePatchAllowed, getLabsConfig, labsConfigToOttoPatch } from './labs-config';
import {
  applyDreamSettingsPatch,
  dreamSettingsToOttoPatch,
  resolveEffectiveDreamSettings,
  resolveLettaSettingsPath,
  syncDreamSettingsToLetta,
} from './dream-settings';
import type { CharterCreateInput, CharterStatus } from './shared/types';
import type { AttachmentInput } from './shared/types';
import { saveAttachment } from './attachments';
import { CharterStore } from './charter-store';
import { ConfigStore } from './config-store';
import { LettaRunner } from './letta-runner';
import { resolveLiveLocalLettaContext } from './runtime-transport/letta-discovery';
import { listLocalLettaModels } from './runtime-transport/letta-discovery';
import { ReceiptStore } from './receipt-store';
import { StandardStore } from './standard-store';
import { PracticeStore } from './practice-store';
import { PracticeRunner } from './practice-runner';
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
import { WorkerRunner } from './worker-runner';
import { ReceiptWriter } from './receipt-writer';
import { CheckRunner } from './check-runner';
import { ThreadStore } from './thread-store';
import { permissionSessionStore } from './permission-session-store';
import { permissionLogStore } from './permission-log-store';
import { readWorkspaceContext } from './workspace-context';
import { BehaviorChangelog } from './behavior-changelog';
import { ConstitutionStore, CONSTITUTION_MD, CONSTITUTION_YAML } from './constitution-store';
import { CultureExporter } from './culture-export';
import { DiagnosticsExporter } from './diagnostics-export';
import { OTTO_DIR } from './config-store';
import { buildProviderMirror } from './provider-mirror';
import { setSecret, hasSecret } from './secret-store';
import { CogneeStore } from './cognee-store';
import { PaperclipIntakeStore } from './paperclip-intake-store';
import { MemoryStore } from './memory-store';
import { PgvectorStore } from './pgvector-store';
import { safeWebContentsSend, smokeMode } from './runtime-transport/runtime-common';
import { getMainWindow } from './main-window';
import { readAppBuildInfo } from './build-info';
import { showOttoDebugMenu } from './debug-menu';
import { buildDebugPacket, formatDebugPacketText, formatRuntimeStatusText } from './debug-packet';
import { resolveDebugEnvelope } from './debug-envelope';
import { openOttoLogs } from './logs';
import { syncWindowBackground } from './display-theme';
import { openSystemTerminal, resolveWorkspaceRoot } from './open-terminal';
import { getWorkspaceInfo, resolveWorkspaceRepoRoot } from './workspace-root';
import { collectSystemHealth } from './system-health';
import { IsolatedAgentStore } from './isolated-agent-store';
import type { IsolationBoundaryReason } from './isolated-agent';

let ipcRegistered = false;

export function registerIpc() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  const config = new ConfigStore();
  const runner = new LettaRunner(getMainWindow, config);
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
  const practiceRunner = new PracticeRunner(practices, runs, new ReceiptWriter(), undefined, autonomy);
  const orchestrator = new TicketOrchestrator(tickets, workers, runs, knowledge, autonomy);
  const checkRunner = new CheckRunner();
  const threads = new ThreadStore(config);
  const constitution = new ConstitutionStore(CONSTITUTION_YAML, CONSTITUTION_MD);
  const changelog = new BehaviorChangelog(proposals, receipts, constitution);
  const cultureExporter = new CultureExporter();
  const diagnosticsExporter = new DiagnosticsExporter();
  const cognee = new CogneeStore(config);
  const paperclipIntake = new PaperclipIntakeStore(autonomy);
  const memory = new MemoryStore(config);
  const pgvector = new PgvectorStore();
  const isolatedAgents = new IsolatedAgentStore(config);

  const bindStatusToActiveThread = (status: RuntimeStatus) => {
    if (!status.ready) return;
    threads.touchActive({
      agentId: status.agentId ?? null,
      lettaConversationId: status.conversationId ?? null,
    });
  };

  const initWithStaleRecovery = async (opts?: { freshConversation?: boolean }): Promise<RuntimeStatus> => {
    const status = await runner.init(opts);
    if (status.ready || status.code !== 'stale' || !config.get().conversationId) {
      bindStatusToActiveThread(status);
      return status;
    }
    config.update({ conversationId: null });
    threads.touchActive({ lettaConversationId: null });
    const recovered = await runner.init({ freshConversation: true });
    bindStatusToActiveThread(recovered);
    return recovered;
  };

  ipcMain.handle('otto:init', async () => {
    threads.ensureActiveThread(config.agentId());
    return initWithStaleRecovery();
  });
  ipcMain.handle('otto:new-chat', async () => {
    permissionSessionStore.clear();
    permissionLogStore.clear();
    threads.create();
    return initWithStaleRecovery({ freshConversation: true });
  });
  ipcMain.handle('otto:status', () => runner.getStatus());
  ipcMain.handle('otto:app:build-info', () => readAppBuildInfo());
  ipcMain.handle('otto:system:health', () =>
    collectSystemHealth({
      win: getMainWindow(),
      runner,
      config,
      memory,
      autonomy,
      routines,
      workers,
      runs,
    }),
  );
  ipcMain.handle('otto:workspace:context', () => readWorkspaceContext(config, threads, runner.getStatus()));
  ipcMain.handle('otto:permission:state', () => {
    const status = runner.getStatus();
    return {
      mode: 'default' as const,
      route: status.effectiveTransport ?? status.transportMode ?? 'unknown',
      sessionAllowed: permissionSessionStore.list(),
      recent: permissionLogStore.recent(),
    };
  });
  ipcMain.handle('otto:send', (_e, text: string) => runner.send(text));
  ipcMain.handle('otto:abort', () => runner.abort());
  ipcMain.handle('otto:configure', async (_e, input: RuntimePreferences) => {
    const status = await runner.configure(input);
    bindStatusToActiveThread(status);
    return status;
  });
  ipcMain.handle('otto:models:list', () => listLocalLettaModels(config));
  ipcMain.handle('otto:open-letta', () => shell.openPath('/Applications/Letta.app'));
  ipcMain.handle('otto:workspace:get', () => getWorkspaceInfo());
  ipcMain.handle('otto:workspace:reveal', () => {
    const path = resolveWorkspaceRepoRoot();
    shell.showItemInFolder(path);
    return path;
  });
  ipcMain.handle('otto:permission-session:list', () => permissionSessionStore.list());
  ipcMain.handle('otto:permission-session:clear', () => {
    permissionSessionStore.clear();
    return { ok: true as const };
  });
  ipcMain.handle('otto:terminal:workspace-root', () => resolveWorkspaceRoot());
  ipcMain.handle('otto:terminal:open', () => openSystemTerminal());

  ipcMain.handle('otto:config:get', () => config.get());
  ipcMain.handle('otto:config:set', (_e, patch: Partial<OttoConfig>) => {
    assertConnectionModePatchAllowed(config.get(), patch);
    const next = config.update(patch);
    const win = getMainWindow();
    if ('theme' in patch && win) syncWindowBackground(win, next.theme);
    return next;
  });
  ipcMain.handle('otto:labs:get', () => getLabsConfig(config.get()));
  ipcMain.handle('otto:labs:set', (_e, patch: Partial<LabsConfig>) => {
    const next = applyLabsConfigPatch(config.get(), patch);
    config.update(labsConfigToOttoPatch(next));
    return next;
  });
  ipcMain.handle('otto:dreaming:get', () => {
    const settingsPath = resolveLettaSettingsPath(config, config.connectionMode());
    const agentId = config.agentId();
    return resolveEffectiveDreamSettings(config.get(), agentId, settingsPath);
  });
  ipcMain.handle('otto:dreaming:set', (_e, patch: Partial<DreamSettings>) => {
    const next = applyDreamSettingsPatch(config.get(), patch);
    config.update(dreamSettingsToOttoPatch(next));
    const settingsPath = resolveLettaSettingsPath(config, config.connectionMode());
    syncDreamSettingsToLetta(config.agentId(), next, settingsPath);
    return next;
  });
  ipcMain.handle('otto:attachment:save', (_e, input: AttachmentInput) => saveAttachment(input));

  // Connection setup. v1 is local-only: provider auth lives in Letta, not Otto.
  ipcMain.handle(
    'otto:connection:get',
    async (): Promise<ConnectionInfo> => {
      const context = await resolveLiveLocalLettaContext(config);
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
    if (input.agentId !== undefined) config.ensurePrimaryAgentId(input.agentId);
    return initWithStaleRecovery(); // reconnect and return fresh status
  });

  ipcMain.handle('otto:isolated-agents:list', () => isolatedAgents.list());
  ipcMain.handle(
    'otto:isolated-agents:create',
    async (_e, input: { boundaryReason: IsolationBoundaryReason; label?: string | null }) =>
      isolatedAgents.create(input),
  );

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
  ipcMain.handle('otto:standards:conflict-for-standard', (_e, slug: string) => standards.conflictForStandard(slug));

  ipcMain.handle('otto:changelog:list', (_e, windowDays?: number) => changelog.list(windowDays ?? 7));

  ipcMain.handle('otto:constitution:get', () => constitution.load());
  ipcMain.handle('otto:constitution:amend', (_e, yamlDraft: string, amendedBy: string) =>
    constitution.amend(yamlDraft, amendedBy),
  );
  ipcMain.handle('otto:constitution:open', () => shell.openPath(constitution.load().yamlPath));

  ipcMain.handle('otto:culture:export', () => cultureExporter.exportBundle());
  ipcMain.handle('otto:culture:import-preview', (_e, bundlePath: string) => cultureExporter.previewImport(bundlePath));

  ipcMain.handle('otto:diagnostics:export', async () => {
    const buildInfo = readAppBuildInfo();
    const runtimeStatus = runner.getStatus();
    const [memoryHealth, cogneeHealth, pgvectorStatus] = await Promise.all([
      memory.listBlocks(),
      Promise.resolve(cognee.health()),
      Promise.resolve(pgvector.status()),
    ]);
    const diagWin = getMainWindow();
    const windowSnapshot = diagWin
      ? {
          visible: diagWin.isVisible(),
          minimized: diagWin.isMinimized(),
          maximized: diagWin.isMaximized(),
          bounds: (() => {
            const b = diagWin.getBounds();
            return { width: b.width, height: b.height };
          })(),
        }
      : null;
    return diagnosticsExporter.exportBundle({
      buildInfo: {
        ...buildInfo,
        appPath: buildInfo.appPath ?? app.getAppPath(),
        profilePath: buildInfo.profilePath ?? app.getPath('userData'),
        homePath: buildInfo.homePath ?? app.getPath('home'),
      },
      runtimeStatus,
      config: config.get(),
      userDataPath: app.getPath('userData'),
      ottoDir: OTTO_DIR,
      permissionSession: permissionSessionStore.list(),
      transport: runner.getDiagnosticsSnapshot(),
      threads: threads.list(true),
      memory: memoryHealth,
      routines: routines.listResult(),
      cognee: cogneeHealth,
      pgvector: pgvectorStatus,
      window: windowSnapshot,
    });
  });
  ipcMain.handle('otto:diagnostics:reveal', (_e, bundlePath: string) => {
    shell.showItemInFolder(bundlePath);
    return { ok: true };
  });

  const debugDeps = () => ({
    win: getMainWindow(),
    runtimeStatus: runner.getStatus(),
    config: config.get(),
  });

  ipcMain.handle('otto:debug:show-menu', (_e, surface?: string) => {
    const deps = debugDeps();
    const win = deps.win;
    if (!win) return { ok: false as const, reason: 'no-window' };
    showOttoDebugMenu({ ...deps, win }, typeof surface === 'string' ? surface : undefined);
    return { ok: true as const };
  });
  ipcMain.handle('otto:debug:packet', () => buildDebugPacket({
    runtimeStatus: runner.getStatus(),
    config: config.get(),
    envelope: resolveDebugEnvelope(),
  }));
  ipcMain.handle('otto:debug:copy-runtime-status', () => {
    const deps = debugDeps();
    clipboard.writeText(formatRuntimeStatusText(deps.runtimeStatus, deps.config));
    return { ok: true as const };
  });
  ipcMain.handle('otto:debug:copy-packet', () => {
    const deps = debugDeps();
    const packet = buildDebugPacket({
      runtimeStatus: deps.runtimeStatus,
      config: deps.config,
      envelope: resolveDebugEnvelope(),
    });
    clipboard.writeText(formatDebugPacketText(packet));
    return { ok: true as const };
  });
  ipcMain.handle('otto:debug:show-logs', async () => {
    const target = await openOttoLogs();
    return { ok: true as const, path: target };
  });
  ipcMain.handle('otto:debug:open-profile', () => {
    const path = app.getPath('userData');
    void shell.openPath(path);
    return { ok: true as const, path };
  });
  ipcMain.handle('otto:debug:open-devtools', () => {
    getMainWindow()?.webContents.openDevTools({ mode: 'detach' });
    return { ok: true as const };
  });

  ipcMain.handle('otto:practices:list', () => practices.listResult());
  ipcMain.handle('otto:practices:get', (_e, slug: string) => practices.get(slug));
  ipcMain.handle('otto:practices:resolve-for-text', (_e, text: string) => practices.resolveForText(text));
  ipcMain.handle('otto:practices:metrics', (_e, slug: string) => practiceRunner.metricsFor(slug));
  ipcMain.handle('otto:practices:run', (_e, input: import('./practice-runner').PracticeRunInput) => practiceRunner.run(input));

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

  ipcMain.handle('otto:memory:list', () => {
    const runtimeStatus = runner.getStatus();
    if (!runtimeStatus.ready) {
      return {
        agentId: null,
        baseUrl: null,
        blocks: [],
        apiPath: '/v1/agents/{agent_id}/core-memory/blocks',
        error: runtimeStatus.reason ?? 'Runtime not ready — finish setup in Settings.',
      } satisfies MemoryListResult;
    }
    return memory.listBlocks();
  });
  ipcMain.handle('otto:cognee:health', () => cognee.health());
  ipcMain.handle('otto:cognee:settings:get', () => cognee.settings());
  ipcMain.handle('otto:cognee:settings:set', (_e, patch: { enabled?: boolean; baseUrl?: string }) => {
    cognee.saveSettings(patch);
    return cognee.health();
  });
  ipcMain.handle('otto:cognee:start', () => cognee.start());
  ipcMain.handle('otto:cognee:stop', () => cognee.stop());
  ipcMain.handle('otto:cognee:latest-capture', () => cognee.latestCapture());
  ipcMain.handle('otto:cognee:capture-dry-run', () => cognee.captureDryRun());
  ipcMain.handle('otto:cognee:capture-apply', () => cognee.captureApply());
  ipcMain.handle('otto:cognee:recall-smoke', (_e, query?: string) => cognee.recallSmoke(query));
  ipcMain.handle('otto:pgvector:status', () => pgvector.status());

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
  ipcMain.handle(
    'otto:tickets:update-status',
    (_e, ticketId: string, patch: Parameters<TicketStore['updateStatus']>[1]) => tickets.updateStatus(ticketId, patch),
  );
  ipcMain.handle('otto:adapters:paperclip:snapshot', () => paperclipIntake.snapshot());
  ipcMain.handle(
    'otto:adapters:paperclip:connect',
    (_e, input?: { approved?: boolean; baseUrl?: string | null }) => paperclipIntake.connect(input ?? {}),
  );
  ipcMain.handle('otto:adapters:paperclip:sync', () => paperclipIntake.sync());

  ipcMain.handle('otto:workers:list', () => workers.list());
  ipcMain.handle('otto:workers:update-status', (_e, id: string, status: import('@otto-haus/core').WorkerStatus, receiptId?: string) =>
    workers.updateStatus(id, status, receiptId),
  );
  ipcMain.handle(
    'otto:workers:run-bounded',
    (_e, workerId: string, opts?: { maxTurns?: number }) =>
      new WorkerRunner(workers, tickets, runs, autonomy, new ReceiptWriter()).runBounded(workerId, opts ?? {}),
  );

  ipcMain.handle('otto:runs:list', () => runs.list());

  ipcMain.handle('otto:autonomy:policy', () => autonomy.loadResult());
  ipcMain.handle('otto:autonomy:evaluate-action', (_e, input: { action: string; context?: string }) =>
    autonomy.evaluateAction(input),
  );

  ipcMain.handle('otto:checks:list', () => checkRunner.list());
  ipcMain.handle('otto:checks:get', (_e, id: string) => checkRunner.get(id));
  ipcMain.handle('otto:checks:evaluate-done-claim', (_e, context: Parameters<CheckRunner['evaluateDoneClaim']>[0]) =>
    checkRunner.evaluateDoneClaim(context),
  );
  ipcMain.handle('otto:checks:evaluate-one-way-door', (_e, context: Parameters<CheckRunner['evaluateOneWayDoor']>[0]) =>
    checkRunner.evaluateOneWayDoor(context),
  );

  ipcMain.handle('otto:provider:mirror', () => {
    const status = runner.getStatus();
    return buildProviderMirror(config, status.ready);
  });
  ipcMain.handle('otto:provider:set-api-key', (_e, value: string) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    setSecret('LETTA_API_KEY', trimmed || null);
    return { ok: true, hasApiKey: hasSecret('LETTA_API_KEY') };
  });

  ipcMain.handle('otto:threads:list', (_e, includeArchived?: boolean) => threads.list(!!includeArchived));
  ipcMain.handle('otto:threads:create', async (_e, input?: { title?: string; agentId?: string | null }) => {
    permissionSessionStore.clear();
    const thread = threads.create(input);
    const status = await initWithStaleRecovery({ freshConversation: true });
    const updatedThread = threads.touchActive({
      agentId: status.agentId ?? thread.agentId,
      lettaConversationId: status.conversationId ?? null,
    }) ?? thread;
    const win = getMainWindow();
    if (win) safeWebContentsSend(win, 'otto:threads:active', { threadId: thread.id, status });
    return { thread: updatedThread, status };
  });
  ipcMain.handle('otto:threads:switch', async (_e, threadId: string) => {
    permissionSessionStore.clear();
    const thread = threads.switch(threadId);
    const status = await initWithStaleRecovery();
    const updatedThread = threads.touchActive({
      agentId: status.agentId ?? thread.agentId,
      lettaConversationId: status.conversationId ?? thread.lettaConversationId,
    }) ?? thread;
    const win = getMainWindow();
    if (win) safeWebContentsSend(win, 'otto:threads:active', { threadId: thread.id, status });
    return { thread: updatedThread, status };
  });
  ipcMain.handle('otto:threads:archive', async (_e, threadId: string) => {
    permissionSessionStore.clear();
    const archived = threads.archive(threadId);
    const activeThreadId = config.get().activeThreadId ?? null;
    if (activeThreadId && activeThreadId !== threadId) {
      const status = await initWithStaleRecovery();
      const win = getMainWindow();
      if (win) safeWebContentsSend(win, 'otto:threads:active', { threadId: activeThreadId, status });
    }
    return archived;
  });
  ipcMain.handle('otto:threads:unarchive', (_e, threadId: string) => threads.unarchive(threadId));
  ipcMain.handle('otto:threads:rename', (_e, threadId: string, title: string) => threads.rename(threadId, title));
  ipcMain.handle('otto:threads:pin', (_e, threadId: string, pinned: boolean) => threads.pin(threadId, pinned));
  ipcMain.handle('otto:threads:move', (_e, threadId: string, targetId: string) => threads.move(threadId, targetId));
  ipcMain.handle(
    'otto:threads:touch',
    (_e, input: { title?: string; lettaConversationId?: string | null; agentId?: string | null }) =>
      threads.touchActive(input),
  );

  ipcMain.on('otto:permission:respond', (_e, requestId: string, response: PermissionResponse) =>
    runner.resolvePermission(requestId, response),
  );
  ipcMain.handle(
    'otto:permission:deny-receipt',
    (_e, input: { requestId: string; toolName: string; message: string }) => {
      const writer = new ReceiptWriter();
      const receipt = writer.write({
        status: 'blocked',
        subject: { type: 'autonomy', id: input.toolName },
        action: 'autonomy.permission.deny',
        input: {
          requestId: input.requestId,
          toolName: input.toolName,
          message: input.message,
        },
        result: {
          summary: `Tool permission denied: ${input.toolName}`,
          data: { authority: 'human (permission gate)' },
        },
        evidence: [],
        blocker: {
          code: 'permission-denied',
          message: input.message,
          recoverable: true,
          next_action: 'Correct this moment or allow the tool if appropriate.',
        },
      });
      return { id: receipt.id, path: receipt.path };
    },
  );

  ipcMain.handle(
    'otto:smoke:trigger-permission',
    (_e, input?: { toolName?: string; requestId?: string; interactive?: boolean }) => {
      if (!smokeMode()) {
        throw new Error('otto:smoke:trigger-permission requires OTTO_SMOKE=1');
      }
      const requestId = input?.requestId ?? `smoke-perm-${Date.now()}`;
      const req: PermissionRequest = {
        requestId,
        toolName: input?.toolName ?? 'smoke.read_file',
        toolInput: {
          path: '/tmp/otto-smoke-permission-proof.txt',
          note: 'Staging smoke — read-only permission modal capture (no tool execution).',
        },
        interactive: input?.interactive ?? false,
      };
      permissionLogStore.recordPending(req);
      const win = getMainWindow();
      if (win) safeWebContentsSend(win, 'otto:permission', req);
      return { ok: true, requestId, toolName: req.toolName };
    },
  );
}
