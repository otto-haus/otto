import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { BrowserWindow, app } from 'electron';
import { ConfigStore } from './config-store';
import { windowBackgroundForPref } from './display-theme';
import { registerIpc, type IpcRegistration } from './ipc';
import { getMainWindow, setMainWindow } from './main-window';
import { resolveDevRendererUrl } from './main-security';
import { attachWindowGeometryHandlers } from './window-geometry';
import {
  browserWindowOptionsFromState,
  createMainWindowState,
  manageWindowState,
  restoreSavedWindowMode,
} from './window-state';
import {
  applyWindowLaunchMode,
  browserWindowShowsOnCreate,
  resolveActivateAction,
  resolveWindowLaunchMode,
  shouldEnforceSingleInstance,
  surfaceWindow,
} from './window-launch';
import { markCleanShutdown, noteAppSessionStart } from './shutdown-lifecycle';

let ipcRegistration: IpcRegistration | null = null;
let shuttingDown = false;

function applyUserDataDirOverride() {
  const override = process.env.OTTO_USER_DATA_DIR?.trim();
  if (!override) return;
  const userDataDir = resolve(override);
  mkdirSync(userDataDir, { recursive: true });
  app.setPath('userData', userDataDir);
}

// A GUI-launched macOS app inherits a minimal PATH (no Homebrew/nvm/etc.). The Letta SDK
// spawns `node` from PATH to run its CLI, so a packaged Otto would fail to find it and the
// chat could never connect. Prepend the usual install locations before anything spawns.
// No-op in dev, where the launching shell already provides a full PATH.
function ensurePath() {
  if (process.platform !== 'darwin' || !app.isPackaged) return;
  const extra = ['/opt/homebrew/bin', '/usr/local/bin', join(homedir(), '.local/bin'), join(homedir(), '.bun/bin')];
  const seen = new Set((process.env.PATH || '').split(':'));
  process.env.PATH = [...extra.filter((p) => !seen.has(p)), process.env.PATH || ''].filter(Boolean).join(':');
}

function createWindow() {
  const launchMode = resolveWindowLaunchMode();
  const config = new ConfigStore();
  const windowState = createMainWindowState();
  const win = new BrowserWindow({
    ...browserWindowOptionsFromState(windowState),
    minWidth: 680,
    minHeight: 480,
    show: browserWindowShowsOnCreate(launchMode),
    // Match the active display theme so there's no flash before the renderer paints.
    backgroundColor: windowBackgroundForPref(config.get().theme),
    titleBarStyle: 'hiddenInset',
    title: 'otto',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  restoreSavedWindowMode(win, windowState, launchMode);
  manageWindowState(win, windowState);
  applyWindowLaunchMode(win, launchMode);
  attachWindowGeometryHandlers(win);
  setMainWindow(win);

  // Dev: load the running Vite renderer; Prod: load the built renderer.
  const devRendererUrl = resolveDevRendererUrl(process.env.ELECTRON_RENDERER_URL, app.isPackaged);
  if (devRendererUrl) {
    win.loadURL(devRendererUrl);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  win.on('close', (event) => {
    // macOS keeps the app alive when the red button closes the window; tear down runtime
    // before destroy so dock reopen does not spawn a second LettaRunner (#610).
    if (shuttingDown || process.platform !== 'darwin' || win.isDestroyed()) return;
    event.preventDefault();
    void ipcRegistration?.teardownForWindowClose().finally(() => {
      if (!win.isDestroyed()) win.destroy();
    });
  });

  win.on('closed', () => {
    if (getMainWindow() === win) setMainWindow(null);
  });

  const capturePath = process.env.OTTO_CAPTURE_README?.trim();
  if (capturePath) {
    win.webContents.once('did-finish-load', () => {
      const hash = process.env.OTTO_CAPTURE_HASH?.trim() || 'chat';
      if (hash !== 'chat') win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(hash)}`);
      const delayMs = Number(process.env.OTTO_CAPTURE_DELAY_MS ?? 3500);
      setTimeout(async () => {
        try {
          mkdirSync(dirname(capturePath), { recursive: true });
          const image = await win.capturePage();
          writeFileSync(capturePath, image.toPNG());
          console.log(`[otto] README screenshot saved: ${capturePath}`);
        } catch (err) {
          console.error('[otto] README screenshot failed:', err);
          process.exitCode = 1;
        } finally {
          app.quit();
        }
      }, Number.isFinite(delayMs) ? delayMs : 3500);
    });
  }

  return win;
}

function bindShutdownHooks() {
  const runShutdown = async (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await ipcRegistration?.shutdown(reason);
      markCleanShutdown();
    } catch (err) {
      console.error('[otto] graceful shutdown failed:', err);
    }
  };

  app.on('before-quit', (event) => {
    if (shuttingDown) return;
    event.preventDefault();
    void runShutdown('before-quit').finally(() => app.exit(0));
  });

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void runShutdown(signal).finally(() => process.exit(0));
    });
  }
}

// Set userData (the single-instance lock scope) before requesting the lock, so isolated
// instances (OTTO_USER_DATA_DIR) keep independent locks and only true same-dir double
// launches are deduped.
applyUserDataDirOverride();

// Prevent a second launch from racing ConfigStore writes against the running instance (#681).
if (shouldEnforceSingleInstance() && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) surfaceWindow(win);
  });

  app.whenReady().then(() => {
    noteAppSessionStart();
    ensurePath();
    bindShutdownHooks();
    ipcRegistration = registerIpc();
    createWindow();
    app.on('activate', () => {
      const win = getMainWindow();
      const action = resolveActivateAction(
        BrowserWindow.getAllWindows().length,
        !!win && !win.isDestroyed(),
      );
      if (action === 'create') {
        createWindow();
      } else if (action === 'surface' && win) {
        // Surface even a hidden smoke window so the Dock click never leaves an invisible app (#683).
        surfaceWindow(win);
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
