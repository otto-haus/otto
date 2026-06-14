import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { CheckRunStats } from '@otto-haus/core';

type LogFile = Record<string, CheckRunStats>;

function resolveLogPath(): string {
  const home = process.env.OTTO_HOME?.trim() || join(homedir(), '.otto');
  return join(home, 'checks', 'run-log.json');
}

function emptyStats(): CheckRunStats {
  return { pass_count: 0, fail_count: 0 };
}

export class CheckRunLogStore {
  constructor(private path = resolveLogPath()) {}

  private read(): LogFile {
    if (!existsSync(this.path)) return {};
    try {
      const raw = JSON.parse(readFileSync(this.path, 'utf8')) as unknown;
      if (!isRecord(raw)) return {};
      const out: LogFile = {};
      for (const [checkId, value] of Object.entries(raw)) {
        if (isRecord(value)) out[checkId] = normalizeStats(value);
      }
      return out;
    } catch {
      return {};
    }
  }

  private write(data: LogFile): void {
    mkdirSync(join(this.path, '..'), { recursive: true });
    writeFileSync(this.path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }

  record(checkId: string, passed: boolean): CheckRunStats {
    const data = this.read();
    const prev = data[checkId] ?? emptyStats();
    const next: CheckRunStats = {
      last_run_at: new Date().toISOString(),
      last_passed: passed,
      pass_count: prev.pass_count + (passed ? 1 : 0),
      fail_count: prev.fail_count + (passed ? 0 : 1),
    };
    data[checkId] = next;
    this.write(data);
    return next;
  }

  getAll(): Record<string, CheckRunStats> {
    return this.read();
  }

  get(checkId: string): CheckRunStats | null {
    return this.read()[checkId] ?? null;
  }
}

function normalizeStats(value: Record<string, unknown>): CheckRunStats {
  return {
    last_run_at: typeof value.last_run_at === 'string' ? value.last_run_at : undefined,
    last_passed: typeof value.last_passed === 'boolean' ? value.last_passed : undefined,
    pass_count: count(value.pass_count),
    fail_count: count(value.fail_count),
  };
}

function count(value: unknown): number {
  const parsed = typeof value === 'string' && value.trim() ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
