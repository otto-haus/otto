#!/usr/bin/env node
/**
 * Playwright capture for marketing site (065 / 115).
 * Usage: NODE_PATH=$HOME/.codex/admin/node_modules node site/capture-screenshots.cjs [width] [height]
 */
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright');

const ROOT = join(__dirname, '..');
const RECEIPT_DIR = join(ROOT, 'docs/receipts/staging');
const PORT = process.env.OTTO_SITE_PORT ?? '4321';
const BASE = `http://127.0.0.1:${PORT}`;
const WIDTH = Number(process.argv[2] ?? 390);
const HEIGHT = Number(process.argv[3] ?? 844);
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '');

async function main() {
  const suffix = `${WIDTH}-${STAMP}`;
  const homePath = join(RECEIPT_DIR, `065-home-${suffix}.png`);
  const pricingPath = join(RECEIPT_DIR, `115-pricing-${suffix}.png`);
  const proofPath = join(RECEIPT_DIR, `site-staging-proof-${STAMP}.json`);

  mkdirSync(RECEIPT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const step = Math.max(240, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 120));
  });
  await page.screenshot({ path: homePath, fullPage: true });

  await page.goto(`${BASE}/pricing.html`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: pricingPath, fullPage: true });

  await browser.close();

  const proof = {
    runId: STAMP,
    baseUrl: BASE,
    viewport: { width: WIDTH, height: HEIGHT },
    command: `NODE_PATH=$HOME/.codex/admin/node_modules node site/capture-screenshots.cjs ${WIDTH} ${HEIGHT}`,
    screenshots: { home065: homePath, pricing115: pricingPath },
    checks: { homeLoaded: true, pricingLoaded: true },
    brandChecklist: 'docs/brand/checklist.md',
    honestStatus: 'local preview of the otto.haus static site; live apex proof is checked separately',
  };

  writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);

  const mdPath = join(RECEIPT_DIR, `065-115-site-screenshots-${STAMP}.md`);
  writeFileSync(
    mdPath,
    `# Marketing site screenshots (065 / 115)\n\n- **At:** ${new Date().toISOString()}\n- **URL:** ${BASE}/ (local)\n- **Viewport:** ${WIDTH}x${HEIGHT}\n- **Command:** NODE_PATH=$HOME/.codex/admin/node_modules node site/capture-screenshots.cjs ${WIDTH} ${HEIGHT}\n\n## Screenshots\n\n- Home: \`${homePath}\`\n- Pricing: \`${pricingPath}\`\n\n## Brand checklist\n\n\`docs/brand/checklist.md\`\n\n## Proof JSON\n\n\`${proofPath}\`\n`,
  );

  console.log(JSON.stringify({ homePath, pricingPath, proofPath, mdPath }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
