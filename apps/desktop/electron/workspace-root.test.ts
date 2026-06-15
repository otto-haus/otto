import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getWorkspaceInfo, resolveWorkspaceRepoRoot } from './workspace-root';

describe('workspace-root', () => {
  const prev = {
    OTTO_ROOT: process.env.OTTO_ROOT,
    OTTO_HOME: process.env.OTTO_HOME,
    OTTO_CONFIG_DIR: process.env.OTTO_CONFIG_DIR,
    cwd: process.cwd(),
  };

  beforeEach(() => {
    delete process.env.OTTO_ROOT;
    delete process.env.OTTO_HOME;
    delete process.env.OTTO_CONFIG_DIR;
  });

  afterEach(() => {
    if (prev.OTTO_ROOT !== undefined) process.env.OTTO_ROOT = prev.OTTO_ROOT;
    else delete process.env.OTTO_ROOT;
    if (prev.OTTO_HOME !== undefined) process.env.OTTO_HOME = prev.OTTO_HOME;
    else delete process.env.OTTO_HOME;
    if (prev.OTTO_CONFIG_DIR !== undefined) process.env.OTTO_CONFIG_DIR = prev.OTTO_CONFIG_DIR;
    else delete process.env.OTTO_CONFIG_DIR;
    process.chdir(prev.cwd);
  });

  test('resolveWorkspaceRepoRoot prefers OTTO_ROOT', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-workspace-'));
    process.env.OTTO_ROOT = dir;
    expect(resolveWorkspaceRepoRoot()).toBe(dir);
    rmSync(dir, { recursive: true, force: true });
  });

  test('getWorkspaceInfo surfaces repo root and otto home sources', () => {
    const repo = mkdtempSync(join(tmpdir(), 'otto-repo-'));
    const home = mkdtempSync(join(tmpdir(), 'otto-home-'));
    process.env.OTTO_ROOT = repo;
    process.env.OTTO_HOME = home;
    const info = getWorkspaceInfo();
    expect(info.repoRoot).toBe(repo);
    expect(info.ottoHome).toBe(home);
    expect(info.repoRootSource).toBe('otto_root');
    expect(info.ottoHomeSource).toBe('otto_home');
    rmSync(repo, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });
});
