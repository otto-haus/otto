import type { BrowserWindow } from 'electron';

export type WindowLaunchMode = 'visible' | 'background' | 'hidden' | 'minimized';

const MODES: WindowLaunchMode[] = ['visible', 'background', 'hidden', 'minimized'];

export function resolveWindowLaunchMode(env: NodeJS.ProcessEnv = process.env): WindowLaunchMode {
  const explicit = env.OTTO_WINDOW_MODE?.trim().toLowerCase();
  if (explicit && MODES.includes(explicit as WindowLaunchMode)) {
    return explicit as WindowLaunchMode;
  }
  if (env.OTTO_SMOKE === '1' || env.OTTO_SMOKE === 'true') {
    return 'background';
  }
  return 'visible';
}

export function browserWindowShowsOnCreate(mode: WindowLaunchMode): boolean {
  return mode === 'visible';
}

export function applyWindowLaunchMode(win: BrowserWindow, mode: WindowLaunchMode): void {
  if (mode === 'visible') return;

  win.once('ready-to-show', () => {
    if (mode === 'background') {
      win.showInactive();
      return;
    }
    if (mode === 'minimized') {
      win.showInactive();
      win.minimize();
      return;
    }
    // hidden: keep window off-screen; renderer still loads for CDP/capture.
  });
}
