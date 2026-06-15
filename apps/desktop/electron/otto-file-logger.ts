import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { redactDiagnosticsText } from './diagnostics-export';

export type OttoLogService = 'main' | 'renderer' | 'letta-remote' | 'runtime';

const SERVICE_FILES: Record<OttoLogService, string> = {
  main: 'main.log',
  renderer: 'renderer.log',
  'letta-remote': 'letta-remote.log',
  runtime: 'runtime.log',
};

let logsDir = '';

export function initOttoFileLogger(userDataPath: string): string {
  logsDir = join(userDataPath, 'logs');
  mkdirSync(logsDir, { recursive: true });
  writeLog('main', 'info', 'otto main process logger ready');
  return logsDir;
}

export function ottoLogsDir(): string {
  return logsDir;
}

export function ottoLogPath(service: OttoLogService): string {
  return join(logsDir || '', SERVICE_FILES[service]);
}

export function writeLog(service: OttoLogService, level: string, message: string): void {
  if (!logsDir) return;
  const line = redactDiagnosticsText(
    `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`,
  );
  try {
    appendFileSync(ottoLogPath(service), line);
  } catch {
    /* best-effort */
  }
}

export function appendRawLog(service: OttoLogService, chunk: string): void {
  if (!logsDir || !chunk) return;
  const line = redactDiagnosticsText(chunk.endsWith('\n') ? chunk : `${chunk}\n`);
  try {
    appendFileSync(ottoLogPath(service), line);
  } catch {
    /* best-effort */
  }
}

export function logExists(service: OttoLogService): boolean {
  return logsDir ? existsSync(ottoLogPath(service)) : false;
}
