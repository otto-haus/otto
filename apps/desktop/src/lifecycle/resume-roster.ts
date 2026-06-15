/**
 * Issue #318 — post-resume capability roster.
 * Names each background capability explicitly so sleep/wake smokes fail loudly
 * instead of silently dropping drafts, queue, routines, or runtime state.
 */

export type CapabilityState = 'ok' | 'degraded' | 'missing' | 'not_wired' | 'deferred';

export type CapabilityReport = {
  capability: string;
  state: CapabilityState;
  detail: string;
  nextAction?: string;
};

export type QueueSnapshotItem = {
  id: string;
  text: string;
  state: string;
};

export type ScheduledRoutineSnapshot = {
  slug: string;
  scheduled: boolean;
  allowed: boolean;
  reason: string;
};

export type ResumeSnapshot = {
  draftText: string;
  draftExpected: string;
  queueItems: QueueSnapshotItem[];
  queueExpectedTexts: string[];
  runtimeReady: boolean | null;
  runtimeReason?: string | null;
  scheduledRoutines: ScheduledRoutineSnapshot[];
  dreamsWired: boolean;
};

export type ResumeRosterResult = {
  ok: boolean;
  reports: CapabilityReport[];
  failures: CapabilityReport[];
};

export function evaluateResumeRoster(snapshot: ResumeSnapshot): ResumeRosterResult {
  const reports: CapabilityReport[] = [];

  const draftOk = snapshot.draftText.includes(snapshot.draftExpected);
  reports.push({
    capability: 'chat_draft',
    state: draftOk ? 'ok' : 'missing',
    detail: draftOk
      ? 'Draft text survived suspend/resume cycle.'
      : `Draft missing expected marker "${snapshot.draftExpected}".`,
    nextAction: draftOk ? undefined : 'Check per-thread localStorage otto.chat.draft.<threadId>.v1 persistence and reload handlers.',
  });

  const queueMatches = snapshot.queueExpectedTexts.every((expected) =>
    snapshot.queueItems.some((item) => item.text.includes(expected)),
  );
  reports.push({
    capability: 'chat_queue',
    state: queueMatches ? 'ok' : 'missing',
    detail: queueMatches
      ? `${snapshot.queueItems.length} queued item(s) retained after resume.`
      : 'Queued messages missing after suspend/resume cycle.',
    nextAction: queueMatches ? undefined : 'Inspect otto.chat.queue.v3 migration and in-flight dedupe on reload.',
  });

  if (snapshot.runtimeReady === null) {
    reports.push({
      capability: 'runtime_socket',
      state: 'not_wired',
      detail: 'Runtime status unavailable (window.otto.runtime.status missing).',
      nextAction: 'Run smoke inside Electron with preload bridge enabled.',
    });
  } else if (snapshot.runtimeReady) {
    reports.push({
      capability: 'runtime_socket',
      state: 'ok',
      detail: 'Runtime reports ready after resume.',
    });
  } else {
    reports.push({
      capability: 'runtime_socket',
      state: 'degraded',
      detail: snapshot.runtimeReason?.trim() || 'Runtime not ready after resume.',
      nextAction: 'Open Settings → Connection and retry Letta init; check wake reconnect logs.',
    });
  }

  const scheduled = snapshot.scheduledRoutines.filter((r) => r.scheduled);
  if (!scheduled.length) {
    reports.push({
      capability: 'scheduled_routines',
      state: 'deferred',
      detail: 'No scheduled routines found in workspace snapshot.',
      nextAction: 'Seed routines/ with a cron schedule or skip if empty workspace is expected.',
    });
  } else {
    for (const routine of scheduled) {
      reports.push({
        capability: `routine:${routine.slug}`,
        state: routine.allowed ? 'ok' : 'deferred',
        detail: routine.reason || (routine.allowed ? 'Scheduled routine may run.' : 'Scheduled routine gated.'),
        nextAction: routine.allowed
          ? undefined
          : 'Approve routine activation or expect deferred/missed execution after wake.',
      });
    }
  }

  reports.push({
    capability: 'dreams_background_loops',
    state: snapshot.dreamsWired ? 'deferred' : 'not_wired',
    detail: snapshot.dreamsWired
      ? 'Dreams surface present; resume behavior not yet automated in smoke.'
      : 'Dreams/background loops not wired in v1 desktop shell.',
    nextAction: snapshot.dreamsWired
      ? 'Add explicit resume/defer reporting on dreams pane.'
      : 'Enable Labs dreams feature when shipped; until then expect explicit not_wired.',
  });

  const failures = reports.filter((r) => {
    if (r.capability === 'dreams_background_loops' && r.state === 'not_wired') return false;
    return r.state === 'missing' || r.state === 'not_wired';
  });
  return { ok: failures.length === 0, reports, failures };
}
