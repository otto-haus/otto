import { existsSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

type ElectronShell = { openPath(target: string): Promise<string> };

async function loadElectronShell(): Promise<ElectronShell> {
  const electronModule = await import('electron') as unknown as {
    shell?: ElectronShell;
    default?: { shell?: ElectronShell };
  };
  const shell = electronModule.shell ?? electronModule.default?.shell;
  if (!shell) throw new Error('Electron shell is unavailable.');
  return shell;
}

export function ottoLogDir() {
  return process.env.OTTO_LOG_DIR?.trim() || join(homedir(), '.codex', 'admin', 'otto-logs');
}

export function latestOttoLogTarget() {
  const dir = ottoLogDir();
  const candidates = [
    'refresh-latest.app.log',
    'staging-latest.app.log',
    'refresh-latest.deploy.log',
    'staging-latest.deploy.log',
  ];
  const existing = candidates
    .map((candidate) => {
      const path = join(dir, candidate);
      if (!existsSync(path)) return null;
      try {
        return { path, mtimeMs: statSync(path).mtimeMs };
      } catch {
        return null;
      }
    })
    .filter((item): item is { path: string; mtimeMs: number } => !!item)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (existing[0]) return existing[0].path;
  return dir;
}

export async function openOttoLogs() {
  const dir = ottoLogDir();
  mkdirSync(dir, { recursive: true });
  const target = latestOttoLogTarget();
  const shell = await loadElectronShell();
  const error = await shell.openPath(target);
  if (error) throw new Error(error);
  return target;
}
