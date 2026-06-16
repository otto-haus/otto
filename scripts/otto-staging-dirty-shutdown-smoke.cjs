#!/usr/bin/env node
/**
 * Staging smoke — force-quit → relaunch → dirty warning → safe reset (#576).
 * Uses disposable dist-app bundle; never /Applications/otto.app.
 *
 *   bun run --cwd apps/desktop app:dir
 *   OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging node scripts/otto-staging-dirty-shutdown-smoke.cjs
 */
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const desktopDir = join(__dirname, '../apps/desktop');
const result = spawnSync('bunx', ['playwright', 'test', 'e2e/dirty-shutdown.spec.ts'], {
  cwd: desktopDir,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
