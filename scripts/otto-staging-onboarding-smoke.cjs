#!/usr/bin/env node
/**
 * Thin wrapper — delegates to @playwright/test spec (issue #733).
 * Defaults to apps/desktop/dist-app — never /Applications/otto.app or otto-staging.app.
 *
 * Run after: bun run --cwd apps/desktop app:dir
 *
 *   OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     node scripts/otto-staging-onboarding-smoke.cjs
 */
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const desktopDir = join(__dirname, '../apps/desktop');
const result = spawnSync('bunx', ['playwright', 'test', 'e2e/onboarding.spec.ts'], {
  cwd: desktopDir,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
