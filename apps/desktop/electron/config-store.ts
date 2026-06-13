import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { OttoConfig } from './shared/types';

export const OTTO_DIR = join(homedir(), '.otto');
const CONFIG_FILE = join(OTTO_DIR, 'config.json');

/** Local-first config store at ~/.otto/config.json. No hardcoded agent — Otto stays generic. */
export class ConfigStore {
  private cfg: OttoConfig = {};

  constructor() {
    mkdirSync(OTTO_DIR, { recursive: true });
    if (existsSync(CONFIG_FILE)) {
      try {
        this.cfg = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as OttoConfig;
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
    writeFileSync(CONFIG_FILE, `${JSON.stringify(this.cfg, null, 2)}\n`);
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
}
