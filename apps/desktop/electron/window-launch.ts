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

export type ActivateAction = 'create' | 'surface' | 'noop';

/**
 * Decide what a Dock/`activate` (or second-instance) event should do (#683).
 * A hidden smoke window still counts toward `getAllWindows().length`, so the
 * "create when zero" rule alone leaves the user staring at an invisible window.
 * When a window already exists, surface it instead of treating activate as a no-op.
 */
export function resolveActivateAction(allWindowCount: number, hasExistingWindow: boolean): ActivateAction {
  if (allWindowCount === 0) return 'create';
  if (hasExistingWindow) return 'surface';
  return 'noop';
}

/** Make an existing (possibly hidden/minimized) window visible and focused. */
export function surfaceWindow(win: BrowserWindow): void {
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  win.focus();
}

/**
 * Whether to enforce a single app instance (#681). Default on, so a second launch
 * focuses the running instance instead of opening a parallel process that races
 * config writes. Opt out with OTTO_ALLOW_MULTIPLE_INSTANCES=1 for harnesses that
 * intentionally run isolated instances against the same userData dir.
 */
export function shouldEnforceSingleInstance(env: NodeJS.ProcessEnv = process.env): boolean {
  const optOut = env.OTTO_ALLOW_MULTIPLE_INSTANCES?.trim().toLowerCase();
  return !(optOut === '1' || optOut === 'true');
}
