#!/usr/bin/env bun
/**
 * Issue #298 — permission/tool-call round-trip smoke.
 * Disposable OTTO_HOME; never uses conversation=default or installed app bundles.
 *
 *   bun scripts/permission-round-trip-smoke.ts
 *   task smoke:permission
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const smokeHome = mkdtempSync(join(tmpdir(), 'otto-perm-smoke-'));
process.env.OTTO_HOME = smokeHome;
process.env.OTTO_SMOKE = '1';
process.env.OTTO_SKIP_LETTA_LSOF = '1';
process.env.OTTO_AGENT_ID = 'agent-perm-smoke-298';

const testFile = 'apps/desktop/electron/runtime-transport/permission-round-trip.test.ts';

const result = spawnSync('bun', ['test', testFile], {
  cwd: join(import.meta.dir, '..'),
  env: process.env,
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error(`
BROKEN: permission tool-call round-trip (#298)
Capability: canUseTool → otto:permission → allow/deny/session/timeout/abort
Likely fix area: apps/desktop/electron/runtime-transport/sdk-subprocess-transport.ts
Next action: read failing assertions in ${testFile}; rerun with:
  bun test ${testFile}
`);
  process.exit(result.status ?? 1);
}

console.log(`permission round-trip smoke OK (disposable OTTO_HOME=${smokeHome})`);
