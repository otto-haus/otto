import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { ConfigStore } from './config-store';
import type { DreamSettings, DreamTrigger, OttoConfig } from './shared/types';

export const DEFAULT_DREAM_STEP_COUNT = 25;

export const DEFAULT_DREAM_SETTINGS: DreamSettings = {
  trigger: 'compaction-event',
  stepCount: DEFAULT_DREAM_STEP_COUNT,
};

type LettaReflectionScoped = {
  trigger?: unknown;
  stepCount?: unknown;
};

type LettaSettingsCarrier = {
  memoryReminderInterval?: number | null | 'compaction' | 'auto-compaction';
  reflectionTrigger?: unknown;
  reflectionStepCount?: unknown;
  reflectionSettingsByAgent?: Record<string, LettaReflectionScoped>;
};

function isValidStepCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0;
}

function normalizeTrigger(value: unknown, fallback: DreamTrigger): DreamTrigger {
  if (value === 'off' || value === 'step-count' || value === 'compaction-event') return value;
  return fallback;
}

function normalizeDreamSettings(raw: Partial<DreamSettings> | undefined): DreamSettings {
  if (!raw) return { ...DEFAULT_DREAM_SETTINGS };
  return {
    trigger: normalizeTrigger(raw.trigger, DEFAULT_DREAM_SETTINGS.trigger),
    stepCount: isValidStepCount(raw.stepCount) ? raw.stepCount : DEFAULT_DREAM_STEP_COUNT,
  };
}

function legacyModeToDreamSettings(mode: LettaSettingsCarrier['memoryReminderInterval']): DreamSettings | null {
  if (typeof mode === 'number') {
    return { trigger: 'step-count', stepCount: isValidStepCount(mode) ? mode : DEFAULT_DREAM_STEP_COUNT };
  }
  if (mode === null) return { trigger: 'off', stepCount: DEFAULT_DREAM_STEP_COUNT };
  if (mode === 'compaction' || mode === 'auto-compaction') {
    return { trigger: 'compaction-event', stepCount: DEFAULT_DREAM_STEP_COUNT };
  }
  return null;
}

function dreamSettingsToLegacyMode(settings: DreamSettings): number | null | 'auto-compaction' {
  if (settings.trigger === 'off') return null;
  if (settings.trigger === 'compaction-event') return 'auto-compaction';
  return settings.stepCount;
}

export function getDreamSettings(cfg: OttoConfig): DreamSettings {
  return normalizeDreamSettings(cfg.dreaming);
}

export function patchDreamSettings(cfg: OttoConfig, patch: Partial<DreamSettings>): DreamSettings {
  const current = getDreamSettings(cfg);
  return normalizeDreamSettings({ ...current, ...patch });
}

export function dreamSettingsToOttoPatch(next: DreamSettings): Pick<OttoConfig, 'dreaming'> {
  return { dreaming: next };
}

export function applyDreamSettingsPatch(cfg: OttoConfig, patch: Partial<DreamSettings>): DreamSettings {
  return patchDreamSettings(cfg, patch);
}

export function resolveLettaSettingsPath(config: Pick<ConfigStore, 'lettaStateDir'>, connectionMode: OttoConfig['connectionMode']): string {
  const override = process.env.OTTO_LETTA_SETTINGS_PATH?.trim();
  if (override) return override;
  if (connectionMode === 'embedded') return join(config.lettaStateDir(), 'settings.json');
  return join(homedir(), '.letta', 'settings.json');
}

/**
 * Ensure embedded Letta state lives under OTTO_HOME/letta and expose it to the spawned engine.
 *
 * otto previously only set OTTO_LETTA_SETTINGS_PATH (otto's own dream-settings reads), while the
 * embedded Letta Code CLI reads LETTA_SETTINGS_PATH / LETTA_MEMORY_DIR. That desynced otto's writes
 * (~/.otto/letta) from the engine's reads (~/.letta). For embedded mode we now point the engine's
 * state env at the isolated ~/.otto/letta dir so This Mac never touches a dev ~/.letta install (#674).
 * Existing/cloud modes are untouched (advanced users keep their own ~/.letta paths).
 */
export function applyEmbeddedLettaSettingsEnv(config: ConfigStore): string {
  const mode = config.connectionMode();
  const path = resolveLettaSettingsPath(config, mode);
  if (mode !== 'embedded') {
    return process.env.OTTO_LETTA_SETTINGS_PATH?.trim() || path;
  }
  const stateDir = config.ensureLettaStateDir();
  if (!process.env.OTTO_LETTA_SETTINGS_PATH?.trim()) {
    process.env.OTTO_LETTA_SETTINGS_PATH = path;
  }
  const effective = process.env.OTTO_LETTA_SETTINGS_PATH?.trim() || path;
  if (!process.env.LETTA_SETTINGS_PATH?.trim()) process.env.LETTA_SETTINGS_PATH = effective;
  if (!process.env.LETTA_MEMORY_DIR?.trim()) process.env.LETTA_MEMORY_DIR = join(stateDir, 'memory');
  return effective;
}

function readLettaSettings(path: string): LettaSettingsCarrier {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as LettaSettingsCarrier;
  } catch {
    return {};
  }
}

function writeLettaSettings(path: string, data: LettaSettingsCarrier): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

export function readDreamSettingsFromLetta(agentId: string | null, settingsPath: string): DreamSettings | null {
  const raw = readLettaSettings(settingsPath);
  if (agentId && raw.reflectionSettingsByAgent?.[agentId]) {
    const scoped = raw.reflectionSettingsByAgent[agentId];
    return normalizeDreamSettings({
      trigger: scoped.trigger as DreamSettings['trigger'] | undefined,
      stepCount: scoped.stepCount as number | undefined,
    });
  }
  const fromLegacy = legacyModeToDreamSettings(raw.memoryReminderInterval);
  if (fromLegacy) return fromLegacy;
  if (raw.reflectionTrigger !== undefined || raw.reflectionStepCount !== undefined) {
    return normalizeDreamSettings({
      trigger: raw.reflectionTrigger as DreamSettings['trigger'] | undefined,
      stepCount: raw.reflectionStepCount as number | undefined,
    });
  }
  return null;
}

/** Persist dreaming settings where Letta Code reads them (global + per-agent scope). */
export function syncDreamSettingsToLetta(
  agentId: string | null,
  settings: DreamSettings,
  settingsPath: string,
): void {
  const normalized = normalizeDreamSettings(settings);
  const legacyMode = dreamSettingsToLegacyMode(normalized);
  const existing = readLettaSettings(settingsPath);
  const next: LettaSettingsCarrier = {
    ...existing,
    memoryReminderInterval: legacyMode,
    reflectionTrigger: normalized.trigger,
    reflectionStepCount: normalized.stepCount,
  };
  if (agentId) {
    next.reflectionSettingsByAgent = {
      ...(existing.reflectionSettingsByAgent ?? {}),
      [agentId]: {
        trigger: normalized.trigger,
        stepCount: normalized.stepCount,
      },
    };
  }
  writeLettaSettings(settingsPath, next);
}

export function resolveEffectiveDreamSettings(
  cfg: OttoConfig,
  agentId: string | null,
  settingsPath: string,
): DreamSettings {
  if (cfg.dreaming) return getDreamSettings(cfg);
  return readDreamSettingsFromLetta(agentId, settingsPath) ?? DEFAULT_DREAM_SETTINGS;
}
