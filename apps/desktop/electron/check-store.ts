import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';
import type { Check, CheckListResult } from '@otto-haus/core';
import { validateCheck } from '@otto-haus/core';

export function resolveChecksDir(): string {
  const home = process.env.OTTO_HOME?.trim() || join(homedir(), '.otto');
  return process.env.OTTO_CHECKS_DIR?.trim() || join(home, 'checks');
}

export function resolveSeedChecksDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.OTTO_CHECKS_SEED_DIR?.trim() || null,
    process.env.OTTO_ROOT ? join(process.env.OTTO_ROOT, 'checks') : null,
    resourcesPath ? join(resourcesPath, 'checks') : null,
    resolve(process.cwd(), 'checks'),
    resolve(process.cwd(), '../../checks'),
  ].filter((value): value is string => !!value);
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0] ?? resolve(process.cwd(), 'checks');
}

export class CheckStore {
  constructor(private dir = resolveChecksDir()) {}

  ensureSeeded(): void {
    mkdirSync(this.dir, { recursive: true });
    const seedDir = resolveSeedChecksDir();
    if (!existsSync(seedDir)) return;
    for (const file of readdirSync(seedDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))) {
      const target = join(this.dir, file);
      if (existsSync(target)) continue;
      writeFileSync(target, readFileSync(join(seedDir, file), 'utf8'), 'utf8');
    }
  }

  listResult(): CheckListResult {
    this.ensureSeeded();
    const checks: Check[] = [];
    const skipped: CheckListResult['skipped'] = [];
    if (!existsSync(this.dir)) {
      return { dir: this.dir, checks, skipped };
    }
    for (const file of readdirSync(this.dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))) {
      const path = join(this.dir, file);
      try {
        const parsed = parse(readFileSync(path, 'utf8'));
        const result = validateCheck(parsed);
        if (!result.ok) {
          skipped.push({ id: file, file: path, reason: result.issues.map((i) => i.message).join('; ') });
          continue;
        }
        if (result.check.active !== false) checks.push(result.check);
      } catch (error) {
        skipped.push({ id: file, file: path, reason: String(error) });
      }
    }
    checks.sort((a, b) => a.id.localeCompare(b.id));
    return { dir: this.dir, checks, skipped };
  }

  get(id: string): Check | null {
    return this.listResult().checks.find((c) => c.id === id) ?? null;
  }

  save(check: Check): Check {
    mkdirSync(this.dir, { recursive: true });
    const path = checkFilePath(this.dir, check.id);
    writeFileSync(path, stringify(check), 'utf8');
    return check;
  }
}

function checkFilePath(dir: string, id: string): string {
  if (!id.trim() || id.includes('/') || id.includes('\\')) {
    throw new Error(`Invalid check id: ${id}`);
  }
  return join(dir, `${id}.yaml`);
}
