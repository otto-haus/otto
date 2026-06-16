import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { DiagnosticsExportManifest, DiagnosticsExportResult } from '@otto-haus/core';
import type { CogneeHealth, MemoryListResult, OttoConfig, PgvectorStatus, RuntimeStatus, ThreadListResult } from './shared/types';
import type { RoutineListResult } from './routine-store';
import { OTTO_DIR } from './config-store';
import { ReceiptStore } from './receipt-store';
import { ReceiptWriter } from './receipt-writer';
import { runsDir } from './trace-writer';
import { resolveWindowLaunchMode } from './window-launch';
import type { AppBuildInfo } from './shared/types';
import { zipDirectory } from './zip-directory';

const SECRET_PATTERN = /\b(api[_-]?key|secret|token|password|bearer)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/gi;

export type TransportDiagnosticsSnapshot = {
  activeTransport: 'sdk' | 'ws';
  sdk: {
    pendingPermissionCount: number;
    sessionInitialized: boolean;
    aborted: boolean;
  };
  ws: {
    pendingPermissionCount: number;
    wsConnected: boolean | null;
    wsReadyState: number | null;
    listenerPort: number | null;
    activeRunId: string | null;
    turnIdle: boolean;
    lastReconnectAt: string | null;
    aborted: boolean;
  };
};

export type WindowDiagnosticsSnapshot = {
  visible: boolean;
  minimized: boolean;
  maximized: boolean;
  bounds: { width: number; height: number } | null;
};

export type DiagnosticsExportInput = {
  buildInfo: AppBuildInfo;
  runtimeStatus: RuntimeStatus;
  config: OttoConfig;
  userDataPath: string;
  ottoDir: string;
  permissionSession: string[];
  transport: TransportDiagnosticsSnapshot;
  threads: ThreadListResult;
  memory: MemoryListResult;
  routines: RoutineListResult;
  cognee: CogneeHealth;
  pgvector: PgvectorStatus;
  /** Live BrowserWindow flags (main process); omitted in tests/headless. */
  window?: WindowDiagnosticsSnapshot | null;
};

export function redactDiagnosticsText(text: string): string {
  return text
    .replace(SECRET_PATTERN, '[REDACTED_SECRET]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');
}

function redactConfig(config: OttoConfig): Record<string, unknown> {
  return {
    activeThreadId: config.activeThreadId ?? null,
    agentId: config.agentId ?? null,
    baseUrl: config.baseUrl ?? null,
    connectionMode: config.connectionMode ?? null,
    conversationId: config.conversationId ? '[present]' : null,
    modelHandle: config.modelHandle ?? null,
    effort: config.effort ?? null,
    primaryAgentId: config.primaryAgentId ?? null,
    theme: config.theme ?? null,
    labs: config.labs ?? null,
  };
}

/** Non-secret window launch + env context for triaging blank/background-launch failures (#684, #689). */
function windowDiagnostics(input: DiagnosticsExportInput): Record<string, unknown> {
  return {
    launchMode: resolveWindowLaunchMode(),
    ottoWindowMode: process.env.OTTO_WINDOW_MODE ?? null,
    ottoSmoke: process.env.OTTO_SMOKE ?? null,
    visible: input.window?.visible ?? null,
    minimized: input.window?.minimized ?? null,
    maximized: input.window?.maximized ?? null,
    bounds: input.window?.bounds ?? null,
  };
}

/** Resolved Letta discovery inputs so fresh-staging discovery failures are triagable from the bundle alone (#609). */
function lettaDiscoveryDiagnostics(input: DiagnosticsExportInput): Record<string, unknown> {
  return {
    discoverySource: input.runtimeStatus.discoverySource ?? null,
    baseUrl: input.runtimeStatus.baseUrl ?? input.config.baseUrl ?? null,
    lettaSettingsPathEnv: process.env.OTTO_LETTA_SETTINGS_PATH ?? null,
  };
}

function tailFile(path: string, maxLines = 120): string | null {
  if (!existsSync(path)) return null;
  try {
    const lines = readFileSync(path, 'utf8').split('\n');
    return redactDiagnosticsText(lines.slice(-maxLines).join('\n'));
  } catch {
    return null;
  }
}

function latestRunTraceTail(maxLines = 80): { path: string | null; tail: string | null } {
  const dir = runsDir();
  if (!existsSync(dir)) return { path: null, tail: null };
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.jsonl'))
    .map((name) => ({ name, mtime: statSync(join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  const latest = files[0];
  if (!latest) return { path: null, tail: null };
  const path = join(dir, latest.name);
  return { path, tail: tailFile(path, maxLines) };
}

export type RuntimeLogEntry = {
  id: string;
  label: string;
  path: string;
  tail: string | null;
};

export type RuntimeLogsSummary = {
  logsFolder: string;
  runsFolder: string;
  entries: RuntimeLogEntry[];
};

const ELECTRON_LOG_CANDIDATES = (userDataPath: string) => [
  { id: 'main', label: 'Electron main', path: join(userDataPath, 'logs', 'main.log') },
  { id: 'main-alt', label: 'Electron main (alt)', path: join(userDataPath, 'Logs', 'main.log') },
  { id: 'renderer', label: 'Electron renderer', path: join(userDataPath, 'logs', 'renderer.log') },
];

export function resolveLogsFolder(userDataPath: string): string {
  const candidates = [join(userDataPath, 'logs'), join(userDataPath, 'Logs'), userDataPath];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return userDataPath;
}

function collectLogTails(userDataPath: string): Array<{ label: string; path: string; tail: string }> {
  const out: Array<{ label: string; path: string; tail: string }> = [];
  for (const candidate of ELECTRON_LOG_CANDIDATES(userDataPath)) {
    const tail = tailFile(candidate.path);
    if (tail) out.push({ label: basename(candidate.path), path: candidate.path, tail });
  }
  return out;
}

export function buildRuntimeLogsSummary(userDataPath: string, maxLines = 80): RuntimeLogsSummary {
  const entries: RuntimeLogEntry[] = [];
  for (const candidate of ELECTRON_LOG_CANDIDATES(userDataPath)) {
    entries.push({
      id: candidate.id,
      label: candidate.label,
      path: candidate.path,
      tail: tailFile(candidate.path, maxLines),
    });
  }
  const trace = latestRunTraceTail(maxLines);
  entries.push({
    id: 'latest-trace',
    label: 'Latest SDK/runtime trace',
    path: trace.path ?? join(runsDir(), '(none yet)'),
    tail: trace.tail,
  });
  return {
    logsFolder: resolveLogsFolder(userDataPath),
    runsFolder: runsDir(),
    entries,
  };
}

export class DiagnosticsExporter {
  constructor(
    private ottoDir = OTTO_DIR,
    private receipts = new ReceiptStore(),
    private receiptWriter = new ReceiptWriter(),
  ) {}

  async exportBundle(input: DiagnosticsExportInput): Promise<DiagnosticsExportResult> {
    mkdirSync(this.ottoDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const bundleName = `otto-diagnostics-${stamp}`;
    const stagingDir = join(this.ottoDir, 'exports', bundleName);
    mkdirSync(stagingDir, { recursive: true });

    const includes: string[] = [];
    const writeJson = (name: string, data: unknown) => {
      writeFileSync(join(stagingDir, name), `${JSON.stringify(data, null, 2)}\n`);
      includes.push(name);
    };

    const receiptList = this.receipts.list().receipts.slice(0, 20);
    const errorReceipts = receiptList.filter((r) => r.status === 'blocked' || r.status === 'failed');
    const trace = latestRunTraceTail();
    const logTails = collectLogTails(input.userDataPath);

    const memoryHealth = {
      agentId: input.memory.agentId,
      baseUrl: input.memory.baseUrl,
      apiPath: input.memory.apiPath,
      blockCount: input.memory.blocks.length,
      blocks: input.memory.blocks.map((b) => ({
        id: b.id,
        label: b.label,
        valueLength: b.value.length,
        limit: b.limit,
        updated_at: b.updated_at,
      })),
      error: input.memory.error ?? null,
    };

    const schedulerState = input.routines.routines.map((routine) => ({
      slug: routine.slug,
      name: routine.name,
      status: routine.status,
      scheduled: !!routine.schedule,
      schedule: routine.schedule ?? null,
      requires_approval_to_activate: routine.requires_approval_to_activate === true,
    }));

    const threadSummary = {
      activeThreadId: input.config.activeThreadId ?? null,
      count: input.threads.threads.length,
      threads: input.threads.threads.map((t) => ({
        id: t.id,
        pinned: t.pinned,
        archived: t.archived,
        updatedAt: t.updatedAt,
        agentId: t.agentId ?? null,
        lettaConversationId: t.lettaConversationId ? '[present]' : null,
      })),
    };

    const snapshot = {
      build: input.buildInfo,
      paths: {
        appPath: input.buildInfo.appPath,
        profilePath: input.buildInfo.profilePath,
        homePath: input.buildInfo.homePath,
        userDataPath: input.userDataPath,
        ottoDir: input.ottoDir,
        receiptsDir: this.receipts.list().dir,
        runsDir: runsDir(),
      },
      runtime: input.runtimeStatus,
      config: redactConfig(input.config),
      window: windowDiagnostics(input),
      lettaDiscovery: lettaDiscoveryDiagnostics(input),
      websocketSession: {
        transportMode: input.runtimeStatus.transportMode ?? null,
        effectiveTransport: input.runtimeStatus.effectiveTransport ?? null,
        transportFallbackReason: input.runtimeStatus.transportFallbackReason ?? null,
        modelFallbackReason: input.runtimeStatus.modelFallbackReason ?? null,
        lastReconnectAt: input.runtimeStatus.lastReconnectAt ?? null,
        wsListenerPort: input.runtimeStatus.wsListenerPort ?? null,
        transport: input.transport,
      },
      queue: {
        pendingPermissions:
          input.transport.activeTransport === 'ws'
            ? input.transport.ws.pendingPermissionCount
            : input.transport.sdk.pendingPermissionCount,
        activeRunId: input.transport.ws.activeRunId,
        turnIdle: input.transport.ws.turnIdle,
      },
      permissionRoute: {
        sessionAllowlist: input.permissionSession,
        pendingPermissionCount:
          input.transport.sdk.pendingPermissionCount + input.transport.ws.pendingPermissionCount,
      },
      memoryHealth,
      schedulerState,
      threads: threadSummary,
      cognee: input.cognee,
      pgvector: input.pgvector,
      latestErrors: errorReceipts.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        status: r.status,
        action: r.action,
        summary: r.summary,
      })),
      recentReceipts: receiptList.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        status: r.status,
        action: r.action,
        summary: r.summary,
      })),
      recentTracePath: trace.path,
      logTails: logTails.map((entry) => ({ label: entry.label, path: entry.path })),
    };

    writeJson('snapshot.json', snapshot);

    if (trace.tail) {
      writeFileSync(join(stagingDir, 'latest-trace.tail.txt'), `${trace.tail}\n`);
      includes.push('latest-trace.tail.txt');
    }

    for (const entry of logTails) {
      const fileName = `log-${entry.label}.tail.txt`;
      writeFileSync(join(stagingDir, fileName), `${entry.tail}\n`);
      includes.push(fileName);
    }

    writeFileSync(
      join(stagingDir, 'README.txt'),
      [
        'otto diagnostics bundle',
        '',
        'Attach this folder or zip to a GitHub issue/PR.',
        'Secrets and message content are redacted by default.',
        'Primary file: snapshot.json',
        '',
        `Exported: ${new Date().toISOString()}`,
      ].join('\n'),
    );
    includes.push('README.txt');

    const manifest: DiagnosticsExportManifest = {
      schema: 'otto.diagnostics-export.v1',
      exported_at: new Date().toISOString(),
      workspace: input.ottoDir,
      includes,
      redacted: [
        'api keys and bearer tokens',
        'memory block values',
        'thread titles',
        'chat transcripts',
        'conversation ids (presence only)',
      ],
    };
    writeFileSync(join(stagingDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    includes.push('manifest.json');

    this.assertNoSecretsInDir(stagingDir);

    const zipPath = `${stagingDir}.zip`;
    await zipDirectory(stagingDir, zipPath);
    const bundlePath = zipPath;

    const receipt = this.receiptWriter.write({
      status: 'success',
      subject: { type: 'autonomy', id: 'diagnostics-export' },
      action: 'diagnostics.export',
      input: { bundle: basename(bundlePath) },
      result: {
        summary: 'Diagnostics bundle exported (redacted)',
        data: { bundlePath, manifest },
      },
      evidence: [{ kind: 'file', ref: bundlePath }],
      blocker: null,
    });

    return { bundlePath, manifest, receipt };
  }

  private assertNoSecretsInDir(dir: string): void {
    for (const entry of walk(dir)) {
      if (!entry.endsWith('.json') && !entry.endsWith('.txt')) continue;
      const text = readFileSync(entry, 'utf8');
      if (SECRET_PATTERN.test(text)) {
        throw new Error(`Possible secret in diagnostics bundle file: ${basename(entry)}`);
      }
    }
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}
