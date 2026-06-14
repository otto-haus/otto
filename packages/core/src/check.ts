/**
 * Culture CI — Check primitive (`otto.check.v1`).
 * Ratified Standards compile into executable behavioral regressions.
 */

import type { ISO8601, Id, SemVer, Slug } from './types.js';

export const CHECK_SCHEMA = 'otto.check.v1' as const;

export type CheckTriggerEvent = 'done_claim' | 'one_way_door_action';

export type CheckInspectRuleId =
  | 'acceptance_criteria_mapped'
  | 'evidence_attached'
  | 'test_or_log_or_artifact_present'
  | 'approval_present';

export interface CheckTrigger {
  event: CheckTriggerEvent;
}

export interface CheckInspect {
  require: CheckInspectRuleId[];
}

export interface CheckOnFail {
  block_claim: boolean;
  message: string;
  write_receipt: boolean;
}

export interface Check {
  schema: typeof CHECK_SCHEMA;
  id: string;
  version: SemVer;
  source: string;
  trigger: CheckTrigger;
  inspect: CheckInspect;
  on_fail: CheckOnFail;
  compiled_from_proposal_id?: Id | null;
  compiled_at?: ISO8601;
  standard_hash?: string | null;
  standard_slug?: Slug | null;
  active?: boolean;
}

export type CheckValidationIssue = { path: string; message: string };

export function validateCheck(input: unknown): { ok: true; check: Check } | { ok: false; issues: CheckValidationIssue[] } {
  const issues: CheckValidationIssue[] = [];
  if (!input || typeof input !== 'object') {
    return { ok: false, issues: [{ path: '', message: 'Check must be an object' }] };
  }
  const raw = input as Record<string, unknown>;
  if (raw.schema !== CHECK_SCHEMA) {
    issues.push({ path: 'schema', message: `Expected ${CHECK_SCHEMA}` });
  }
  if (typeof raw.id !== 'string' || !raw.id.trim()) {
    issues.push({ path: 'id', message: 'id is required' });
  }
  if (typeof raw.version !== 'string' || !raw.version.trim()) {
    issues.push({ path: 'version', message: 'version is required' });
  }
  if (typeof raw.source !== 'string' || !raw.source.trim()) {
    issues.push({ path: 'source', message: 'source is required' });
  }
  const trigger = raw.trigger as Record<string, unknown> | undefined;
  if (!trigger || typeof trigger !== 'object') {
    issues.push({ path: 'trigger', message: 'trigger is required' });
  } else if (trigger.event !== 'done_claim' && trigger.event !== 'one_way_door_action') {
    issues.push({ path: 'trigger.event', message: 'Invalid trigger event' });
  }
  const inspect = raw.inspect as Record<string, unknown> | undefined;
  if (!inspect || !Array.isArray(inspect.require) || inspect.require.length === 0) {
    issues.push({ path: 'inspect.require', message: 'At least one inspect rule is required' });
  }
  const onFail = raw.on_fail as Record<string, unknown> | undefined;
  if (!onFail || typeof onFail !== 'object') {
    issues.push({ path: 'on_fail', message: 'on_fail is required' });
  } else {
    if (typeof onFail.message !== 'string' || !onFail.message.trim()) {
      issues.push({ path: 'on_fail.message', message: 'on_fail.message is required' });
    }
  }
  if (issues.length) return { ok: false, issues };

  const event = trigger!.event as CheckTriggerEvent;
  return {
    ok: true,
    check: {
      schema: CHECK_SCHEMA,
      id: String(raw.id),
      version: String(raw.version),
      source: String(raw.source),
      trigger: { event },
      inspect: { require: (inspect!.require as CheckInspectRuleId[]).slice() },
      on_fail: {
        block_claim: onFail!.block_claim !== false,
        message: String(onFail!.message),
        write_receipt: onFail!.write_receipt !== false,
      },
      compiled_from_proposal_id: (raw.compiled_from_proposal_id as Id | null | undefined) ?? null,
      compiled_at: (raw.compiled_at as ISO8601 | undefined) ?? undefined,
      standard_hash: (raw.standard_hash as string | null | undefined) ?? null,
      standard_slug: (raw.standard_slug as Slug | null | undefined) ?? null,
      active: raw.active !== false,
    },
  };
}

export type CheckRunResult = {
  check_id: string;
  trigger: CheckTriggerEvent;
  passed: boolean;
  message: string;
  blocked: boolean;
  receipt_id?: string;
};

export type CheckRunStats = {
  last_run_at?: string;
  last_passed?: boolean;
  pass_count: number;
  fail_count: number;
};

export type CheckListResult = {
  dir: string;
  checks: Check[];
  skipped: Array<{ id: string; file: string; reason: string }>;
  /** Per-check run history — empty or omitted when no runs recorded yet. */
  stats?: Record<string, CheckRunStats>;
};
