import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { OttoHomeSource, WorkspaceInfo, WorkspaceRepoRootSource } from './shared/types';

export function resolveWorkspaceRepoRoot(): string {
  const ottoRoot = process.env.OTTO_ROOT?.trim();
  if (ottoRoot) return resolve(ottoRoot);
  return resolve(process.cwd());
}

export function resolveOttoHome(): { path: string; source: OttoHomeSource } {
  const homeOverride = process.env.OTTO_HOME?.trim();
  if (homeOverride) return { path: resolve(homeOverride), source: 'otto_home' };
  const configDir = process.env.OTTO_CONFIG_DIR?.trim();
  if (configDir) return { path: resolve(configDir), source: 'otto_config_dir' };
  return { path: join(homedir(), '.otto'), source: 'default' };
}

export function getWorkspaceInfo(): WorkspaceInfo {
  const ottoRoot = process.env.OTTO_ROOT?.trim();
  const home = resolveOttoHome();
  const repoRootSource: WorkspaceRepoRootSource = ottoRoot ? 'otto_root' : 'cwd';
  return {
    repoRoot: resolveWorkspaceRepoRoot(),
    ottoHome: home.path,
    repoRootSource,
    ottoHomeSource: home.source,
  };
}
