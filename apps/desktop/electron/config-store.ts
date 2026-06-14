import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { EffortLevel, OttoConfig } from './shared/types';

export const defaultOttoDir = () => {
  const homeOverride = process.env.OTTO_HOME?.trim();
  if (homeOverride) return resolve(homeOverride);
  return process.env.OTTO_CONFIG_DIR || join(homedir(), '.otto');
};
export const OTTO_DIR = defaultOttoDir();
const LETTA_SETTINGS_LOCAL = join(homedir(), '.letta', 'settings.local.json');
const LETTA_SETTINGS = join(homedir(), '.letta', 'settings.json');

type LettaSettings = {
  lastAgent?: string;
  lastSession?: { agentId?: string | null; conversationId?: string | null };
  sessionsByServer?: Record<string, { agentId?: string | null; conversationId?: string | null }>;
};

/** Local-first config store at ~/.otto/config.json by default. No hardcoded agent — otto stays generic. */
export class ConfigStore {
  private cfg: OttoConfig = {};
  private readonly configFile: string;

  constructor() {
    const ottoDir = defaultOttoDir();
    this.configFile = join(ottoDir, 'config.json');
    mkdirSync(ottoDir, { recursive: true });
    if (existsSync(this.configFile)) {
      try {
        this.cfg = JSON.parse(readFileSync(this.configFile, 'utf8')) as OttoConfig;
      } catch {
        this.cfg = {};
      }
    }
  }

  get(): OttoConfig {
    return this.cfg;
  }

  update(patch: Partial<OttoConfig>): OttoConfig {
    this.cfg = { ...this.cfg, ...patch };
    writeFileSync(this.configFile, `${JSON.stringify(this.cfg, null, 2)}\n`);
    return this.cfg;
  }

  /** Resolve the first agent candidate. Runtime init may try later candidates if this one is stale. */
  agentId(): string | null {
    return this.agentCandidates()[0] ?? null;
  }

  /** Agent candidates in priority order: explicit otto override, then local Letta's recent agents. */
  agentCandidates(): string[] {
    const nested = (this.cfg as OttoConfig & { agent?: { id?: string | null } }).agent?.id;
    return unique([process.env.OTTO_AGENT_ID, this.cfg.agentId, nested, ...discoverLettaAgentIds()]);
  }

  /** Letta base URL for local/self-hosted backends: LETTA_BASE_URL env wins, then config. */
  baseUrl(): string | null {
    return process.env.LETTA_BASE_URL || this.cfg.baseUrl || null;
  }

  /** Model handle passed through to Letta Code's `-m`/SDK model option. */
  modelHandle(): string | null {
    return process.env.OTTO_MODEL || this.cfg.modelHandle || this.cfg.model?.model || null;
  }

  /** UI-level reasoning effort preference. Public SDK support is version-gated. */
  effort(): EffortLevel {
    return normalizeEffort(process.env.OTTO_EFFORT || this.cfg.effort) ?? 'high';
  }

  connectionMode(): NonNullable<OttoConfig['connectionMode']> {
    return this.cfg.connectionMode ?? 'embedded';
  }

  /** Isolated Letta settings root for embedded mode (076) — under ~/.otto/letta by default. */
  lettaStateDir(): string {
    return join(defaultOttoDir(), 'letta');
  }

  /** Ensure embedded Letta state directory exists; returns absolute path. */
  ensureLettaStateDir(): string {
    const dir = this.lettaStateDir();
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  primaryAgentId(): string | null {
    return this.cfg.primaryAgentId ?? this.cfg.agentId ?? null;
  }
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

function discoverLettaAgentIds(): string[] {
  const candidates: Array<string | null | undefined> = [];
  const paths = process.env.OTTO_LETTA_SETTINGS_PATH
    ? [process.env.OTTO_LETTA_SETTINGS_PATH]
    : [LETTA_SETTINGS_LOCAL, LETTA_SETTINGS];
  for (const path of paths) {
    const settings = readJson<LettaSettings>(path);
    candidates.push(settings?.lastSession?.agentId, settings?.lastAgent);
    for (const session of Object.values(settings?.sessionsByServer ?? {})) {
      candidates.push(session.agentId);
    }
  }
  return unique(candidates);
}

function unique(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !out.includes(trimmed)) out.push(trimmed);
  }
  return out;
}

function normalizeEffort(value: unknown): EffortLevel | null {
  if (value === 'off' || value === 'low' || value === 'medium' || value === 'high' || value === 'max') return value;
  return null;
}
