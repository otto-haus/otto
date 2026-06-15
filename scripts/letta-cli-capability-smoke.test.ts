import { describe, expect, spyOn, test } from 'bun:test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as runtimeCommon from '../apps/desktop/electron/runtime-transport/runtime-common';
import {
  capabilityFailure,
  formatCapabilityFailure,
  runLettaCliCapabilitySmoke,
} from './letta-cli-capability-smoke';

describe('letta-cli capability smoke helpers', () => {
  test('formatCapabilityFailure names capability and next action', () => {
    const failure = capabilityFailure(
      'discovery',
      'bundled letta.js missing',
      'Set LETTA_CLI_PATH or install Letta Desktop.',
      { cliPath: '(missing)', cliResolved: false },
    );
    const text = formatCapabilityFailure(failure);
    expect(text).toMatch(/FAIL \[discovery\]/);
    expect(text).toMatch(/Letta CLI discovery/);
    expect(text).toMatch(/bundled letta.js missing/);
    expect(text).toMatch(/LETTA_CLI_PATH/);
  });
});

describe('runLettaCliCapabilitySmoke discovery', () => {
  test('embedded mode fails clearly when bundled CLI is absent', async () => {
    const resolveCliSpy = spyOn(runtimeCommon, 'resolveCli').mockReturnValue({
      cliPath: '(bundled @letta-ai/letta-code — not found)',
      cliResolved: false,
      cliFallbackReason:
        'Embedded mode: bundled letta.js not found under app resources or node_modules. Rebuild otto.app or set LETTA_CLI_PATH.',
    });
    try {
      const result = await runLettaCliCapabilitySmoke({
        connectionMode: 'embedded',
        includeDisposableTurn: false,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.check).toBe('discovery');
        expect(result.nextAction).toMatch(/LETTA_CLI_PATH|Rebuild/);
      }
    } finally {
      resolveCliSpy.mockRestore();
    }
  });

  test('uses stub letta.js for version and help when LETTA_CLI_PATH is set', async () => {
    const dir = join(tmpdir(), `otto-cap-cli-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const stub = join(dir, 'letta-stub.js');
    writeFileSync(
      stub,
      `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes('--version')) { console.log('9.9.9 (Letta Code stub)'); process.exit(0); }
if (args.includes('--help')) { console.log('USAGE\\n  letta --new'); process.exit(0); }
console.error('unknown args'); process.exit(2);
`,
    );

    const prevCli = process.env.LETTA_CLI_PATH;
    process.env.LETTA_CLI_PATH = stub;
    try {
      const result = await runLettaCliCapabilitySmoke({
        connectionMode: 'embedded',
        includeDisposableTurn: false,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.cliPath).toBe(stub);
        expect(result.versionOutput).toMatch(/9\.9\.9/);
        expect(result.helpOutput).toMatch(/USAGE/);
        expect(existsSync(stub)).toBe(true);
      }
    } finally {
      if (prevCli === undefined) delete process.env.LETTA_CLI_PATH;
      else process.env.LETTA_CLI_PATH = prevCli;
    }
  });
});
