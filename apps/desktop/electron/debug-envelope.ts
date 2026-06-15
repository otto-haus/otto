import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import { defaultOttoDir } from './config-store';
import { readRendererAssetInfo } from './debug-packet';

export type DebugEnvelope = {
  appPath: string | null;
  bundleId: string | null;
  profilePath: string | null;
  ottoHome: string | null;
  rendererAssetName: string | null;
  rendererAssetHash: string | null;
};

export function readBundleId(): string | null {
  if (!app.isPackaged) return 'dev';
  if (process.platform !== 'darwin') return app.name || null;
  try {
    const plistPath = join(process.resourcesPath, '..', 'Info.plist');
    const xml = readFileSync(plistPath, 'utf8');
    const match = xml.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function resolveDebugEnvelope(rendererDir?: string): DebugEnvelope {
  const renderer = readRendererAssetInfo(rendererDir);
  return {
    appPath: app.isPackaged ? app.getPath('exe') : app.getAppPath(),
    bundleId: readBundleId(),
    profilePath: app.getPath('userData'),
    ottoHome: defaultOttoDir(),
    rendererAssetName: renderer.name,
    rendererAssetHash: renderer.hash,
  };
}
