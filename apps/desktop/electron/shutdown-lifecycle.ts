import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultOttoDir } from './config-store';

const sessionMarkerPath = () => join(defaultOttoDir(), 'session-active');
const lastCleanShutdownPath = () => join(defaultOttoDir(), 'last-clean-shutdown.json');

export type ShutdownStatus = {
  dirtyShutdown: boolean;
  lastCleanShutdownAt: string | null;
};

export const SHUTDOWN_TIMEOUT_MS = 8_000;

/** Mark a new app session. Returns dirty=true when the prior session never cleared its marker. */
export function noteAppSessionStart(): ShutdownStatus {
  mkdirSync(defaultOttoDir(), { recursive: true });
  const dirtyShutdown = existsSync(sessionMarkerPath());
  writeFileSync(sessionMarkerPath(), `${process.pid}\n${Date.now()}\n`);
  return {
    dirtyShutdown,
    lastCleanShutdownAt: readLastCleanShutdownAt(),
  };
}

export function readShutdownStatus(): ShutdownStatus {
  return {
    dirtyShutdown: existsSync(sessionMarkerPath()),
    lastCleanShutdownAt: readLastCleanShutdownAt(),
  };
}

export function markCleanShutdown(): void {
  if (existsSync(sessionMarkerPath())) unlinkSync(sessionMarkerPath());
  mkdirSync(defaultOttoDir(), { recursive: true });
  writeFileSync(
    lastCleanShutdownPath(),
    `${JSON.stringify({ at: new Date().toISOString(), pid: process.pid }, null, 2)}\n`,
  );
}

/** Force-clear session marker after safe reset or recovery without full app quit. */
export function acknowledgeRunningSession(): void {
  if (!existsSync(sessionMarkerPath())) {
    writeFileSync(sessionMarkerPath(), `${process.pid}\n${Date.now()}\n`);
    return;
  }
  writeFileSync(sessionMarkerPath(), `${process.pid}\n${Date.now()}\n`);
}

function readLastCleanShutdownAt(): string | null {
  if (!existsSync(lastCleanShutdownPath())) return null;
  try {
    const parsed = JSON.parse(readFileSync(lastCleanShutdownPath(), 'utf8')) as { at?: string };
    return typeof parsed.at === 'string' ? parsed.at : null;
  } catch {
    return null;
  }
}
