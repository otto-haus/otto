import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultOttoDir } from './config-store';

// Local secret store for otto Desktop. Values live under the resolved otto home,
// owner-only (0600), one KEY=VALUE per line — kept out of config.json and out of the
// repo. The Letta API key never reaches the renderer: it is read here in main and
// injected into the CLI's spawn environment. (A macOS Keychain backend is the planned
// hardening; this is the v0.1 fallback the file's perms make safe enough for a
// single-user local app.)

export function secretsFilePath(): string {
  return join(defaultOttoDir(), 'secrets.env');
}

function readAll(): Record<string, string> {
  const file = secretsFilePath();
  if (!existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    out[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return out;
}

function writeAll(map: Record<string, string>): void {
  const file = secretsFilePath();
  mkdirSync(defaultOttoDir(), { recursive: true });
  const body = Object.entries(map)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  writeFileSync(file, body ? `${body}\n` : '', { mode: 0o600 });
  try {
    chmodSync(file, 0o600); // enforce perms even if the file already existed
  } catch {
    // best effort
  }
}

export function getSecret(name: string): string | null {
  return readAll()[name] ?? null;
}

export function setSecret(name: string, value: string | null): void {
  const map = readAll();
  if (value == null || value === '') delete map[name];
  else map[name] = value;
  writeAll(map);
}

export function hasSecret(name: string): boolean {
  const v = getSecret(name);
  return !!v && v.length > 0;
}
