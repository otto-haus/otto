import { describe, expect, test } from 'bun:test';
import {
  isTableStart,
  normalizeCompactTableLine,
  parseTableBlock,
  parseTableCells,
} from './markdown-tables';

describe('markdown-tables', () => {
  test('parses standard multi-line table cells', () => {
    expect(parseTableCells('| Area | Pass condition |')).toEqual(['Area', 'Pass condition']);
  });

  test('normalizes compact single-line table into rows', () => {
    const compact = '| Area | Pass condition | |---|---| | Chat | Renders tables |';
    expect(normalizeCompactTableLine(compact)).toBe(
      '| Area | Pass condition |\n|---|---|\n| Chat | Renders tables |',
    );
  });

  test('parses multi-line markdown table block', () => {
    const lines = [
      '| Area | Pass condition |',
      '|---|---|',
      '| Chat | Renders tables |',
      '| Settings | Readable hints |',
      '',
      'Next paragraph',
    ];

    const parsed = parseTableBlock(lines, 0);
    expect(parsed?.table.headers).toEqual(['Area', 'Pass condition']);
    expect(parsed?.table.rows).toEqual([
      ['Chat', 'Renders tables'],
      ['Settings', 'Readable hints'],
    ]);
    expect(parsed?.endIndex).toBe(4);
  });

  test('parses compact single-line table block', () => {
    const lines = ['| Area | Pass condition | |---|---| | Chat | Renders tables |', ''];

    const parsed = parseTableBlock(lines, 0);
    expect(parsed?.table.headers).toEqual(['Area', 'Pass condition']);
    expect(parsed?.table.rows).toEqual([['Chat', 'Renders tables']]);
    expect(parsed?.endIndex).toBe(1);
  });

  test('detects table starts and ignores pipe-only paragraphs', () => {
    const lines = ['| Area | Pass condition |', '|---|---|', '| Chat | Works |'];
    expect(isTableStart(lines, 0)).toBe(true);
    expect(isTableStart(['Just | pipes | in text'], 0)).toBe(false);
  });
});
