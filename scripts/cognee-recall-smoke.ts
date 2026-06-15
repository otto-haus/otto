#!/usr/bin/env bun
/**
 * Issue #68 / 042 — Cognee MCP recall bridge smoke.
 * Never uses conversation=default. Writes receipts/cognee/recall/*.json when recall succeeds.
 *
 *   OTTO_COGNEE_ENABLED=1 task smoke:cognee-recall
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CogneeStore } from '../apps/desktop/electron/cognee-store';

process.env.OTTO_SMOKE = '1';
const repoRoot = join(import.meta.dir, '..');
process.env.OTTO_ROOT = process.env.OTTO_ROOT ?? repoRoot;

const stagingDir = join(repoRoot, 'docs/receipts/staging');
const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

type McpProbe = {
  url: string;
  reachable: boolean;
  note: string;
};

function probeMcpHttp(baseUrl = process.env.OTTO_COGNEE_MCP_URL ?? 'http://127.0.0.1:8001/mcp'): McpProbe {
  const curl = spawnSync('curl', ['-fsS', '--max-time', '3', '-o', '/dev/null', '-w', '%{http_code}', baseUrl], {
    encoding: 'utf8',
  });
  const code = `${curl.stdout ?? ''}`.trim();
  if (curl.status === 0 && code) {
    return { url: baseUrl, reachable: true, note: `HTTP ${code}` };
  }
  return {
    url: baseUrl,
    reachable: false,
    note: curl.stderr?.trim() || 'MCP endpoint not reachable (start cognee-cli -ui for :8001)',
  };
}

function latestRecallReceipt(): string | null {
  const dir = join(repoRoot, 'receipts/cognee/recall');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a));
  return files[0] ? join(dir, files[0]) : null;
}

function runUnitProof(): { ok: boolean; output: string } {
  const result = spawnSync(
    'bun',
    [
      'test',
      'apps/desktop/electron/cognee-store.test.ts',
      '--test-name-pattern',
      'recall smoke returns path-backed citations',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

function writeStagingReceipt(payload: Record<string, unknown>): string {
  mkdirSync(stagingDir, { recursive: true });
  const path = join(stagingDir, `cognee-recall-smoke-${runId}.json`);
  writeFileSync(
    path,
    `${JSON.stringify({ id: runId, ticket: '042-cognee-mcp-recall-bridge', at: new Date().toISOString(), ...payload }, null, 2)}\n`,
    'utf8',
  );
  return path;
}

function main() {
  const prevEnabled = process.env.OTTO_COGNEE_ENABLED;
  delete process.env.OTTO_COGNEE_ENABLED;

  const disabled = new CogneeStore().recallSmoke('otto receipt precedent');
  if (disabled.ok || !disabled.error?.includes('disabled')) {
    console.error('FAIL: expected fail-closed recall when OTTO_COGNEE_ENABLED is off');
    process.exit(1);
  }
  console.log('PASS disabled fail-closed');

  process.env.OTTO_COGNEE_ENABLED = '1';

  const capture = spawnSync('bash', ['scripts/cognee-capture.sh', '--kinds', 'receipt,precedent', '--apply'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  });
  const captureOk = capture.status === 0;

  const health = new CogneeStore().health();
  const mcp = probeMcpHttp();
  const query = 'otto receipt precedent';
  const recall = new CogneeStore().recallSmoke(query);
  const unitProof = runUnitProof();
  const recallReceiptPath = recall.ok ? latestRecallReceipt() : null;

  const liveReady = health.status === 'ready';
  const stagingPath = writeStagingReceipt({
    health,
    mcp,
    captureApply: { ok: captureOk, exit: capture.status ?? 1 },
    recall: {
      ok: recall.ok,
      query: recall.query,
      citationCount: recall.citations.length,
      citations: recall.citations.map((c) => c.path),
      error: recall.error,
      receiptPath: recallReceiptPath,
    },
    unitProof: { ok: unitProof.ok },
    conversation: 'none — smoke script only; never conversation=default',
  });

  if (prevEnabled !== undefined) process.env.OTTO_COGNEE_ENABLED = prevEnabled;
  else delete process.env.OTTO_COGNEE_ENABLED;

  console.log(`Wrote staging receipt ${stagingPath}`);

  if (recall.ok && recallReceiptPath) {
    console.log(`PASS recall smoke → ${recallReceiptPath}`);
    console.log(`MCP probe: ${mcp.reachable ? 'reachable' : 'not reachable'} (${mcp.note})`);
    process.exit(0);
  }

  if (unitProof.ok && !liveReady) {
    console.log('SKIP live recall: Cognee not ready on loopback; path-backed unit proof passed');
    console.log(`Health: ${health.status} — ${health.lastError ?? 'n/a'}`);
    console.log(`Recall error: ${recall.error ?? 'n/a'}`);
    process.exit(0);
  }

  console.error('FAIL cognee recall smoke');
  console.error(recall.error ?? 'unknown');
  if (!unitProof.ok) console.error(unitProof.output);
  process.exit(1);
}

main();
