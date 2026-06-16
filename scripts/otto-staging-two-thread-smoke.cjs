#!/usr/bin/env node
/**
 * Thin wrapper — delegates to @playwright/test spec (issue #733).
 * Never uses /Applications/otto.app.
 *
 *   bash apps/desktop/scripts/deploy-staging.sh
 *   OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
 *     node scripts/otto-staging-two-thread-smoke.cjs
 */
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const desktopDir = join(__dirname, '../apps/desktop');
const result = spawnSync('bunx', ['playwright', 'test', 'e2e/two-thread.spec.ts'], {
  cwd: desktopDir,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
