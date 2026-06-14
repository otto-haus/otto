import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { EffortLevel, OttoConfig } from './shared/types';

export const defaultOttoDir = () => process.env.OTTO_CONFIG_DIR || join(homedir(), '.otto');

/** Local-first config store at ~/.otto/config.json by default. No hardcoded agent — Otto stays generic. */
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

  /** Resolve the agent id: OTTO_AGENT_ID env wins, then config. No hardcoded default. */
  agentId(): string | null {
    return process.env.OTTO_AGENT_ID || this.cfg.agentId || null;
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
    return normalizeEffort(process.env.OTTO_EFFORT || this.cfg.effort) ?? 'max';
  }
}

function normalizeEffort(value: unknown): EffortLevel | null {
  if (value === 'off' || value === 'low' || value === 'medium' || value === 'high' || value === 'max') return value;
  return null;
}
