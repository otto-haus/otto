import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');

function settingsBranch(section: string): string {
  const marker = `section === '${section}' ? (`;
  const start = panesSource.indexOf(marker);
  if (start < 0) throw new Error(`missing settings branch: ${section}`);
  let depth = 0;
  for (let i = start + marker.length; i < panesSource.length; i += 1) {
    const ch = panesSource[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      if (depth === 0) return panesSource.slice(start, i);
      depth -= 1;
    }
  }
  throw new Error(`unclosed settings branch: ${section}`);
}

describe('settings debug footers (#614)', () => {
  for (const section of ['memory', 'culture', 'diagnostics'] as const) {
    it(`${section} tab omits dev build footers`, () => {
      const block = settingsBranch(section);
      expect(block).not.toContain('AppSourceDetails');
      expect(block).not.toContain('localOnlyFootnote');
    });
  }

  it('display and general tabs keep build details for operator diagnostics smoke', () => {
    expect(settingsBranch('display')).toContain('AppSourceDetails');
    expect((panesSource.match(/<AppSourceDetails info=\{buildInfo\} \/>/g) ?? []).length).toBe(2);
  });
});
