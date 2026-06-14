import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { RunListResult, RunStatus, RunSummary } from '@otto-haus/core';
import { OTTO_DIR } from './config-store';

export const RUNS_DIR = join(OTTO_DIR, 'runs');

export interface RecordRunInput {
  id?: string;
  practice: string;
  charter?: string;
  routine?: string;
  status?: RunStatus;
  summary?: string;
  worker_id?: string;
  ticket_id?: string;
}

export class RunStore {
  constructor(private dir = RUNS_DIR) {}

  record(input: RecordRunInput): RunSummary {
    mkdirSync(this.dir, { recursive: true });
    const now = new Date().toISOString();
    const id = input.id ?? `run_${now.slice(0, 10).replace(/-/g, '')}_${randomUUID().slice(0, 8)}`;
    const filenameId = safeFilenameId(id);
    const run: RunSummary = {
      id,
      practice: input.practice,
      charter: input.charter,
      routine: input.routine,
      status: input.status ?? 'running',
      started_at: now,
      ended_at: null,
      summary: input.summary,
      receipt_count: 0,
      path: join(this.dir, `${filenameId}.json`),
    };
    writeFileSync(run.path, JSON.stringify({ ...run, worker_id: input.worker_id, ticket_id: input.ticket_id }, null, 2), 'utf8');
    return run;
  }

  list(): RunListResult {
    if (!existsSync(this.dir)) return { dir: this.dir, runs: [], skipped: 0, storage: 'files' };

    let skipped = 0;
    const runs: RunSummary[] = [];
    for (const entry of readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const path = join(this.dir, entry.name);
      const run = this.read(path);
      if (run) runs.push(run);
      else skipped += 1;
    }

    runs.sort((a, b) => timestampMs(b.started_at) - timestampMs(a.started_at));
    return { dir: this.dir, runs, skipped, storage: 'files' };
  }

  private read(path: string): RunSummary | null {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
      const id = String(raw.id ?? '');
      const practice = String(raw.practice ?? 'unknown');
      const normalizedStatus = status(raw.status);
      if (!id) return null;
      if (!normalizedStatus) return null;
      return {
        id,
        practice,
        charter: optionalString(raw.charter),
        routine: optionalString(raw.routine),
        status: normalizedStatus,
        started_at: String(raw.started_at ?? new Date().toISOString()),
        ended_at: raw.ended_at ? String(raw.ended_at) : null,
        summary: optionalString(raw.summary),
        receipt_count: Array.isArray(raw.receipts) ? raw.receipts.length : Number(raw.receipt_count ?? 0),
        path,
      };
    } catch {
      return null;
    }
  }
}

function status(value: unknown): RunStatus | null {
  if (value === 'running' || value === 'blocked' || value === 'success' || value === 'aborted' || value === 'failed') {
    return value;
  }
  if (value === 'completed') return 'success';
  return null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function safeFilenameId(value: string): string {
  const safe = value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  if (safe && safe === value) return safe;
  const prefix = safe || 'run';
  const digest = createHash('sha256').update(value).digest('hex').slice(0, 10);
  return `${prefix}-${digest}`;
}

function timestampMs(value: string): number {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}
