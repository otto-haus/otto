import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { WorkerListResult, WorkerRecord, WorkerStatus } from '@otto-haus/core';
import { OTTO_DIR } from './config-store';

export const WORKERS_DIR = join(OTTO_DIR, 'workers');
const WORKER_STATUSES: Record<WorkerStatus, true> = {
  draft: true,
  running: true,
  blocked: true,
  review: true,
  done: true,
  failed: true,
};

export class WorkerStore {
  constructor(private dir = WORKERS_DIR) {}

  list(): WorkerListResult {
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this.dir)) return { dir: this.dir, workers: [], skipped: 0, storage: 'files' };

    let skipped = 0;
    const workers: WorkerRecord[] = [];
    for (const entry of readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const path = join(this.dir, entry.name);
      const worker = this.read(path);
      if (worker) workers.push(worker);
      else skipped += 1;
    }

    workers.sort((a, b) => timestampMs(b.updated_at) - timestampMs(a.updated_at));
    return { dir: this.dir, workers, skipped, storage: 'files' };
  }

  spawn(input: { ticket_id: string; model?: string; worktree?: string; branch?: string; summary?: string }): WorkerRecord {
    mkdirSync(this.dir, { recursive: true });
    const now = new Date().toISOString();
    const id = `worker_${now.slice(0, 10).replace(/-/g, '')}_${randomUUID().slice(0, 8)}`;
    const worker: WorkerRecord = {
      schema: 'otto.worker.v1',
      id,
      ticket_id: input.ticket_id,
      status: 'running',
      model: input.model,
      worktree: input.worktree,
      branch: input.branch,
      started_at: now,
      updated_at: now,
      receipt_ids: [],
      summary: input.summary ?? `Worker spawned for ${input.ticket_id}`,
      path: join(this.dir, `${id}.json`),
    };
    writeFileSync(worker.path, JSON.stringify(worker, null, 2), 'utf8');
    return worker;
  }

  updateStatus(id: string, status: WorkerStatus, receiptId?: string): WorkerRecord | null {
    const nextStatus = normalizeStatus(status);
    const worker = this.list().workers.find((entry) => entry.id === id);
    if (!worker) return null;
    const updated: WorkerRecord = {
      ...worker,
      status: nextStatus,
      updated_at: new Date().toISOString(),
      receipt_ids: receiptId ? [...new Set([...worker.receipt_ids, receiptId])] : worker.receipt_ids,
    };
    writeFileSync(worker.path, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  }

  private read(path: string): WorkerRecord | null {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as WorkerRecord;
      if (raw.schema !== 'otto.worker.v1') return null;
      return { ...raw, path };
    } catch {
      return null;
    }
  }
}

function timestampMs(value: string): number {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeStatus(value: unknown): WorkerStatus {
  if (typeof value === 'string' && value in WORKER_STATUSES) {
    return value as WorkerStatus;
  }
  throw new Error(`Invalid worker status: ${String(value)}`);
}
