#!/usr/bin/env node
/**
 * 026 — 16px silhouette contact sheet from canonical iconography PNGs.
 * Output: docs/receipts/staging/026-icon-16px-grid.png
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ICON_DIR =
  process.env.OTTO_ICON_DIR ??
  '/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/iconography';
const OUT = join(ROOT, 'docs/receipts/staging/026-icon-16px-grid.png');
const META = join(ROOT, 'docs/receipts/staging/026-icon-16px-grid.md');

const ORDER = [
  ['9f655027-49c9-4123-aed6-e912eb4cfc61', 'chat'],
  ['838c22f8-a932-4d9e-99b9-e3693dbaad55', 'charter'],
  ['d74aa7ab-2092-4586-a2be-8f5811478876', 'standards'],
  ['bba82017-3d22-4001-ab06-535c4d3b132e', 'practices'],
  ['eadaa5fe-2d6c-491a-80a8-453757e4d021', 'routines'],
  ['7138b411-7861-48f2-a1d8-09fbf3747d23', 'curation'],
  ['c2494639-0eb5-4d24-8792-83d73072c728', 'receipts'],
  ['5e95bdc6-32dd-4890-97f3-08658e4f00b0', 'autonomy'],
  ['77513e3b-eb58-4c7c-808a-1abdfd1e3718', 'settings'],
  ['fe9ae131-31c5-4e33-b9c1-cc0d2629d567', 'owl'],
  ['af798576-1263-4a2f-aafa-43e6ca6fdf77', 'plus'],
  ['8787d7c9-cc66-4943-87dd-e6ce8c3942d0', 'panel'],
  ['a70b7358-fcc5-49d6-9849-78e573a7846b', 'theme'],
  ['8d20715a-f60d-4102-bda2-f5d0df9a81bc', 'send'],
];

const COLS = 7;
const ICON = 16;
const PAD = 8;
const CELL = ICON + PAD * 2;

const tmp = mkdtempSync(join(tmpdir(), 'otto-16px-'));
const cells = ORDER.map(([uuid, label], i) => {
  const src = join(ICON_DIR, `${uuid}.png`);
  const cell = join(tmp, `${String(i).padStart(2, '0')}-${label}.png`);
  execFileSync(
    'magick',
    [
      '-size', `${CELL}x${CELL}`, 'xc:#f8f7f2',
      src, '-resize', `${ICON}x${ICON}`,
      '-gravity', 'center', '-composite',
      cell,
    ],
    { stdio: 'pipe' },
  );
  return cell;
});

const rows = [];
for (let r = 0; r < Math.ceil(cells.length / COLS); r++) {
  const slice = cells.slice(r * COLS, (r + 1) * COLS);
  const row = join(tmp, `row-${r}.png`);
  execFileSync('magick', [...slice, '+append', row], { stdio: 'pipe' });
  rows.push(row);
}

mkdirSync(dirname(OUT), { recursive: true });
execFileSync('magick', [...rows, '-append', OUT], { stdio: 'inherit' });

writeFileSync(
  META,
  `# 026 icon 16px grid

- **Output:** \`${OUT}\`
- **Source:** Dropbox \`iconography/*.png\` (14 canonical PNGs; traced to \`icon-art.ts\`)
- **Render:** each icon resized to ${ICON}px on warm paper cell (${CELL}px)
- **Command:** \`node scripts/export-icon-16px-grid.mjs\`

## Icons (row-major)

${ORDER.map(([, label], i) => `${i + 1}. ${label}`).join('\n')}
`,
);

rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${OUT} (${ORDER.length} icons @ ${ICON}px)`);
