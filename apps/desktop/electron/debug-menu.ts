import { clipboard, Menu, type BrowserWindow, type MenuItemConstructorOptions, app, shell } from 'electron';
import type { OttoConfig, RuntimeStatus } from './shared/types';
import {
  buildDebugPacket,
  formatDebugPacketText,
  formatRuntimeStatusText,
} from './debug-packet';
import { resolveDebugEnvelope } from './debug-envelope';
import { openOttoLogs } from './logs';

export type DebugMenuDeps = {
  win: BrowserWindow;
  runtimeStatus: RuntimeStatus;
  config: OttoConfig;
};

export function devToolsAvailable(): boolean {
  return !app.isPackaged || process.env.OTTO_ALLOW_DEVTOOLS === '1' || process.env.OTTO_SMOKE === '1';
}

export function showOttoDebugMenu(deps: DebugMenuDeps, surface?: string) {
  const envelope = resolveDebugEnvelope();
  const packet = buildDebugPacket({
    runtimeStatus: deps.runtimeStatus,
    config: deps.config,
    envelope,
  });
  const runtimeText = formatRuntimeStatusText(deps.runtimeStatus, deps.config);
  const packetText = formatDebugPacketText(packet);
  const profilePath = app.getPath('userData');

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Show logs',
      click: () => {
        void openOttoLogs().catch((err) => console.error('[otto] failed to open logs:', err));
      },
    },
    {
      label: 'Copy runtime status',
      click: () => clipboard.writeText(runtimeText),
    },
    {
      label: 'Copy debug packet',
      click: () => clipboard.writeText(packetText),
    },
    {
      label: 'Open profile/log folder',
      click: () => {
        void shell.openPath(profilePath);
      },
    },
  ];

  if (devToolsAvailable()) {
    template.push({
      label: 'Open DevTools',
      click: () => deps.win.webContents.openDevTools({ mode: 'detach' }),
    });
  }

  if (surface) {
    template.unshift({
      label: `Debug (${surface})`,
      enabled: false,
    });
  }

  Menu.buildFromTemplate(template).popup({ window: deps.win });
}
