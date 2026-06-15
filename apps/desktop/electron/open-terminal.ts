import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function resolveWorkspaceRoot(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.OTTO_ROOT,
    resolve(process.cwd(), '../..'),
    resolve(process.cwd(), '../../..'),
    resolve(process.cwd(), '..'),
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (existsSync(join(candidate, '.git'))) return resolve(candidate);
  }

  return resolve(candidates[0] ?? process.cwd());
}

export type OpenTerminalResult =
  | { ok: true; cwd: string }
  | { ok: false; error: string; cwd: string };

export async function openSystemTerminal(cwd?: string): Promise<OpenTerminalResult> {
  const target = resolveWorkspaceRoot(cwd);
  try {
    if (process.platform === 'darwin') {
      await openMacTerminal(target);
    } else if (process.platform === 'win32') {
      await openWindowsTerminal(target);
    } else {
      await openLinuxTerminal(target);
    }
    return { ok: true, cwd: target };
  } catch (error) {
    return {
      ok: false,
      cwd: target,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function openMacTerminal(cwd: string): Promise<void> {
  const escaped = cwd.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  await execFileAsync('osascript', [
    '-e', 'tell application "Terminal"',
    '-e', `do script "cd " & quoted form of "${escaped}"`,
    '-e', 'activate',
    '-e', 'end tell',
  ]);
}

async function openWindowsTerminal(cwd: string): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn('cmd.exe', ['/c', 'start', 'cmd', '/K', `cd /d ${cwd}`], {
      detached: true,
      stdio: 'ignore',
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`cmd.exe exited ${code ?? 'unknown'}`));
    });
    child.unref();
  });
}

async function openLinuxTerminal(cwd: string): Promise<void> {
  const attempts: Array<() => Promise<void>> = [
    () => execFileAsync('x-terminal-emulator', ['--working-directory', cwd]).then(() => {}),
    () => execFileAsync('gnome-terminal', ['--working-directory', cwd]).then(() => {}),
    () => execFileAsync('konsole', ['--workdir', cwd]).then(() => {}),
    () => execFileAsync('xterm', ['-e', `cd ${cwd} && exec $SHELL`]).then(() => {}),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
