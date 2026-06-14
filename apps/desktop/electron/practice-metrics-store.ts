import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PracticeMetrics } from '@otto-haus/core';
import { OTTO_DIR } from './config-store';

export const PRACTICE_METRICS_DIR = join(OTTO_DIR, 'practice-metrics');

export type PracticeMetricsRecord = PracticeMetrics & {
  slug: string;
  last_run_id?: string;
  last_receipt_id?: string;
  last_receipt_path?: string;
};

export class PracticeMetricsStore {
  constructor(private dir = PRACTICE_METRICS_DIR) {}

  get(slug: string): PracticeMetricsRecord {
    const path = join(this.dir, `${slug}.json`);
    if (!existsSync(path)) return emptyMetrics(slug);
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as PracticeMetricsRecord;
      return { ...emptyMetrics(slug), ...raw, slug };
    } catch {
      return emptyMetrics(slug);
    }
  }

  list(): PracticeMetricsRecord[] {
    if (!existsSync(this.dir)) return [];
    return readdirSync(this.dir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => this.get(name.replace(/\.json$/, '')));
  }

  recordRun(input: {
    slug: string;
    runId: string;
    receiptId: string;
    receiptPath: string;
    status: 'success' | 'blocked' | 'failed';
    at?: string;
  }): PracticeMetricsRecord {
    mkdirSync(this.dir, { recursive: true });
    const at = input.at ?? new Date().toISOString();
    const current = this.get(input.slug);
    const next: PracticeMetricsRecord = {
      ...current,
      slug: input.slug,
      uses: current.uses + 1,
      last_used_at: at,
      last_run_id: input.runId,
      last_receipt_id: input.receiptId,
      last_receipt_path: input.receiptPath,
      successful_runs: current.successful_runs + (input.status === 'success' ? 1 : 0),
      blocked_runs: current.blocked_runs + (input.status === 'blocked' ? 1 : 0),
    };
    writeFileSync(join(this.dir, `${input.slug}.json`), `${JSON.stringify(next, null, 2)}\n`);
    return next;
  }

  patch(slug: string, patch: Partial<PracticeMetricsRecord>): PracticeMetricsRecord {
    mkdirSync(this.dir, { recursive: true });
    const next = { ...this.get(slug), ...patch, slug };
    writeFileSync(join(this.dir, `${slug}.json`), `${JSON.stringify(next, null, 2)}\n`);
    return next;
  }
}

function emptyMetrics(slug: string): PracticeMetricsRecord {
  return {
    slug,
    uses: 0,
    last_used_at: null,
    successful_runs: 0,
    blocked_runs: 0,
    user_edits_required: 0,
    premature_done_prevented: 0,
    avg_time_to_artifact_ms: null,
    notes: [],
  };
}
