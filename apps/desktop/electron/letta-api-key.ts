import { existsSync, readFileSync } from 'node:fs';
import type { ConfigStore } from './config-store';
import { resolveLettaSettingsPath } from './dream-settings';
import { getSecret } from './secret-store';

type LettaSettingsEnvCarrier = {
  env?: { LETTA_API_KEY?: unknown };
};

/** Read Letta platform auth from settings.json env block (interactive `letta` login path). */
export function readLettaApiKeyFromSettings(settingsPath: string): string | null {
  if (!settingsPath || !existsSync(settingsPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(settingsPath, 'utf8')) as LettaSettingsEnvCarrier;
    const value = raw.env?.LETTA_API_KEY;
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Resolve Letta platform auth for embedded/local bootstrap.
 * Priority: otto secrets.env → Letta settings env block → inherited process env (launchctl/shell).
 */
export function resolveLettaApiKey(config?: Pick<ConfigStore, 'connectionMode' | 'lettaStateDir'>): string | null {
  const fromSecret = getSecret('LETTA_API_KEY')?.trim();
  if (fromSecret) return fromSecret;

  if (config) {
    const settingsPath = resolveLettaSettingsPath(config, config.connectionMode());
    const fromSettings = readLettaApiKeyFromSettings(settingsPath);
    if (fromSettings) return fromSettings;
  }

  const fromEnv = process.env.LETTA_API_KEY?.trim();
  return fromEnv || null;
}

/** Inject resolved Letta auth into the spawned CLI env without wiping inherited keys. */
export function syncLettaApiKeyEnv(config?: ConfigStore): boolean {
  const key = resolveLettaApiKey(config);
  if (key) {
    process.env.LETTA_API_KEY = key;
    return true;
  }
  Reflect.deleteProperty(process.env, 'LETTA_API_KEY');
  return false;
}

export function hasLettaApiKey(config?: ConfigStore): boolean {
  return !!resolveLettaApiKey(config);
}
