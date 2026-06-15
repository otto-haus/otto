import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { defaultOttoDir } from './config-store';
import type { AutonomyStore } from './autonomy-store';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import type {
  PaperclipArtifactRow,
  PaperclipConnectResult,
  PaperclipIntakeSnapshot,
  PaperclipSyncResult,
  PaperclipTaskRow,
} from './shared/types';

export function resolvePaperclipDir(): string {
  return join(defaultOttoDir(), 'adapters', 'paperclip');
}

function paperclipPaths() {
  const dir = resolvePaperclipDir();
  return {
    dir,
    config: join(dir, 'config.json'),
    lastSync: join(dir, 'last-sync.json'),
    exportFile: join(dir, 'export.json'),
  };
}

type PaperclipConfig = {
  enabled: boolean;
  approvedAt: string | null;
  baseUrl: string | null;
};

type LastSyncPayload = {
  batchId: string;
  syncedAt: string;
  error: string | null;
  sourceUrl: string | null;
  activeTasks: PaperclipTaskRow[];
  blockedTasks: PaperclipTaskRow[];
  recentArtifacts: PaperclipArtifactRow[];
};

export class PaperclipIntakeStore {
  constructor(
    private autonomy: AutonomyStore,
    private receipts = new ReceiptWriter(),
  ) {}

  snapshot(): PaperclipIntakeSnapshot {
    const paths = paperclipPaths();
    mkdirSync(paths.dir, { recursive: true });
    const config = readConfig();
    const lastSync = readLastSync();

    if (!config?.enabled) {
      return {
        dir: paths.dir,
        connection: 'not_connected',
        enabled: false,
        lastSyncAt: null,
        lastSyncError: null,
        sourceBaseUrl: null,
        activeTasks: [],
        blockedTasks: [],
        recentArtifacts: [],
      };
    }

    if (lastSync?.error) {
      return {
        dir: paths.dir,
        connection: 'sync_error',
        enabled: true,
        lastSyncAt: lastSync.syncedAt,
        lastSyncError: lastSync.error,
        sourceBaseUrl: config.baseUrl ?? lastSync.sourceUrl,
        activeTasks: [],
        blockedTasks: [],
        recentArtifacts: [],
      };
    }

    const activeTasks = lastSync?.activeTasks ?? [];
    const blockedTasks = lastSync?.blockedTasks ?? [];
    const recentArtifacts = lastSync?.recentArtifacts ?? [];

    return {
      dir: paths.dir,
      connection: 'connected',
      enabled: true,
      lastSyncAt: lastSync?.syncedAt ?? null,
      lastSyncError: null,
      sourceBaseUrl: config.baseUrl ?? lastSync?.sourceUrl ?? null,
      activeTasks,
      blockedTasks,
      recentArtifacts,
    };
  }

  connect(input: { approved?: boolean; baseUrl?: string | null } = {}): PaperclipConnectResult {
    const gate = this.autonomy.evaluateAction({
      action: 'connect paperclip external adapter credential',
      context: 'Paperclip read-only import connector (021)',
      approved: input.approved,
    });

    if (gate.evaluation.requires_approval && !input.approved) {
      return {
        ok: false,
        needsApproval: true,
        message: gate.evaluation.reason,
        snapshot: this.snapshot(),
        receipt: gate.receipt,
      };
    }

    const approvedAt = new Date().toISOString();
    const paths = paperclipPaths();
    writeConfig({
      enabled: true,
      approvedAt,
      baseUrl: input.baseUrl?.trim() || null,
    });

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'task', id: 'paperclip' },
      action: 'paperclip.connect',
      input: {
        approved: true,
        baseUrl: input.baseUrl?.trim() || null,
        autonomy_receipt_id: gate.receipt.id,
      },
      result: {
        summary: 'Paperclip connector enabled (read-only). Sync imports work_state only — not otto Done.',
      },
      evidence: [{ kind: 'file', ref: paths.config, note: 'Connector config persisted under ~/.otto/adapters/paperclip/' }],
      blocker: null,
    });

    return {
      ok: true,
      needsApproval: false,
      snapshot: this.snapshot(),
      receipt,
    };
  }

  sync(): PaperclipSyncResult {
    const config = readConfig();
    if (!config?.enabled) {
      return {
        ok: false,
        error: 'Paperclip is not connected. Connect first.',
        snapshot: this.snapshot(),
      };
    }

    const paths = paperclipPaths();
    const exportPath = process.env.OTTO_PAPERCLIP_EXPORT?.trim() || paths.exportFile;
    let payload: LastSyncPayload;

    if (existsSync(exportPath)) {
      try {
        payload = parseImportPayload(readFileSync(exportPath, 'utf8'), exportPath);
        payload.error = null;
      } catch (error) {
        payload = {
          batchId: randomUUID(),
          syncedAt: new Date().toISOString(),
          error: String(error),
          sourceUrl: exportPath,
          activeTasks: [],
          blockedTasks: [],
          recentArtifacts: [],
        };
      }
    } else {
      payload = {
        batchId: randomUUID(),
        syncedAt: new Date().toISOString(),
        error: null,
        sourceUrl: null,
        activeTasks: [],
        blockedTasks: [],
        recentArtifacts: [],
      };
    }

    writeLastSync(payload);

    const receipt = this.receipts.write({
      status: payload.error ? 'failed' : 'success',
      subject: { type: 'task', id: 'paperclip' },
      action: 'paperclip.sync',
      input: {
        batch_id: payload.batchId,
        export_path: existsSync(exportPath) ? exportPath : null,
      },
      result: {
        summary: payload.error
          ? `Paperclip sync failed: ${payload.error}`
          : payload.activeTasks.length || payload.blockedTasks.length || payload.recentArtifacts.length
            ? `Imported ${payload.activeTasks.length} active, ${payload.blockedTasks.length} blocked, ${payload.recentArtifacts.length} artifacts.`
            : 'Sync complete — no imported rows yet (021 export not present).',
        data: {
          active: payload.activeTasks.length,
          blocked: payload.blockedTasks.length,
          artifacts: payload.recentArtifacts.length,
          paperclip_entity_ids: [
            ...payload.activeTasks.map((t) => t.id),
            ...payload.blockedTasks.map((t) => t.id),
          ],
        },
      },
      evidence: [{ kind: 'file', ref: paths.lastSync, note: 'Last sync snapshot (display-only work_state).' }],
      blocker: payload.error
        ? {
            code: 'sync_failed',
            message: payload.error,
            recoverable: true,
            next_action: 'Fix export/import source and retry sync.',
          }
        : null,
    });

    return {
      ok: !payload.error,
      error: payload.error ?? undefined,
      snapshot: this.snapshot(),
      receipt,
    };
  }
}

function readConfig(): PaperclipConfig | null {
  return readJson<PaperclipConfig>(paperclipPaths().config);
}

function writeConfig(config: PaperclipConfig): void {
  const paths = paperclipPaths();
  mkdirSync(paths.dir, { recursive: true });
  writeFileSync(paths.config, `${JSON.stringify(config, null, 2)}\n`);
}

function readLastSync(): LastSyncPayload | null {
  return readJson<LastSyncPayload>(paperclipPaths().lastSync);
}

function writeLastSync(payload: LastSyncPayload): void {
  const paths = paperclipPaths();
  mkdirSync(paths.dir, { recursive: true });
  writeFileSync(paths.lastSync, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

function parseImportPayload(raw: string, sourceUrl: string): LastSyncPayload {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const workState = (parsed.work_state ?? parsed) as Record<string, unknown>;
  const activeRaw = Array.isArray(workState.active)
    ? workState.active
    : Array.isArray(workState.activeTasks)
      ? workState.activeTasks
      : [];
  const blockedRaw = Array.isArray(workState.blocked)
    ? workState.blocked
    : Array.isArray(workState.blockedTasks)
      ? workState.blockedTasks
      : [];
  const artifactsRaw = Array.isArray(workState.artifacts)
    ? workState.artifacts
    : Array.isArray(workState.recentArtifacts)
      ? workState.recentArtifacts
      : Array.isArray(parsed.artifacts)
        ? parsed.artifacts
        : [];

  const activeTasks = activeRaw.map((row, index) => normalizeTask(row, index, false)).filter(Boolean) as PaperclipTaskRow[];
  const blockedTasks = blockedRaw.map((row, index) => normalizeTask(row, index, true)).filter(Boolean) as PaperclipTaskRow[];
  const recentArtifacts = artifactsRaw
    .map((row, index) => normalizeArtifact(row, index))
    .filter(Boolean) as PaperclipArtifactRow[];

  return {
    batchId: optionalString(parsed.batchId) ?? randomUUID(),
    syncedAt: optionalString(parsed.syncedAt) ?? new Date().toISOString(),
    error: null,
    sourceUrl: optionalString(parsed.sourceUrl) ?? sourceUrl,
    activeTasks,
    blockedTasks,
    recentArtifacts,
  };
}

function normalizeTask(raw: unknown, index: number, blocked: boolean): PaperclipTaskRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = optionalString(row.id) ?? optionalString(row.task_id) ?? `task-${index + 1}`;
  const title = optionalString(row.title) ?? optionalString(row.name) ?? id;
  const status = optionalString(row.status) ?? (blocked ? 'blocked' : 'active');
  const url = optionalString(row.url) ?? optionalString(row.href) ?? optionalString(row.link);
  if (!url) return null;
  return { id, title, status, url, blocked: blocked || row.blocked === true };
}

function normalizeArtifact(raw: unknown, index: number): PaperclipArtifactRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = optionalString(row.id) ?? optionalString(row.artifact_id) ?? `artifact-${index + 1}`;
  const label = optionalString(row.label) ?? optionalString(row.title) ?? optionalString(row.name) ?? id;
  const url = optionalString(row.url) ?? optionalString(row.href) ?? optionalString(row.link);
  if (!url) return null;
  return { id, label, url };
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export type { WrittenReceipt };
