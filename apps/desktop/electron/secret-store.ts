import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Local secret store for Otto Desktop. Values live in ~/.otto/secrets.env, owner-only
// (0600), one KEY=VALUE per line — kept out of config.json and out of the repo. The Letta
// API key never reaches the renderer: it is read here in main and injected into the CLI's
// spawn environment. (A macOS Keychain backend is the planned hardening; this is the v0.1
// fallback the file's perms make safe enough for a single-user local app.)

const OTTO_DIR = join(homedir(), '.otto');
const SECRETS_FILE = join(OTTO_DIR, 'secrets.env');

function readAll(): Record<string, string> {
  if (!existsSync(SECRETS_FILE)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(SECRETS_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    out[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return out;
}

function writeAll(map: Record<string, string>): void {
  mkdirSync(OTTO_DIR, { recursive: true });
  const body = Object.entries(map)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  writeFileSync(SECRETS_FILE, body ? `${body}\n` : '', { mode: 0o600 });
  try {
    chmodSync(SECRETS_FILE, 0o600); // enforce perms even if the file already existed
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
