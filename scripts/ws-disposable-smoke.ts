#!/usr/bin/env bun
/**
 * Disposable Otto WS transport smoke — never uses conversation=default.
 * Writes trace JSONL under OTTO_HOME/runs and receipt under OTTO_HOME/receipts.
 *
 *   OTTO_SMOKE=1 OTTO_AGENT_ID=<agent> bun scripts/ws-disposable-smoke.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { BrowserWindow } from 'electron';
import { ConfigStore } from '../apps/desktop/electron/config-store';
import { WsRuntimeTransport } from '../apps/desktop/electron/runtime-transport/ws-runtime-transport';
import { runsDir } from '../apps/desktop/electron/trace-writer';

process.env.OTTO_SMOKE = '1';
process.env.OTTO_SKIP_LETTA_LSOF = '1';
if (!process.env.LETTA_CLI_PATH) {
  process.env.LETTA_CLI_PATH =
    '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';
}

const RECEIPT_DIR = join(process.cwd(), 'docs/receipts/staging');
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const USER_OTTO_HOME = join(homedir(), '.otto');

/** Read secrets from the real otto home before disposable OTTO_HOME overrides secret-store paths. */
function hydrateFromUserHome(): void {
  const secretsPath = join(USER_OTTO_HOME, 'secrets.env');
  if (!process.env.LETTA_API_KEY && existsSync(secretsPath)) {
    for (const line of readFileSync(secretsPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      if (trimmed.slice(0, eq) === 'LETTA_API_KEY') {
        process.env.LETTA_API_KEY = trimmed.slice(eq + 1);
        break;
      }
    }
  }
  if (!process.env.OTTO_AGENT_ID && !process.env.LETTA_AGENT_ID) {
    const configPath = join(USER_OTTO_HOME, 'config.json');
    if (existsSync(configPath)) {
      try {
        const cfg = JSON.parse(readFileSync(configPath, 'utf8')) as { agentId?: string };
        if (cfg.agentId) process.env.OTTO_AGENT_ID = cfg.agentId;
      } catch {
        // ignore malformed config
      }
    }
  }
}

function hasApiKey(): boolean {
  return Boolean(process.env.LETTA_API_KEY?.trim());
}

function mockWindow() {
  const events: unknown[] = [];
  return {
    win: {
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => false,
        send(_channel: string, payload: unknown) {
          events.push(payload);
        },
      },
    } as unknown as BrowserWindow,
    events,
  };
}

async function main() {
  hydrateFromUserHome();

  const agentId = process.env.OTTO_AGENT_ID ?? process.env.LETTA_AGENT_ID;
  if (!agentId) {
    console.error('Set OTTO_AGENT_ID or LETTA_AGENT_ID');
    process.exit(1);
  }

  if (!hasApiKey()) {
    const blocker = {
      schema: 'otto.ws-disposable-smoke-blocker.v1',
      runId: RUN_ID,
      blocker: 'LETTA_API_KEY absent',
      hasApiKey: false,
      agentId,
      userOttoHome: USER_OTTO_HOME,
      notes: [
        'Set LETTA_API_KEY in env or ~/.otto/secrets.env before live WS smoke.',
        'Default transport remains sdk until promotion scorecard passes.',
      ],
    };
    writeProof(blocker);
    console.error(JSON.stringify(blocker, null, 2));
    process.exit(1);
  }

  const smokeHome = process.env.OTTO_HOME ?? join('/tmp', `otto-ws-smoke-${RUN_ID}`);
  process.env.OTTO_HOME = smokeHome;
  mkdirSync(smokeHome, { recursive: true });
  mkdirSync(RECEIPT_DIR, { recursive: true });

  const config = new ConfigStore();
  config.update({ agentId, conversationId: null });

  const { win, events } = mockWindow();
  const transport = new WsRuntimeTransport(() => win, config);

  const started = Date.now();
  const initStatus = await transport.init({ freshConversation: true });
  const initMs = Date.now() - started;

  const proof = {
    schema: 'otto.ws-disposable-smoke.v1',
    runId: RUN_ID,
    agentId,
    ottoHome: smokeHome,
    initMs,
    initStatus,
    sendMs: null as number | null,
    conversationId: initStatus.conversationId ?? null,
    tracePaths: [] as string[],
    receiptDir: join(smokeHome, 'receipts'),
    runsDir: runsDir(),
    ok: false,
    notes: [] as string[],
  };

  if (!initStatus.ready) {
    proof.notes.push(`init failed: ${initStatus.reason}`);
    writeProof(proof);
    process.exit(1);
  }

  if (initStatus.conversationId === 'default') {
    proof.notes.push('refused: conversation=default');
    writeProof(proof);
    process.exit(1);
  }

  const sendStarted = Date.now();
  await transport.send('Reply exactly: OTTO_SMOKE_OK');
  proof.sendMs = Date.now() - sendStarted;

  const traceFiles = [...new Set(events.flatMap((e) => {
    const rec = e as { message?: { type?: string } };
    return [];
  }))];

  // Collect newest trace from runs dir
  const { readdirSync, statSync } = await import('node:fs');
  const runs = runsDir();
  const jsonl = readdirSync(runs)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ f, m: statSync(join(runs, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)
    .slice(0, 3)
    .map(({ f }) => join(runs, f));
  proof.tracePaths = jsonl;

  proof.ok = initStatus.ready && initStatus.conversationId !== 'default' && proof.sendMs !== null;
  writeProof(proof);
  await transport.close();

  console.log(JSON.stringify(proof, null, 2));
  process.exit(proof.ok ? 0 : 1);
}

function writeProof(proof: Record<string, unknown>) {
  const out = join(RECEIPT_DIR, `039-ws-disposable-smoke-${RUN_ID}.json`);
  writeFileSync(out, `${JSON.stringify(proof, null, 2)}\n`);
  console.error(`Wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
