export type BlockKind = 'prose' | 'code' | 'table';

export type SealedMarkdownBlock = {
  kind: BlockKind;
  markdown: string;
  ordinal: number;
};

export type BlockAccumulatorSnapshot = {
  sealed: readonly SealedMarkdownBlock[];
  tail: string;
};

const TABLE_DIVIDER = /^\|[\s\-:|]+\|$/;

function isTableRowLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|', 1);
}

function isTableDividerLine(line: string): boolean {
  return TABLE_DIVIDER.test(line.trim());
}

function inferBlockKind(markdown: string): BlockKind {
  const trimmed = markdown.trim();
  if (trimmed.startsWith('```') && trimmed.endsWith('```')) return 'code';
  const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2 && isTableRowLine(lines[0]) && isTableDividerLine(lines[1])) return 'table';
  return 'prose';
}

function splitMarkdownBlocks(text: string, finalize: boolean): { sealedMarkdown: string[]; tail: string } {
  if (!text) return { sealedMarkdown: [], tail: '' };

  const lines = text.split('\n');
  const sealedMarkdown: string[] = [];
  let current: string[] = [];
  let inFence = false;
  let i = 0;

  const flushCurrent = () => {
    if (current.length === 0) return;
    sealedMarkdown.push(current.join('\n'));
    current = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (!inFence) {
        if (current.length > 0) {
          sealedMarkdown.push(current.join('\n'));
          current = [];
        }
        inFence = true;
        current.push(line);
        i += 1;
        continue;
      }

      current.push(line);
      inFence = false;
      flushCurrent();
      i += 1;
      continue;
    }

    if (inFence) {
      current.push(line);
      i += 1;
      continue;
    }

    if (trimmed === '') {
      flushCurrent();
      i += 1;
      continue;
    }

    if (current.length === 0 && isTableRowLine(line) && !isTableDividerLine(line)) {
      const divider = lines[i + 1]?.trim() ?? '';
      if (isTableDividerLine(divider)) {
        const tableLines = [line, lines[i + 1]];
        i += 2;
        while (i < lines.length) {
          const row = lines[i];
          const rowTrimmed = row.trim();
          if (!rowTrimmed) break;
          if (!isTableRowLine(row) || isTableDividerLine(row)) break;
          tableLines.push(row);
          i += 1;
        }
        sealedMarkdown.push(tableLines.join('\n'));
        continue;
      }
    }

    current.push(line);
    i += 1;
  }

  if (inFence && !finalize) {
    return { sealedMarkdown, tail: current.join('\n') };
  }

  if (finalize) {
    flushCurrent();
    return { sealedMarkdown, tail: '' };
  }

  return { sealedMarkdown, tail: current.join('\n') };
}

export function accumulateMarkdownBlocks(
  previous: BlockAccumulatorSnapshot | undefined,
  fullText: string,
  finalize = false,
): BlockAccumulatorSnapshot {
  const { sealedMarkdown, tail } = splitMarkdownBlocks(fullText, finalize);
  const sealed: SealedMarkdownBlock[] = [];

  for (let ordinal = 0; ordinal < sealedMarkdown.length; ordinal += 1) {
    const markdown = sealedMarkdown[ordinal];
    const kind = inferBlockKind(markdown);
    const prev = previous?.sealed[ordinal];
    if (prev && prev.markdown === markdown && prev.kind === kind && prev.ordinal === ordinal) {
      sealed.push(prev);
    } else {
      sealed.push({ kind, markdown, ordinal });
    }
  }

  return { sealed, tail };
}

export function hashBlockKey(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export function blockRenderKey(redactedMarkdown: string, blockKind: BlockKind, ordinal: number): string {
  return `${ordinal}:${blockKind}:${hashBlockKey(redactedMarkdown)}`;
}
