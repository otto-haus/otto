import { join } from 'node:path';
import { homedir } from 'node:os';
import { BrowserWindow, app } from 'electron';
import { registerIpc } from './ipc';

let mainWindow: BrowserWindow | null = null;

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
  const win = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 680,
    minHeight: 480,
    backgroundColor: '#fbfaf7',
    titleBarStyle: 'hiddenInset',
    title: 'otto',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      // Security fix: Enable the OS-level sandbox to restrict renderer process capabilities and mitigate RCE impact
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  registerIpc(win);

  // Dev: load the running Vite renderer; Prod: load the built renderer.
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
  mainWindow = win;
  return win;
}

app.whenReady().then(() => {
  ensurePath();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
