#!/usr/bin/env bun
/**
 * Letta CLI capability smoke (#295) — disposable/local-isolated; never conversation=default.
 *
 *   task smoke:letta-cli
 *   OTTO_CONNECTION_MODE=existing task smoke:letta-cli
 *   LETTA_AGENT_ID=<id> task smoke:letta-cli   # adds disposable --new turn (opt-in)
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveCli,
  type CliResolution,
  type ConnectionMode,
} from '../apps/desktop/electron/runtime-transport/runtime-common';

export type CapabilityCheck = 'discovery' | 'version' | 'help' | 'disposable_turn';

export type CapabilityFailure = {
  ok: false;
  check: CapabilityCheck;
  capability: string;
  detail: string;
  nextAction: string;
  cli?: CliResolution;
};

export type CapabilitySuccess = {
  ok: true;
  connectionMode: ConnectionMode;
  cliPath: string;
  versionOutput: string;
  helpOutput: string;
  disposableTurn?: { agentId: string; outputSnippet: string };
};

export type CapabilityResult = CapabilityFailure | CapabilitySuccess;

const CHECK_LABELS: Record<CapabilityCheck, string> = {
  discovery: 'Letta CLI discovery (resolveCli)',
  version: 'Letta CLI version invocation',
  help: 'Letta CLI help invocation',
  disposable_turn: 'Letta CLI disposable agent turn',
};

export function capabilityFailure(
  check: CapabilityCheck,
  detail: string,
  nextAction: string,
  cli?: CliResolution,
): CapabilityFailure {
  return {
    ok: false,
    check,
    capability: CHECK_LABELS[check],
    detail,
    nextAction,
    cli,
  };
}

export function formatCapabilityFailure(failure: CapabilityFailure): string {
  const lines = [
    `FAIL [${failure.check}]: ${failure.capability}`,
    `  detail: ${failure.detail}`,
    `  next: ${failure.nextAction}`,
  ];
  if (failure.cli) {
    lines.push(`  cliPath: ${failure.cli.cliPath}`);
    if (failure.cli.cliFallbackReason) lines.push(`  fallback: ${failure.cli.cliFallbackReason}`);
  }
  return lines.join('\n');
}

function connectionModeFromEnv(): ConnectionMode {
  const raw = process.env.OTTO_CONNECTION_MODE?.trim();
  if (raw === 'embedded' || raw === 'existing' || raw === 'cloud') return raw;
  return 'existing';
}

function runNodeCli(cliPath: string, args: string[], timeoutMs = 30_000) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  });
}

export async function runLettaCliCapabilitySmoke(options?: {
  connectionMode?: ConnectionMode;
  agentId?: string | null;
  includeDisposableTurn?: boolean;
}): Promise<CapabilityResult> {
  const connectionMode = options?.connectionMode ?? connectionModeFromEnv();
  const cli = resolveCli(connectionMode);

  if (!cli.cliResolved) {
    return capabilityFailure(
      'discovery',
      cli.cliFallbackReason ?? `resolveCli('${connectionMode}') did not find letta.js`,
      connectionMode === 'embedded'
        ? 'Rebuild otto with @letta-ai/letta-code bundled, or set LETTA_CLI_PATH to a letta.js binary.'
        : 'Install Letta Desktop, set LETTA_CLI_PATH, or switch OTTO_CONNECTION_MODE=embedded with a packaged app.',
      cli,
    );
  }

  const version = runNodeCli(cli.cliPath, ['--version']);
  if (version.status !== 0) {
    return capabilityFailure(
      'version',
      (version.stderr || version.stdout || 'no output').trim().slice(0, 400),
      'Verify letta.js is executable (node ELECTRON_RUN_AS_NODE) and matches your Letta Desktop install.',
      cli,
    );
  }
  const versionOutput = (version.stdout || version.stderr || '').trim();
  if (!versionOutput) {
    return capabilityFailure(
      'version',
      'CLI exited 0 but produced no version text',
      'Reinstall Letta Desktop or point LETTA_CLI_PATH at a working letta.js build.',
      cli,
    );
  }

  const help = runNodeCli(cli.cliPath, ['--help']);
  if (help.status !== 0) {
    return capabilityFailure(
      'help',
      (help.stderr || help.stdout || 'no output').trim().slice(0, 400),
      'Run `node <letta.js> --help` manually; fix PATH/node or reinstall Letta Desktop.',
      cli,
    );
  }
  const helpOutput = (help.stdout || help.stderr || '').trim();
  if (!/USAGE/i.test(helpOutput)) {
    return capabilityFailure(
      'help',
      'Help output missing USAGE section',
      'Confirm letta.js is Letta Code (not a stale path); set LETTA_CLI_PATH explicitly if needed.',
      cli,
    );
  }

  const agentId = options?.agentId ?? process.env.LETTA_AGENT_ID ?? process.env.OTTO_AGENT_ID ?? null;
  const includeDisposableTurn =
    options?.includeDisposableTurn ?? (options?.agentId !== undefined ? true : Boolean(agentId));

  let disposableTurn: CapabilitySuccess['disposableTurn'];
  if (includeDisposableTurn && agentId) {
    const turn = runNodeCli(
      cli.cliPath,
      [
        '--agent',
        agentId,
        '--new',
        '--no-memfs',
        '--no-skills',
        '--no-system-info-reminder',
        '-p',
        'Reply exactly: OTTO_SMOKE_OK',
        '--output-format',
        'json',
      ],
      120_000,
    );
    if (turn.status !== 0) {
      return capabilityFailure(
        'disposable_turn',
        (turn.stderr || turn.stdout || 'no output').trim().slice(0, 400),
        'Ensure local Letta backend is running, agent id is valid, and provider keys are configured in Letta — not otto.',
        cli,
      );
    }
    const snippet = (turn.stdout || turn.stderr || '').trim().slice(0, 400);
    if (!/OTTO_SMOKE_OK/i.test(snippet)) {
      return capabilityFailure(
        'disposable_turn',
        `Disposable turn completed but response did not include OTTO_SMOKE_OK. snippet=${snippet}`,
        'Check agent model/provider in Letta; rerun with LETTA_AGENT_ID set to a healthy local agent.',
        cli,
      );
    }
    disposableTurn = { agentId, outputSnippet: snippet };
  }

  return {
    ok: true,
    connectionMode,
    cliPath: cli.cliPath,
    versionOutput,
    helpOutput: helpOutput.split('\n').slice(0, 8).join('\n'),
    disposableTurn,
  };
}

async function main() {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const receiptDir = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
  mkdirSync(receiptDir, { recursive: true });

  const result = await runLettaCliCapabilitySmoke();
  const receiptPath = join(receiptDir, `295-letta-cli-capability-${runId}.json`);
  writeFileSync(receiptPath, `${JSON.stringify({ schema: 'otto.letta-cli-capability.v1', runId, ...result }, null, 2)}\n`);

  if (!result.ok) {
    console.error(formatCapabilityFailure(result));
    console.error(`Receipt: ${receiptPath}`);
    process.exit(1);
  }

  console.log('PASS: Letta CLI capability smoke');
  console.log(`  mode=${result.connectionMode}`);
  console.log(`  cli=${result.cliPath}`);
  console.log(`  version=${result.versionOutput}`);
  if (result.disposableTurn) {
    console.log(`  disposable_turn=ok agent=${result.disposableTurn.agentId}`);
  } else {
    console.log('  disposable_turn=skipped (set LETTA_AGENT_ID for opt-in turn proof)');
  }
  console.log(`Receipt: ${receiptPath}`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
