import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Check, CheckRunResult, CheckTriggerEvent } from '@otto-haus/core';
import type { TicketReviewRecord } from './shared/types';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import { CheckStore } from './check-store';

export type DoneClaimContext = {
  acceptance_criteria?: Array<{ id: string; text: string; proof?: string; receipts?: string[] }>;
  review?: TicketReviewRecord | null;
  evidence?: string[];
  artifacts?: string[];
};

export type OneWayDoorContext = {
  approved?: boolean;
  autonomy_allowed?: boolean;
  session_allowed?: boolean;
};

export class CheckRunner {
  constructor(
    private store = new CheckStore(),
    private receipts = new ReceiptWriter(),
  ) {}

  list() {
    return this.store.listResult();
  }

  get(id: string) {
    return this.store.get(id);
  }

  evaluateDoneClaim(context: DoneClaimContext): CheckRunResult[] {
    return this.evaluateTrigger('done_claim', context);
  }

  evaluateOneWayDoor(context: OneWayDoorContext): CheckRunResult[] {
    return this.evaluateTrigger('one_way_door_action', context);
  }

  evaluateTrigger(event: CheckTriggerEvent, context: unknown): CheckRunResult[] {
    const checks = this.store.listResult().checks.filter((c) => c.trigger.event === event);
    return checks.map((check) => this.runCheck(check, context));
  }

  private runCheck(check: Check, context: unknown): CheckRunResult {
    const passed = this.inspect(check, context);
    if (passed) {
      return {
        check_id: check.id,
        trigger: check.trigger.event,
        passed: true,
        message: 'Check passed',
        blocked: false,
      };
    }
    let receipt: WrittenReceipt | null = null;
    if (check.on_fail.write_receipt) {
      receipt = this.receipts.write({
        status: 'blocked',
        subject: { type: 'check', id: check.id },
        action: 'check.failed',
        input: { trigger: check.trigger.event, source: check.source },
        result: {
          summary: check.on_fail.message,
          data: { check_id: check.id, trigger: check.trigger.event },
        },
        evidence: [{ kind: 'file', ref: check.source, note: 'Check source standard' }],
        blocker: {
          code: 'check_failed',
          message: check.on_fail.message,
          recoverable: true,
          next_action: 'Add mapped proof or obtain approval before retrying.',
        },
      });
    }
    return {
      check_id: check.id,
      trigger: check.trigger.event,
      passed: false,
      message: check.on_fail.message,
      blocked: check.on_fail.block_claim,
      receipt_id: receipt?.id,
    };
  }

  private inspect(check: Check, context: unknown): boolean {
    const rules = check.inspect.require;
    if (check.trigger.event === 'done_claim') {
      return rules.every((rule) => inspectDoneRule(rule, context as DoneClaimContext));
    }
    if (check.trigger.event === 'one_way_door_action') {
      return rules.every((rule) => inspectDoorRule(rule, context as OneWayDoorContext));
    }
    return false;
  }
}

function inspectDoneRule(rule: string, ctx: DoneClaimContext): boolean {
  switch (rule) {
    case 'acceptance_criteria_mapped': {
      const acs = ctx.acceptance_criteria ?? [];
      if (!acs.length) return false;
      return acs.every((ac) => !!(ac.proof?.trim() || (ac.receipts?.length ?? 0) > 0));
    }
    case 'evidence_attached': {
      const evidence = ctx.review?.evidence ?? ctx.evidence ?? [];
      return evidence.length > 0;
    }
    case 'test_or_log_or_artifact_present': {
      const evidence = ctx.review?.evidence ?? ctx.evidence ?? [];
      const artifacts = ctx.artifacts ?? [];
      return evidence.length > 0 || artifacts.length > 0 || ctx.review?.verdict === '+1';
    }
    default:
      return false;
  }
}

function inspectDoorRule(rule: string, ctx: OneWayDoorContext): boolean {
  if (rule !== 'approval_present') return false;
  return !!(ctx.approved || ctx.autonomy_allowed || ctx.session_allowed);
}

export function hashStandardContent(filePath: string): string {
  const raw = readFileSync(filePath, 'utf8');
  return createHash('sha256').update(raw).digest('hex');
}
