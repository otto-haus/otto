import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { CogneeCaptureReceipt, CogneeHealth } from '@otto-haus/core';
import type { ConfigStore } from './config-store';
import type { CogneeSettings } from './shared/types';

const LOOPBACK = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i;
const DEFAULT_BASE_URL = 'http://127.0.0.1:8000';

export function isLoopbackUrl(url: string): boolean {
  return LOOPBACK.test(url.trim());
}

export function resolveCogneeBaseUrl(config?: ConfigStore): string {
  const env = process.env.OTTO_COGNEE_BASE_URL?.trim();
  if (env) return env;
  const fromConfig = config?.get().cognee?.baseUrl?.trim();
  if (fromConfig) return fromConfig;
  return DEFAULT_BASE_URL;
}

export function cogneeEnabled(config?: ConfigStore): boolean {
  const flag = process.env.OTTO_COGNEE_ENABLED?.trim();
  if (flag === '1' || flag === 'true') return true;
  if (flag === '0' || flag === 'false') return false;
  return config?.get().cognee?.enabled === true;
}

export function readCogneeSettings(config: ConfigStore): CogneeSettings {
  return {
    enabled: cogneeEnabled(config),
    baseUrl: resolveCogneeBaseUrl(config),
  };
}

export function applyCogneeSettings(config: ConfigStore, patch: Partial<CogneeSettings>): CogneeSettings {
  const current = config.get().cognee ?? {};
  const next: CogneeSettings = {
    enabled: patch.enabled ?? cogneeEnabled(config),
    baseUrl: (patch.baseUrl ?? resolveCogneeBaseUrl(config)).trim() || DEFAULT_BASE_URL,
  };
  config.update({
    cognee: {
      ...current,
      enabled: next.enabled,
      baseUrl: next.baseUrl,
    },
  });
  process.env.OTTO_COGNEE_ENABLED = next.enabled ? '1' : '0';
  process.env.OTTO_COGNEE_BASE_URL = next.baseUrl;
  return next;
}

export function resolveCogneeReceiptsDir(): string {
  const root = process.env.OTTO_ROOT ? resolve(process.env.OTTO_ROOT) : resolve(process.cwd());
  return join(root, 'receipts', 'cognee');
}

export class CogneeStore {
  constructor(private config?: ConfigStore) {}

  settings(): CogneeSettings {
    return this.config ? readCogneeSettings(this.config) : {
      enabled: cogneeEnabled(),
      baseUrl: resolveCogneeBaseUrl(),
    };
  }

  saveSettings(patch: Partial<CogneeSettings>): CogneeSettings {
    if (!this.config) throw new Error('Cognee settings require ConfigStore');
    return applyCogneeSettings(this.config, patch);
  }

  private lastHealth: CogneeHealth = {
    status: 'disabled',
    baseUrl: null,
    lastError: null,
    lastCheckedAt: null,
  };

  health(): CogneeHealth {
    if (!cogneeEnabled(this.config)) {
      return {
        status: 'disabled',
        baseUrl: null,
        lastError: null,
        lastCheckedAt: new Date().toISOString(),
      };
    }
    const baseUrl = resolveCogneeBaseUrl(this.config);
    if (!isLoopbackUrl(baseUrl)) {
      this.lastHealth = {
        status: 'error',
        baseUrl,
        lastError: 'Only loopback URLs are allowed in v1.',
        lastCheckedAt: new Date().toISOString(),
      };
      return this.lastHealth;
    }
    const script = resolveCogneeScript();
    if (!existsSync(script)) {
      this.lastHealth = {
        status: 'error',
        baseUrl,
        lastError: 'scripts/cognee-home.sh not found',
        lastCheckedAt: new Date().toISOString(),
      };
      return this.lastHealth;
    }
    const result = spawnSync(script, ['health'], { encoding: 'utf8', env: process.env });
    const stdout = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    try {
      const parsed = JSON.parse(stdout) as { ok?: boolean; status?: string; error?: string };
      if (parsed.ok) {
        this.lastHealth = {
          status: 'ready',
          baseUrl,
          lastError: null,
          lastCheckedAt: new Date().toISOString(),
        };
      } else {
        this.lastHealth = {
          status: (parsed.status as CogneeHealth['status']) ?? 'stopped',
          baseUrl,
          lastError: parsed.error ?? 'Cognee not reachable',
          lastCheckedAt: new Date().toISOString(),
        };
      }
    } catch {
      this.lastHealth = {
        status: result.status === 0 ? 'ready' : 'error',
        baseUrl,
        lastError: stdout || 'Health probe failed',
        lastCheckedAt: new Date().toISOString(),
      };
    }
    return this.lastHealth;
  }

  start(): CogneeHealth {
    if (!cogneeEnabled(this.config)) return this.health();
    const script = resolveCogneeScript();
    if (existsSync(script)) spawnSync(script, ['start'], { encoding: 'utf8', env: process.env });
    return this.health();
  }

  stop(): CogneeHealth {
    const script = resolveCogneeScript();
    if (existsSync(script)) spawnSync(script, ['stop'], { encoding: 'utf8', env: process.env });
    return this.health();
  }

  latestCapture(): CogneeCaptureReceipt | null {
    const dir = join(resolveCogneeReceiptsDir(), 'capture');
    if (!existsSync(dir)) return null;
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .reverse();
    if (!files.length) return null;
    try {
      return JSON.parse(readFileSync(join(dir, files[0]!), 'utf8')) as CogneeCaptureReceipt;
    } catch {
      return null;
    }
  }

  captureDryRun(): { paths: string[]; count: number } {
    const script = resolveCaptureScript();
    if (!existsSync(script)) return { paths: [], count: 0 };
    const result = spawnSync(script, ['--kinds', 'receipt,precedent', '--dry-run'], {
      encoding: 'utf8',
      env: process.env,
      cwd: process.env.OTTO_ROOT || process.cwd(),
    });
    const lines = `${result.stdout ?? ''}`.split('\n').filter((l) => l.startsWith('PATH '));
    return { paths: lines.map((l) => l.replace(/^PATH /, '')), count: lines.length };
  }

  captureApply(): CogneeCaptureReceipt | null {
    const script = resolveCaptureScript();
    if (!existsSync(script)) return null;
    spawnSync(script, ['--kinds', 'receipt,precedent', '--apply'], {
      encoding: 'utf8',
      env: process.env,
      cwd: process.env.OTTO_ROOT || process.cwd(),
    });
    return this.latestCapture();
  }

  /** Fixed recall smoke (042/044) — honest empty when daemon or index missing. */
  recallSmoke(query = 'otto receipt precedent'): {
    ok: boolean;
    query: string;
    citations: Array<{ path: string; snippet: string }>;
    error: string | null;
  } {
    const health = this.health();
    if (health.status === 'disabled') {
      return {
        ok: false,
        query,
        citations: [],
        error: 'Cognee disabled — set OTTO_COGNEE_ENABLED=1 and start scripts/cognee-home.sh',
      };
    }
    if (health.status !== 'ready') {
      return {
        ok: false,
        query,
        citations: [],
        error: health.lastError ?? `Cognee status: ${health.status}`,
      };
    }
    const latest = this.latestCapture();
    if (!latest?.paths?.length) {
      return {
        ok: false,
        query,
        citations: [],
        error: 'No capture receipt yet — run scripts/cognee-capture.sh --apply after Cognee is ready',
      };
    }
    const match = latest.paths.find((p) => p.includes('receipt') || p.includes('precedent')) ?? latest.paths[0];
    return {
      ok: false,
      query,
      citations: [],
      error: match
        ? `MCP semantic recall not wired yet. Latest capture indexed ${match} — citations appear after 042 ships.`
        : 'MCP semantic recall not wired yet — capture receipt on file but no query results.',
    };
  }
}

function resolveCogneeScript(): string {
  const root = process.env.OTTO_ROOT ? resolve(process.env.OTTO_ROOT) : resolve(process.cwd(), '../..');
  const candidates = [
    join(root, 'scripts', 'cognee-home.sh'),
    resolve(process.cwd(), 'scripts/cognee-home.sh'),
    resolve(process.cwd(), '../../scripts/cognee-home.sh'),
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[0]!;
}

function resolveCaptureScript(): string {
  const root = process.env.OTTO_ROOT ? resolve(process.env.OTTO_ROOT) : resolve(process.cwd(), '../..');
  const candidates = [
    join(root, 'scripts', 'cognee-capture.sh'),
    resolve(process.cwd(), 'scripts/cognee-capture.sh'),
    resolve(process.cwd(), '../../scripts/cognee-capture.sh'),
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[0]!;
}

export function writeCogneeSmokeReceipt(payload: Record<string, unknown>): string {
  const dir = resolveCogneeReceiptsDir();
  mkdirSync(dir, { recursive: true });
  const id = `otto-041-local-home-smoke-${Date.now()}`;
  const path = join(dir, `${id}.json`);
  writeFileSync(path, `${JSON.stringify({ id, at: new Date().toISOString(), ...payload }, null, 2)}\n`, 'utf8');
  return path;
}
