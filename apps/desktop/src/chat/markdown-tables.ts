export type MarkdownTable = {
  headers: string[];
  rows: string[][];
};

const TABLE_DIVIDER = /^\|[\s\-:|]+\|$/;

export function isTableDividerLine(line: string): boolean {
  return TABLE_DIVIDER.test(line.trim());
}

export function isTableRowLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|', 1);
}

/** Split a compact single-line pipe table into one line per row. */
export function normalizeCompactTableLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.includes('|') || !/\|[-:\s|]+\|/.test(trimmed) || !/\|\s+\|/.test(trimmed)) {
    return line;
  }

  const parts = trimmed.split(/\|\s+\|/);
  if (parts.length < 2) return line;

  const dividerIndex = parts.findIndex((part) => isDividerCells(part));
  if (dividerIndex < 1) return line;

  return parts
    .map((part, index) => {
      const trimmed = part.trim();
      if (index > 0 && isDividerCells(trimmed)) {
        const cells = trimmed.split('|').filter(Boolean);
        return `|${cells.map((cell) => cell.trim()).join('|')}|`;
      }
      return ensureTableRowPipes(trimmed);
    })
    .join('\n');
}

function isDividerCells(part: string): boolean {
  const cells = part.includes('|')
    ? part.split('|').map((cell) => cell.trim()).filter(Boolean)
    : [part.trim()];
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function ensureTableRowPipes(part: string): string {
  let row = part.trim();
  if (!row.startsWith('|')) row = `| ${row}`;
  if (!row.endsWith('|')) row = `${row} |`;
  return row;
}

export function parseTableCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return [];

  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

export function parseTableBlock(lines: string[], startIndex: number): { table: MarkdownTable; endIndex: number } | null {
  let index = startIndex;
  let headerLine = lines[index]?.trim() ?? '';
  if (!isTableRowLine(headerLine)) return null;

  if (isTableDividerLine(headerLine)) return null;

  const normalized = normalizeCompactTableLine(headerLine);
  if (normalized.includes('\n')) {
    const normalizedLines = normalized.split('\n');
    const nested = parseTableBlock(normalizedLines, 0);
    if (!nested) return null;
    return { table: nested.table, endIndex: startIndex + 1 };
  }

  const dividerLine = lines[index + 1]?.trim() ?? '';
  if (!isTableDividerLine(dividerLine)) return null;

  const headers = parseTableCells(headerLine);
  if (headers.length === 0) return null;

  const rows: string[][] = [];
  index += 2;
  while (index < lines.length) {
    const rowLine = lines[index]?.trim() ?? '';
    if (!rowLine) break;
    if (!isTableRowLine(rowLine) || isTableDividerLine(rowLine)) break;
    rows.push(parseTableCells(rowLine));
    index += 1;
  }

  return { table: { headers, rows }, endIndex: index };
}

export function isTableStart(lines: string[], index: number): boolean {
  const headerLine = lines[index]?.trim() ?? '';
  if (!isTableRowLine(headerLine) || isTableDividerLine(headerLine)) return false;

  const normalized = normalizeCompactTableLine(headerLine);
  if (normalized.includes('\n')) {
    const normalizedLines = normalized.split('\n');
    return isTableStart(normalizedLines, 0);
  }

  return isTableDividerLine(lines[index + 1]?.trim() ?? '');
}
