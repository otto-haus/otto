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
      const raw = JSON.parse(readFileSync(this.path, 'utf8')) as LogFile;
      return raw && typeof raw === 'object' ? raw : {};
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
