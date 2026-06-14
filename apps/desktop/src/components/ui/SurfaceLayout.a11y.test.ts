import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const surfaceLayoutSource = readFileSync(join(import.meta.dir, 'SurfaceLayout.tsx'), 'utf8');
const panesSource = readFileSync(resolve(import.meta.dir, '../../surfaces/Panes.tsx'), 'utf8');

describe('SplitLayout list accessibility contract', () => {
  test('only named SplitLayout lists become labeled groups', () => {
    expect(surfaceLayoutSource).toContain('listAriaLabel?: string;');
    expect(surfaceLayoutSource).toContain("role: 'group' as const");
    expect(surfaceLayoutSource).toContain("'aria-label': listAriaLabel");
    expect(surfaceLayoutSource).toContain('...(listAriaLabel ?');
  });

  test('Charters and Receipts provide accessible list names without changing card semantics', () => {
    expect(panesSource).toContain('listClassName="charterList"');
    expect(panesSource).toContain('listAriaLabel="Charters list"');
    expect(panesSource).toContain('listClassName="receiptList"');
    expect(panesSource).toContain('listAriaLabel="Receipts list"');
    expect(panesSource).not.toContain('role="listitem"');
  });
});
