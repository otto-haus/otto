#!/usr/bin/env bun
/**
 * Offline + repo health probe for agents/CI.
 * Live renderer/runtime checks require the otto desktop app (Settings → System health
 * or IPC otto:system:health).
 */
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const human = args.has('--human') || (!args.has('--json') && process.stdout.isTTY);

const check = (
  id,
  label,
  status,
  summary,
  opts,
) => ({ id, label, status, summary, ...opts });

const overallOk = (checks) => !checks.some((c) => c.status === 'fail');

function readBuildFromEnv() {
  return {
    channel: process.env.OTTO_APP_CHANNEL ?? null,
    version: process.env.OTTO_APP_VERSION ?? null,
    shortSha: process.env.OTTO_BUILD_SHORT_SHA ?? process.env.OTTO_BUILD_SHA?.slice(0, 7) ?? null,
    branch: process.env.OTTO_BUILD_BRANCH ?? null,
    matchesMain: process.env.OTTO_BUILD_SHA && process.env.OTTO_MAIN_SHA
      ? process.env.OTTO_BUILD_SHA === process.env.OTTO_MAIN_SHA
      : null,
  };
}

function collectOfflineHealth() {
  const checks = [];

  const pkgPath = join(root, 'package.json');
  let repoName = '';
  try {
    repoName = JSON.parse(readFileSync(pkgPath, 'utf8')).name;
  } catch {
    checks.push(check('workspace', 'Workspace', 'fail', 'Cannot read package.json', {
      impact: 'Repo root may be wrong.',
      nextAction: `Run from ${root}.`,
    }));
  }

  if (repoName === 'otto') {
    checks.push(check('workspace', 'Workspace', 'ok', 'otto repo detected', { data: { root } }));
  } else if (repoName) {
    checks.push(check('workspace', 'Workspace', 'warn', `Unexpected package name: ${repoName}`, {
      nextAction: 'Confirm OTTO_HOME / cwd points at otto-haus/otto.',
    }));
  }

  const configPath = join(homedir(), '.otto', 'config.json');
  if (existsSync(configPath)) {
    try {
      JSON.parse(readFileSync(configPath, 'utf8'));
      checks.push(check('config', 'Local config', 'ok', '~/.otto/config.json readable'));
    } catch {
      checks.push(check('config', 'Local config', 'fail', 'config.json is invalid JSON', {
        impact: 'Desktop settings may fail to load.',
        nextAction: 'Repair or rename ~/.otto/config.json and relaunch.',
      }));
    }
  } else {
    checks.push(check('config', 'Local config', 'warn', 'No ~/.otto/config.json yet', {
      nextAction: 'Launch otto once to create a profile.',
    }));
  }

  const readinessScript = join(root, 'apps/desktop/scripts/gen-readiness.mjs');
  if (existsSync(readinessScript)) {
    // health:otto must be read-only: render readiness to a throwaway temp path so the
    // tracked apps/desktop/src/data/readiness.json is never mutated by a smoke run (#648).
    const probeOutput = join(tmpdir(), `otto-health-readiness-${process.pid}.json`);
    const result = spawnSync(process.execPath, [readinessScript], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        OTTO_READINESS_INCLUDE_LOCAL_CONFIG: '1',
        OTTO_READINESS_OUTPUT_PATH: probeOutput,
      },
    });
    rmSync(probeOutput, { force: true });
    if (result.status === 0) {
      checks.push(check('readiness', 'Readiness generator', 'ok', 'gen-readiness.mjs succeeded'));
    } else {
      checks.push(check('readiness', 'Readiness generator', 'fail', 'gen-readiness.mjs failed', {
        impact: 'Settings readiness panel may be stale.',
        nextAction: 'Run apps/desktop/scripts/gen-readiness.mjs and inspect stderr.',
      }));
    }
  }

  const ipcStores = [
    'letta-runner.ts',
    'memory-store.ts',
    'autonomy-store.ts',
    'routine-store.ts',
    'worker-store.ts',
    'permission-session-store.ts',
  ];
  const electronDir = join(root, 'apps/desktop/electron');
  const missingStores = ipcStores.filter((f) => !existsSync(join(electronDir, f)));
  if (missingStores.length) {
    checks.push(check('permissions', 'Permissions route', 'fail', `Missing stores: ${missingStores.join(', ')}`, {
      impact: 'Health IPC may be incomplete.',
      nextAction: 'Restore desktop electron stores from main.',
    }));
  } else {
    checks.push(check('permissions', 'Permissions route', 'ok', 'Autonomy + permission stores present'));
  }

  checks.push(
    check('renderer', 'Renderer', 'unknown', 'Requires running otto desktop', {
      impact: 'UI health not visible from CLI.',
      nextAction: 'Open otto → Settings → System health.',
    }),
    check('runtime', 'Runtime connected', 'unknown', 'Requires live Letta session', {
      impact: 'Chat readiness unknown offline.',
      nextAction: 'Connect Letta in Settings, then re-check in app.',
    }),
    check('session', 'WebSocket / session', 'unknown', 'Requires live Letta session', {
      nextAction: 'Inspect Settings → Connection after launch.',
    }),
    check('memory', 'Memory reachable', 'unknown', 'Probe needs connected runtime', {
      nextAction: 'Open Memory observatory after connecting Letta.',
    }),
    check('queue', 'Unsent queue', 'unknown', 'Queue lives in renderer localStorage', {
      nextAction: 'Inspect Chat unsent queue bar in desktop app.',
    }),
  );

  const routinesDir = join(root, 'routines');
  const routineCount = existsSync(routinesDir)
    ? readFileSync(join(root, 'apps/desktop/electron/routine-store.ts'), 'utf8').includes('RoutineStore')
      ? 'store wired'
      : 'dir only'
    : 'none';
  checks.push(check('scheduler', 'Routines / scheduler', 'ok', `Routine store ${routineCount}`, {
    data: { routinesDir: existsSync(routinesDir) },
  }));

  checks.push(check('background', 'Background work / dreams', 'unknown', 'Worker/run state requires desktop IPC', {
    nextAction: 'Check Workers + Runs surfaces after launch.',
  }));

  const build = readBuildFromEnv();
  checks.push(check('build', 'Build / channel marker', build.shortSha ? 'ok' : 'warn',
    build.shortSha ? `${build.channel ?? 'dev'} · v${build.version ?? '?'} · ${build.shortSha}` : 'No OTTO_BUILD_* env — dev checkout',
    {
      nextAction: build.shortSha ? undefined : 'Set OTTO_BUILD_* during staging/release packaging.',
      data: build,
    },
  ));

  return {
    ok: overallOk(checks),
    checkedAt: new Date().toISOString(),
    scope: 'offline',
    build,
    checks,
  };
}

function formatHuman(report) {
  const lines = [
    `otto health · ${report.scope} · ${report.ok ? 'OK' : 'NOT OK'} · ${report.checkedAt}`,
    '',
  ];
  for (const c of report.checks) {
    lines.push(`[${c.status.toUpperCase()}] ${c.label}: ${c.summary}`);
    if (c.impact) lines.push(`  impact: ${c.impact}`);
    if (c.nextAction) lines.push(`  next: ${c.nextAction}`);
  }
  lines.push('');
  lines.push('Live checks: launch otto desktop → Settings → System health.');
  return lines.join('\n');
}

const report = collectOfflineHealth();
if (human) {
  console.log(formatHuman(report));
} else {
  console.log(JSON.stringify(report, null, 2));
}
process.exit(report.ok ? 0 : 1);
