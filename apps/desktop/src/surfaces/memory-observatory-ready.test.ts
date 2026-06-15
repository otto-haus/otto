import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');
const ipcSource = readFileSync(join(import.meta.dir, '../../electron/ipc.ts'), 'utf8');

describe('Memory observatory runtime ready gate (#715)', () => {
  it('skips memory.list when Settings observatory is disconnected', () => {
    expect(panesSource).toContain('if (!connected) {');
    expect(panesSource).toMatch(/useEffect\([\s\S]*?connected[\s\S]*?api\.memory\.list\(\)/);
    expect(panesSource).toContain('{connected && filtered.map');
    expect(panesSource).toContain('settingsCopy.memoryConnectWarn');
  });

  it('gates memory IPC on runtime session ready', () => {
    expect(ipcSource).toContain('memoryListBlockedResult');
    expect(ipcSource).toMatch(/otto:memory:list[\s\S]*?status\.ready/);
  });
});
