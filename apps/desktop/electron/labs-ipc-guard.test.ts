import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('labs IPC guard (141)', () => {
  test('ipc.ts has no Cut-tier deploy or cloud stack shortcuts', () => {
    const src = readFileSync(join(import.meta.dir, 'ipc.ts'), 'utf8');
    const forbidden = [
      'otto:cloud:',
      'otto:deploy',
      'otto:paperclip',
      'otto:cathedral',
      'otto:otto-cloud',
    ];
    for (const token of forbidden) {
      expect(src.includes(token)).toBe(false);
    }
  });

  test('labs set IPC uses shared applyLabsConfigPatch helper', () => {
    const ipcSrc = readFileSync(join(import.meta.dir, 'ipc.ts'), 'utf8');
    expect(ipcSrc.includes('applyLabsConfigPatch')).toBe(true);
    expect(ipcSrc.includes('otto:labs:set')).toBe(true);
  });

  test('config set IPC validates cloud connectionMode against Labs (#628)', () => {
    const ipcSrc = readFileSync(join(import.meta.dir, 'ipc.ts'), 'utf8');
    expect(ipcSrc.includes('assertConnectionModePatchAllowed')).toBe(true);
    expect(ipcSrc.includes('otto:config:set')).toBe(true);
  });

  test('culture export IPC validates culture_export Labs flag (#699)', () => {
    const ipcSrc = readFileSync(join(import.meta.dir, 'ipc.ts'), 'utf8');
    expect(ipcSrc.includes('cultureExportEnabled')).toBe(true);
    expect(ipcSrc.includes('otto:culture:export')).toBe(true);
    expect(ipcSrc.includes('otto:culture:import-preview')).toBe(true);
    expect(ipcSrc.includes('culture_export enabled')).toBe(true);
  });
});
