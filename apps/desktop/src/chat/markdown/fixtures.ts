export const GFM_TABLE_STREAM = [
  '| Area | Pass condition |',
  '|---|---|',
  '| Chat | Renders tables |',
  '',
  'Done.',
].join('\n');

export const OPEN_FENCE_CHUNKS = [
  'Intro paragraph.',
  '\n\n',
  '```ts',
  '\nconst x = 1;',
  '\nconst y = 2;',
];

export const NESTED_LIST_STREAM = [
  '- Parent item',
  '\n  - Child one',
  '\n  - Child two',
  '\n- Sibling',
  '\n\n',
  'After list.',
];

export const SECRET_REDACTION_SAMPLE = [
  'Use key=sk-live-abcdefghijklmnopqrstuvwxyz carefully.',
  '\n\n',
  'Auth: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
].join('');

export const LOCAL_PATH_REDACTION_SAMPLE = 'See /Users/seb/.otto/attachments/a.png for details.';

export const ACTIVITY_BETWEEN_BLOCKS_STREAM = [
  '# Summary',
  '\n\n',
  'First sealed block.',
  '\n\n',
  'Second sealed block after activity gap.',
];

export function buildHugeStreamChunks(chunkCount = 10_000, chunkSize = 8): string[] {
  const chunks: string[] = ['# Huge response\n\n'];
  for (let i = 0; i < chunkCount; i += 1) {
    chunks.push(`token-${i} `.repeat(chunkSize / 8).trimEnd());
    if (i % 40 === 39) chunks.push('\n\n');
    else chunks.push(' ');
  }
  return chunks;
}

export function appendChunks(chunks: string[]): string {
  return chunks.reduce((acc, chunk) => acc + chunk, '');
}
