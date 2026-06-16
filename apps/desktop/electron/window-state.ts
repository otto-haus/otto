import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import windowStateKeeper from 'electron-window-state';
import type { BrowserWindow } from 'electron';
import type { WindowLaunchMode } from './window-launch';

export const DEFAULT_WINDOW_WIDTH = 1040;
export const DEFAULT_WINDOW_HEIGHT = 720;
export const WINDOW_STATE_FILE = 'window-state.json';

export type WindowStateKeeper = ReturnType<typeof windowStateKeeper>;

export type PersistedWindowState = {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
  isFullScreen?: boolean;
};

export function createMainWindowState(): WindowStateKeeper {
  return windowStateKeeper({
    defaultWidth: DEFAULT_WINDOW_WIDTH,
    defaultHeight: DEFAULT_WINDOW_HEIGHT,
    file: WINDOW_STATE_FILE,
  });
}

export function browserWindowOptionsFromState(state: WindowStateKeeper): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
  };
}

/** Restore maximized/full-screen only for normal visible launches (#735, OTTO_WINDOW_MODE). */
export function restoreSavedWindowMode(
  win: BrowserWindow,
  state: WindowStateKeeper,
  launchMode: WindowLaunchMode,
): void {
  if (launchMode !== 'visible') return;
  if (state.isMaximized) win.maximize();
  else if (state.isFullScreen) win.setFullScreen(true);
}

export function manageWindowState(win: BrowserWindow, state: WindowStateKeeper): void {
  state.manage(win);
}

export function readPersistedWindowState(userDataPath: string): PersistedWindowState | null {
  const path = join(userDataPath, WINDOW_STATE_FILE);
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<PersistedWindowState>;
    if (typeof raw.width !== 'number' || typeof raw.height !== 'number') return null;
    return {
      x: typeof raw.x === 'number' ? raw.x : undefined,
      y: typeof raw.y === 'number' ? raw.y : undefined,
      width: raw.width,
      height: raw.height,
      isMaximized: raw.isMaximized === true,
      isFullScreen: raw.isFullScreen === true,
    };
  } catch {
    return null;
  }
}
