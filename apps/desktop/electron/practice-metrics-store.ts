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
    const normalizedSlug = normalizeMetricSlug(slug);
    const path = this.metricsPath(normalizedSlug);
    if (!existsSync(path)) return emptyMetrics(normalizedSlug);
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as PracticeMetricsRecord;
      return { ...emptyMetrics(normalizedSlug), ...raw, slug: normalizedSlug };
    } catch {
      return emptyMetrics(normalizedSlug);
    }
  }

  list(): PracticeMetricsRecord[] {
    if (!existsSync(this.dir)) return [];
    const records: PracticeMetricsRecord[] = [];
    for (const name of readdirSync(this.dir).filter((entry) => entry.endsWith('.json'))) {
      try {
        records.push(this.get(name.replace(/\.json$/, '')));
      } catch {
        // Ignore malformed legacy/local filenames without hiding valid metrics.
      }
    }
    return records;
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
    const slug = normalizeMetricSlug(input.slug);
    const at = input.at ?? new Date().toISOString();
    const current = this.get(slug);
    const next: PracticeMetricsRecord = {
      ...current,
      slug,
      uses: current.uses + 1,
      last_used_at: at,
      last_run_id: input.runId,
      last_receipt_id: input.receiptId,
      last_receipt_path: input.receiptPath,
      successful_runs: current.successful_runs + (input.status === 'success' ? 1 : 0),
      blocked_runs: current.blocked_runs + (input.status === 'blocked' ? 1 : 0),
    };
    writeFileSync(this.metricsPath(slug), `${JSON.stringify(next, null, 2)}\n`);
    return next;
  }

  patch(slug: string, patch: Partial<PracticeMetricsRecord>): PracticeMetricsRecord {
    mkdirSync(this.dir, { recursive: true });
    const normalizedSlug = normalizeMetricSlug(slug);
    const next = { ...this.get(normalizedSlug), ...patch, slug: normalizedSlug };
    writeFileSync(this.metricsPath(normalizedSlug), `${JSON.stringify(next, null, 2)}\n`);
    return next;
  }

  private metricsPath(slug: string): string {
    return join(this.dir, `${normalizeMetricSlug(slug)}.json`);
  }
}

function normalizeMetricSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed || /[/\\]/.test(trimmed) || trimmed === '.' || trimmed === '..') {
    throw new Error('Practice metric slug must be a single path segment');
  }
  return trimmed;
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
