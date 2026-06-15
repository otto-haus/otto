import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');
const ipcSource = readFileSync(join(import.meta.dir, '../../electron/ipc.ts'), 'utf8');

describe('memory observatory session gate (#715)', () => {
  it('skips memory.list when Settings runtime is not ready', () => {
    expect(panesSource).toMatch(/if \(!api\?\.memory \|\| !connected\)/);
    expect(panesSource).toMatch(/}, \[api, connected\]\)/);
    expect(panesSource).toMatch(/const blocks = connected \? \(result\?\.blocks \?\? \[\]\) : \[\]/);
  });

  it('shows honest empty copy instead of block values when disconnected', () => {
    expect(panesSource).toMatch(/!connected \? \([\s\S]*settingsCopy\.memoryConnectWarn/);
    expect(panesSource).toMatch(/disabled=\{!connected \|\| !blocks\.length\}/);
  });

  it('gates otto:memory:list IPC on runtimeStatus.ready', () => {
    expect(ipcSource).toMatch(/otto:memory:list/);
    expect(ipcSource).toMatch(/if \(!runtimeStatus\.ready\)/);
    expect(ipcSource).toMatch(/return memory\.listBlocks\(\)/);
  });
});
