#!/usr/bin/env node
/**
 * Issue #305 — read-only release metadata smoke.
 * Never installs or mutates /Applications/otto.app.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_APP,
  DEFAULT_REPO,
  evaluateReleaseMetadata,
  fetchLatestRelease,
  readInstalledMetadata,
} from './lib/otto-release-metadata.mjs';

const repo = process.env.OTTO_RELEASE_REPO ?? DEFAULT_REPO;
const appPath = process.env.OTTO_APP ?? DEFAULT_APP;
const requireInstalled = process.env.OTTO_RELEASE_REQUIRE_INSTALLED === '1';
const receiptBase = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const runId = process.env.OTTO_RELEASE_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const receiptDir = join(receiptBase, `305-release-metadata-${runId}`);

async function main() {
  const release = await fetchLatestRelease(repo);
  const installed = readInstalledMetadata(appPath);
  const result = evaluateReleaseMetadata({ release, installed, requireInstalled });

  mkdirSync(receiptDir, { recursive: true });
  const proof = {
    ok: result.ok,
    issue: 305,
    runId,
    repo,
    appPath,
    requireInstalled,
    checks: result.checks,
    warnings: result.warnings,
    release: {
      tag: release.tag,
      name: release.name,
      publishedAt: release.publishedAt,
      desktopAsset: result.desktopAsset,
      assets: release.assets.map((a) => a.name),
    },
    installed,
    receiptDir,
  };

  writeFileSync(join(receiptDir, 'proof.json'), `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify(proof, null, 2));

  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
