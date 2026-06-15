import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { shell } from 'electron';

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
  for (const candidate of candidates) {
    const path = join(dir, candidate);
    if (existsSync(path)) return path;
  }
  return dir;
}

export async function openOttoLogs() {
  const dir = ottoLogDir();
  mkdirSync(dir, { recursive: true });
  const target = latestOttoLogTarget();
  const error = await shell.openPath(target);
  if (error) throw new Error(error);
  return target;
}
