#!/usr/bin/env node
/**
 * Turn trail visual receipt — fixture HTML for #665/#666 acceptance when live Letta unavailable.
 *
 *   node apps/desktop/scripts/capture-turn-trail-receipt.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

const liveSpans = [
  'Reasoned',
  'Read turn-trail.ts',
  'Searched for TurnTrail',
  'Editing Chat.tsx…',
];
const collapsed = 'Explored 3 files · 3.2s';
const expanded = [
  'Reasoned (400ms)',
  'Read turn-trail.ts (800ms)',
  'Searched for TurnTrail (2.0s)',
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>otto turn trail fixture</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f6f4ef; color: #1a1a1a; padding: 24px; }
  .panel { background: #fff; border: 1px solid #e5e0d6; border-radius: 12px; padding: 16px; margin-bottom: 16px; max-width: 520px; }
  h2 { margin: 0 0 8px; font-size: 14px; }
  .turnTrailLive { list-style: none; margin: 0; padding: 0; }
  .turnTrailLive__step { color: #8a8478; font-size: 13px; }
  .turnTrailLive__step--latest { color: #4a463c; font-weight: 600; }
  .turnTrailSummary__toggle { border: 0; background: #efeae0; color: #6a6458; font-size: 12px; padding: 4px 8px; border-radius: 6px; }
  .turnTrailSummary__list { margin: 8px 0 0; padding-left: 18px; font-size: 12px; color: #8a8478; }
</style>
</head>
<body>
  <div class="panel">
    <h2>#665 — TurnTrailLive (≥3 steps)</h2>
    <ol class="turnTrailLive" aria-live="polite">
      ${liveSpans.map((label, i) => `<li class="turnTrailLive__step${i === liveSpans.length - 1 ? ' turnTrailLive__step--latest' : ''}">${label}</li>`).join('')}
    </ol>
  </div>
  <div class="panel">
    <h2>#666 — TurnTrailSummary (collapsed + expanded)</h2>
    <button type="button" class="turnTrailSummary__toggle">${collapsed}</button>
    <ol class="turnTrailSummary__list">
      ${expanded.map((line) => `<li>${line}</li>`).join('')}
    </ol>
  </div>
</body>
</html>`;

mkdirSync(RECEIPT_DIR, { recursive: true });
const htmlPath = join(RECEIPT_DIR, `664-turn-trail-fixture-${RUN_ID}.html`);
writeFileSync(htmlPath, html);

let gitHead = 'unknown';
try {
  gitHead = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch { /* ignore */ }

const mdPath = join(RECEIPT_DIR, `664-turn-trail-receipt-${RUN_ID}.md`);
writeFileSync(mdPath, `# Agent turn trail staging receipt

- **At:** ${new Date().toISOString()}
- **Branch:** feat/agent-turn-trail
- **HEAD:** ${gitHead}

## Screenshots / fixtures

- Live strip fixture (≥3 steps): \`${htmlPath}\` (#665)
- Collapsed chip fixture: same HTML (#666)

## Verify

\`\`\`sh
bun test apps/desktop/src/chat/turn-trail.test.ts
bun test apps/desktop/src/chat/turn-trail-summary.test.ts
bun test apps/desktop/electron/runtime-transport/ws-protocol.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
\`\`\`
`);

console.log(JSON.stringify({ ok: true, htmlPath, mdPath, gitHead }, null, 2));
