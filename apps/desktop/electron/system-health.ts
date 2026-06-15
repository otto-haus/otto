import type { BrowserWindow } from 'electron';
import type { ConfigStore } from './config-store';
import type { LettaRunner } from './letta-runner';
import type { MemoryStore } from './memory-store';
import type { AutonomyStore } from './autonomy-store';
import type { RoutineStore } from './routine-store';
import type { WorkerStore } from './worker-store';
import type { RunStore } from './run-store';
import type { HealthCheck, HealthCheckStatus, SystemHealthReport } from './shared/types';
import { readAppBuildInfo } from './build-info';
import { getLabsConfig } from './labs-config';
import { permissionSessionStore } from './permission-session-store';

export type { HealthCheck, HealthCheckStatus, SystemHealthReport };

type QueueSnapshot = { queued: number; failed: number; sending: number; total: number };

export interface SystemHealthDeps {
  win?: BrowserWindow | null;
  runner: Pick<LettaRunner, 'getStatus'>;
  config: ConfigStore;
  memory: MemoryStore;
  autonomy: AutonomyStore;
  routines: RoutineStore;
  workers: WorkerStore;
  runs: RunStore;
}

const check = (
  id: string,
  label: string,
  status: HealthCheckStatus,
  summary: string,
  opts?: { impact?: string; nextAction?: string; data?: Record<string, unknown> },
): HealthCheck => ({
  id,
  label,
  status,
  summary,
  impact: opts?.impact,
  nextAction: opts?.nextAction,
  data: opts?.data,
});

const overallOk = (checks: HealthCheck[]): boolean => !checks.some((c) => c.status === 'fail');

async function readQueueSnapshot(win?: BrowserWindow | null): Promise<QueueSnapshot | null> {
  if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return null;
  try {
    const raw = await win.webContents.executeJavaScript(
      `(() => {
        try {
          const STALE_MS = ${10 * 60 * 1000};
          const raw = localStorage.getItem('otto.chat.queue.v3');
          const inflightRaw = localStorage.getItem('otto.chat.inflight.v1');
          const parsed = raw ? JSON.parse(raw) : [];
          const list = Array.isArray(parsed) ? parsed : [];
          const queued = list.filter((i) => i && i.state === 'queued').length;
          const failedStored = list.filter((i) => i && i.state === 'failed').length;
          let inflightActive = 0;
          let inflightFailed = 0;
          try {
            const inflight = inflightRaw ? JSON.parse(inflightRaw) : null;
            if (inflight && typeof inflight.id === 'string') {
              const createdAt = typeof inflight.createdAt === 'number' ? inflight.createdAt : Date.now();
              if (Date.now() - createdAt > STALE_MS) inflightFailed = 1;
              else inflightActive = 1;
            }
          } catch {}
          const failed = failedStored + inflightFailed;
          const sending = inflightActive;
          return { queued, failed, sending, total: list.length + inflightActive + inflightFailed };
        } catch {
          return { queued: 0, failed: 0, sending: 0, total: 0, error: true };
        }
      })()`,
      true,
    );
    if (!raw || typeof raw !== 'object') return null;
    const snap = raw as Record<string, unknown>;
    return {
      queued: typeof snap.queued === 'number' ? snap.queued : 0,
      failed: typeof snap.failed === 'number' ? snap.failed : 0,
      sending: typeof snap.sending === 'number' ? snap.sending : 0,
      total: typeof snap.total === 'number' ? snap.total : 0,
    };
  } catch {
    return null;
  }
}

function rendererCheck(win?: BrowserWindow | null): HealthCheck {
  if (!win) {
    return check('renderer', 'Renderer', 'unknown', 'No BrowserWindow — run inside otto desktop', {
      impact: 'Frontend health cannot be verified from this process.',
      nextAction: 'Open otto and refresh Settings → System health.',
    });
  }
  if (win.isDestroyed() || win.webContents.isDestroyed()) {
    return check('renderer', 'Renderer', 'fail', 'Renderer window destroyed', {
      impact: 'Chat UI is unavailable until the window reloads.',
      nextAction: 'Relaunch otto or use View → Reload.',
    });
  }
  return check('renderer', 'Renderer', 'ok', 'Renderer window alive', {
    data: { focused: win.isFocused() },
  });
}

function runtimeChecks(status: ReturnType<LettaRunner['getStatus']>): HealthCheck[] {
  if (status.ready) {
    return [
      check('runtime', 'Runtime connected', 'ok', 'Letta session initialized', {
        data: {
          agentId: status.agentId ?? null,
          model: status.model ?? null,
          transport: status.effectiveTransport ?? null,
        },
      }),
      check(
        'session',
        'WebSocket / session',
        'ok',
        status.conversationId
          ? `Conversation ${status.conversationId}`
          : 'Session ready — start or switch a thread',
        {
          data: {
            conversationId: status.conversationId ?? null,
            transportMode: status.transportMode ?? null,
            effectiveTransport: status.effectiveTransport ?? null,
            wsListenerPort: status.wsListenerPort ?? null,
            lastReconnectAt: status.lastReconnectAt ?? null,
          },
          nextAction: status.conversationId ? undefined : 'Send a message or create a thread to bind a conversation.',
        },
      ),
    ];
  }

  const code = status.code ?? 'error';
  const reason = status.reason ?? 'Runtime not ready';
  return [
    check('runtime', 'Runtime connected', 'fail', reason, {
      impact: 'Chat, memory observatory, and live sends stay disabled.',
      nextAction: 'Open Settings → Connection and reconnect Letta.',
      data: { code },
    }),
    check('session', 'WebSocket / session', 'fail', 'No live session', {
      impact: 'Thread switches and streaming will not work.',
      nextAction: 'Fix runtime connection first.',
      data: { code },
    }),
  ];
}

async function memoryCheck(memory: MemoryStore, runtimeReady: boolean): Promise<HealthCheck> {
  if (!runtimeReady) {
    return check('memory', 'Memory reachable', 'unknown', 'Runtime offline — memory not probed', {
      impact: 'Memory observatory may show stale or empty state.',
      nextAction: 'Connect Letta, then re-run health.',
    });
  }
  try {
    const result = await memory.listBlocks();
    if (result.error) {
      return check('memory', 'Memory reachable', 'warn', result.error, {
        impact: 'Memory observatory may be incomplete.',
        nextAction: 'Verify Letta agent id and local runtime URL in Settings.',
        data: { agentId: result.agentId, baseUrl: result.baseUrl },
      });
    }
    const count = result.blocks.length;
    return check('memory', 'Memory reachable', 'ok', `${count} block${count === 1 ? '' : 's'} reachable`, {
      data: { agentId: result.agentId, baseUrl: result.baseUrl, count },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return check('memory', 'Memory reachable', 'fail', message, {
      impact: 'Memory observatory cannot load live blocks.',
      nextAction: 'Check Letta is running and the configured agent exists.',
    });
  }
}

function permissionsCheck(autonomy: AutonomyStore): HealthCheck {
  try {
    const policy = autonomy.loadResult();
    const sessionTools = permissionSessionStore.list();
    return check('permissions', 'Permissions route', 'ok', 'Autonomy policy loaded', {
      data: {
        policyFile: policy.policy.file ?? null,
        zoneCount: policy.policy.zones.length,
        sessionAllowedTools: sessionTools.length,
      },
      nextAction: sessionTools.length ? undefined : 'Permission prompts appear in Chat when tools need approval.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return check('permissions', 'Permissions route', 'fail', message, {
      impact: 'Tool permission gates may not evaluate correctly.',
      nextAction: 'Verify autonomy/policy.yaml and restart otto.',
    });
  }
}

function queueCheck(snapshot: QueueSnapshot | null): HealthCheck {
  if (!snapshot) {
    return check('queue', 'Unsent queue', 'unknown', 'Queue state unavailable', {
      impact: 'Failed or stuck unsent messages may be hidden.',
      nextAction: 'Open Chat and inspect the unsent queue bar.',
    });
  }
  if (snapshot.failed > 0) {
    return check('queue', 'Unsent queue', 'warn', `${snapshot.failed} failed · ${snapshot.queued} queued`, {
      impact: 'Some messages did not send — chat history may be incomplete.',
      nextAction: 'Open Chat → retry failed items or clear the queue.',
      data: snapshot,
    });
  }
  if (snapshot.sending > 0 || snapshot.queued > 0) {
    return check('queue', 'Unsent queue', 'ok', `${snapshot.queued} queued · ${snapshot.sending} sending`, {
      data: snapshot,
    });
  }
  return check('queue', 'Unsent queue', 'ok', 'Queue empty', { data: snapshot });
}

function schedulerCheck(routines: RoutineStore): HealthCheck {
  const listed = routines.listResult();
  const scheduled = listed.routines.filter((r) => !!r.schedule);
  const blocked = scheduled.filter((r) => {
    const gate = routines.activationGate(r.slug);
    return !gate.allowed;
  });
  if (!scheduled.length) {
    return check('scheduler', 'Routines / scheduler', 'ok', 'No scheduled routines', {
      data: { routineCount: listed.routines.length },
    });
  }
  if (blocked.length) {
    return check('scheduler', 'Routines / scheduler', 'warn', `${scheduled.length} scheduled · ${blocked.length} blocked`, {
      impact: 'Scheduled routines will not run until approved.',
      nextAction: 'Review Routines surface and approve recurring activation where intended.',
      data: { scheduled: scheduled.length, blocked: blocked.length, skipped: listed.skipped.length },
    });
  }
  return check('scheduler', 'Routines / scheduler', 'ok', `${scheduled.length} scheduled routine${scheduled.length === 1 ? '' : 's'}`, {
    data: { scheduled: scheduled.length, skipped: listed.skipped.length },
  });
}

function backgroundWorkCheck(
  workers: WorkerStore,
  runs: RunStore,
  config: ConfigStore,
): HealthCheck {
  const workerList = workers.list();
  const runList = runs.list();
  const activeWorkers = workerList.workers.filter((w) => w.status === 'running' || w.status === 'blocked');
  const activeRuns = runList.runs.filter((r) => r.status === 'running');
  const labs = getLabsConfig(config.get());
  const dreamsEnabled =
    labs.enabled === true &&
    (labs.features?.worker_autonomous_loop === true || labs.features?.practice_mining === true);

  if (activeWorkers.length || activeRuns.length) {
    return check('background', 'Background work / dreams', 'warn', `${activeWorkers.length} worker(s) · ${activeRuns.length} run(s) active`, {
      impact: 'Background work may consume runtime quota or hold locks.',
      nextAction: 'Inspect Workers and Runs surfaces for stuck jobs.',
      data: {
        activeWorkers: activeWorkers.length,
        activeRuns: activeRuns.length,
        dreamsLabsEnabled: dreamsEnabled,
      },
    });
  }

  return check('background', 'Background work / dreams', 'ok', dreamsEnabled ? 'Labs background loops enabled · idle' : 'No active background work', {
    data: {
      dreamsLabsEnabled: dreamsEnabled,
      workerCount: workerList.workers.length,
      runCount: runList.runs.length,
    },
  });
}

function buildMarkerCheck(): HealthCheck {
  const build = readAppBuildInfo();
  const channel = build.channel ?? 'unknown';
  const version = build.version ?? 'unknown';
  const sha = build.shortSha ?? build.sha?.slice(0, 7) ?? 'unknown';
  if (build.channel === 'release' && build.matchesMain === false) {
    return check('build', 'Build / channel marker', 'warn', `${channel} · v${version} · ${sha} (not at main)`, {
      impact: 'Installed build may diverge from latest main.',
      nextAction: 'Compare with GitHub Release or refresh staging intentionally.',
      data: { channel, version, sha, matchesMain: build.matchesMain },
    });
  }
  return check('build', 'Build / channel marker', 'ok', `${channel} · v${version} · ${sha}`, {
    data: {
      channel,
      version,
      sha,
      branch: build.branch,
      matchesMain: build.matchesMain,
      appPath: build.appPath,
    },
  });
}

/** Collect live health from the Electron main process. */
export async function collectSystemHealth(deps: SystemHealthDeps): Promise<SystemHealthReport> {
  const status = deps.runner.getStatus();
  const queueSnapshot = await readQueueSnapshot(deps.win);
  const checks: HealthCheck[] = [
    rendererCheck(deps.win),
    ...runtimeChecks(status),
    await memoryCheck(deps.memory, status.ready),
    permissionsCheck(deps.autonomy),
    queueCheck(queueSnapshot),
    schedulerCheck(deps.routines),
    backgroundWorkCheck(deps.workers, deps.runs, deps.config),
    buildMarkerCheck(),
  ];

  return {
    ok: overallOk(checks),
    checkedAt: new Date().toISOString(),
    scope: 'live',
    build: readAppBuildInfo(),
    checks,
  };
}

/** Format a health report for humans (stdout / Settings). */
export function formatSystemHealthHuman(report: SystemHealthReport): string {
  const lines = [
    `otto health · ${report.scope} · ${report.ok ? 'OK' : 'NOT OK'} · ${report.checkedAt}`,
    `build: ${report.build.channel ?? 'unknown'} v${report.build.version ?? '?'} (${report.build.shortSha ?? 'no-sha'})`,
    '',
  ];
  for (const c of report.checks) {
    lines.push(`[${c.status.toUpperCase()}] ${c.label}: ${c.summary}`);
    if (c.impact) lines.push(`  impact: ${c.impact}`);
    if (c.nextAction) lines.push(`  next: ${c.nextAction}`);
  }
  return lines.join('\n');
}
