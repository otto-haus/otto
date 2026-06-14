import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { CheckRunResult, PracticeRecord, PracticeReference } from '@otto-haus/core';
import { AutonomyStore } from './autonomy-store';
import { CheckRunner, type DoneClaimContext } from './check-runner';
import { OTTO_DIR } from './config-store';
import { PracticeMetricsStore } from './practice-metrics-store';
import { PracticeStore } from './practice-store';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import { RunStore, type RecordRunInput } from './run-store';

export const RUNTIME_PRACTICE_SLUGS = ['charter', 'review', 'field-note'] as const;
export type RuntimePracticeSlug = (typeof RUNTIME_PRACTICE_SLUGS)[number];

export interface PracticeRunInput {
  slug: string;
  invocation?: string;
  payload?: PracticeRunPayload;
  approved?: boolean;
}

export interface PracticeRunPayload {
  note?: string;
  raw_note?: string;
  source?: { who?: string; role?: string; where?: string; when?: string };
  acceptance_criteria?: DoneClaimContext['acceptance_criteria'];
  review?: DoneClaimContext['review'];
  evidence?: string[];
  artifacts?: string[];
  intent?: string;
}

export interface PracticeRunResult {
  practice: PracticeRecord;
  invocation: string;
  run: ReturnType<RunStore['record']>;
  receipt: WrittenReceipt;
  artifactPath?: string;
  check_results?: CheckRunResult[];
  blocked: boolean;
}

const DEFAULT_INVOCATIONS: Record<RuntimePracticeSlug, string> = {
  charter: '/charter step',
  review: '/review done',
  'field-note': '/field-note capture',
};

const EXTERNAL_INVOCATION = /\b(send|publish|post|deploy|enable globally|merge)\b/i;

export class PracticeRunner {
  constructor(
    private practices = new PracticeStore(),
    private runs = new RunStore(),
    private receipts = new ReceiptWriter(),
    private metrics = new PracticeMetricsStore(),
    private autonomy = new AutonomyStore(),
    private checks = new CheckRunner(),
  ) {}

  run(input: PracticeRunInput): PracticeRunResult {
    const practice = this.practices.get(input.slug);
    if (!practice) throw new Error(`Practice not found: ${input.slug}`);
    if (!isRuntimePractice(practice.slug)) {
      throw new Error(`Practice not wired for runtime: ${input.slug}`);
    }

    const invocation = resolveInvocation(practice, input.invocation);
    const floor = this.evaluatePracticeFloor(practice, invocation, input);
    if (floor.blocked) {
      const run = this.runs.record({
        practice: practice.slug,
        status: 'blocked',
        summary: floor.reason,
      });
      this.metrics.recordRun({
        slug: practice.slug,
        runId: run.id,
        receiptId: floor.receipt.id,
        receiptPath: floor.receipt.path,
        status: 'blocked',
      });
      return {
        practice,
        invocation,
        run,
        receipt: floor.receipt,
        blocked: true,
      };
    }

    const startedAt = Date.now();
    const reference = practiceReference(practice, invocation);
    let receipt: WrittenReceipt;
    let artifactPath: string | undefined;
    let checkResults: CheckRunResult[] | undefined;

    switch (practice.slug as RuntimePracticeSlug) {
      case 'charter':
        receipt = this.runCharter(practice, reference, invocation, input.payload);
        break;
      case 'review':
        ({ receipt, checkResults } = this.runReview(practice, reference, invocation, input.payload));
        break;
      case 'field-note':
        ({ receipt, artifactPath } = this.runFieldNote(practice, reference, invocation, input.payload));
        break;
      default:
        throw new Error(`Unsupported runtime practice: ${practice.slug}`);
    }

    const run = this.runs.record({
      practice: practice.slug,
      status: receipt.status === 'blocked' ? 'blocked' : 'success',
      summary: receipt.result.summary,
    } satisfies RecordRunInput);

    this.metrics.recordRun({
      slug: practice.slug,
      runId: run.id,
      receiptId: receipt.id,
      receiptPath: receipt.path,
      status: receipt.status === 'blocked' ? 'blocked' : 'success',
    });

    if (artifactPath) {
      const elapsed = Date.now() - startedAt;
      const current = this.metrics.get(practice.slug);
      const uses = Math.max(current.uses, 1);
      const prior = current.avg_time_to_artifact_ms ?? elapsed;
      const avg = Math.round((prior * (uses - 1) + elapsed) / uses);
      this.metrics.patch(practice.slug, { avg_time_to_artifact_ms: avg });
    }

    return {
      practice,
      invocation,
      run,
      receipt,
      artifactPath,
      check_results: checkResults,
      blocked: receipt.status === 'blocked',
    };
  }

  metricsFor(slug: string) {
    return this.metrics.get(slug);
  }

  private evaluatePracticeFloor(
    practice: PracticeRecord,
    invocation: string,
    input: PracticeRunInput,
  ): { blocked: false } | { blocked: true; reason: string; receipt: WrittenReceipt } {
    const needsFloor =
      EXTERNAL_INVOCATION.test(invocation) ||
      EXTERNAL_INVOCATION.test(input.payload?.note ?? '') ||
      EXTERNAL_INVOCATION.test(input.payload?.raw_note ?? '');

    if (!needsFloor) return { blocked: false };

    const evaluation = this.autonomy.evaluateAction({
      action: `${invocation} (${practice.slug})`,
      context: practice.slug,
      approved: input.approved,
    });

    if (!evaluation.evaluation.requires_approval || evaluation.evaluation.allowed_without_approval) {
      return { blocked: false };
    }

    return {
      blocked: true,
      reason: evaluation.evaluation.reason,
      receipt: evaluation.receipt,
    };
  }

  private runCharter(
    practice: PracticeRecord,
    reference: PracticeReference,
    invocation: string,
    payload?: PracticeRunPayload,
  ): WrittenReceipt {
    const charterHome = process.env.CHARTER_HOME ?? join(process.env.HOME ?? '', '.charter');
    const activePath = join(charterHome, 'charters', 'active.json');
    const evidence: WrittenReceipt['evidence'] = [
      { kind: 'file', ref: practice.file, note: 'Canonical practice.yaml' },
    ];
    if (existsSync(activePath)) {
      evidence.push({ kind: 'file', ref: activePath, note: 'Active charter pointer' });
    }

    return this.receipts.write({
      status: 'success',
      subject: { type: 'practice', id: practice.slug },
      action: 'practice.charter.run',
      input: {
        invocation,
        intent: payload?.intent ?? null,
        charter_home: charterHome,
      },
      result: {
        summary: `Charter practice run recorded (${invocation})`,
        data: {
          invocation,
          extension: practice.implementation?.extension ?? null,
        },
      },
      evidence,
      practice: reference,
      blocker: null,
    });
  }

  private runReview(
    practice: PracticeRecord,
    reference: PracticeReference,
    invocation: string,
    payload?: PracticeRunPayload,
  ): { receipt: WrittenReceipt; checkResults: CheckRunResult[] } {
    const context: DoneClaimContext = {
      acceptance_criteria: payload?.acceptance_criteria,
      review: payload?.review ?? null,
      evidence: payload?.evidence,
      artifacts: payload?.artifacts,
    };
    const checkResults = this.checks.evaluateDoneClaim(context);
    const failed = checkResults.filter((r) => !r.passed);
    const blocked = failed.some((r) => r.blocked);
    const recommendation = failed.length ? 'fail' : 'pass';

    const receipt = this.receipts.write({
      status: blocked ? 'blocked' : 'success',
      subject: { type: 'practice', id: practice.slug },
      action: invocation.includes('risk') ? 'practice.review.risk' : 'practice.review.done',
      input: {
        invocation,
        acceptance_criteria: context.acceptance_criteria ?? [],
        review: context.review ?? null,
      },
      result: {
        summary:
          failed.length > 0
            ? `Review blocked: ${failed.length} check(s) failed`
            : 'Review passed — evidence mapped for done claim',
        data: {
          recommendation,
          check_results: checkResults,
          premature_done_prevented: failed.length > 0,
        },
      },
      evidence: [
        { kind: 'file', ref: practice.file, note: 'Canonical practice.yaml' },
        ...(payload?.evidence ?? []).map((ref) => ({ kind: 'log' as const, ref, note: 'review evidence' })),
      ],
      practice: reference,
      blocker: blocked
        ? {
            code: 'review_gate',
            message: failed.map((r) => r.message).join(' '),
            recoverable: true,
            next_action: 'Map acceptance criteria to proof or obtain reviewer +1 before done.',
          }
        : null,
    });

    if (failed.length > 0) {
      const metrics = this.metrics.get(practice.slug);
      this.metrics.patch(practice.slug, {
        premature_done_prevented: metrics.premature_done_prevented + 1,
      });
    }

    return { receipt, checkResults };
  }

  private runFieldNote(
    practice: PracticeRecord,
    reference: PracticeReference,
    invocation: string,
    payload?: PracticeRunPayload,
  ): { receipt: WrittenReceipt; artifactPath: string } {
    const raw = (payload?.raw_note ?? payload?.note ?? '').trim();
    if (!raw) throw new Error('Field note capture requires raw_note or note in payload');

    const dir = join(OTTO_DIR, 'field-notes');
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const id = `${stamp}-${randomUUID().slice(0, 8)}`;
    const artifactPath = join(dir, `${id}.md`);
    const source = payload?.source ?? {};
    const body = [
      `# Field note: ${id}`,
      '',
      `id: ${id}`,
      `captured: ${new Date().toISOString()}`,
      '',
      '## Source / context',
      `- who: ${source.who ?? 'unknown'}`,
      `- role: ${source.role ?? 'unknown'}`,
      `- where: ${source.where ?? 'unknown'}`,
      `- when: ${source.when ?? stamp}`,
      '',
      '## Raw note',
      raw,
      '',
      '## Follow-up candidates  (staged, NOT sent)',
      '- [ ] review and stage via /follow-up draft',
      '',
    ].join('\n');
    writeFileSync(artifactPath, body, 'utf8');

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'practice', id: practice.slug },
      action: 'practice.field_note.capture',
      input: {
        invocation,
        source,
        raw_note_length: raw.length,
      },
      result: {
        summary: `Field note captured at ${artifactPath}`,
        data: { artifactPath, id },
      },
      evidence: [
        { kind: 'file', ref: practice.file, note: 'Canonical practice.yaml' },
        { kind: 'file', ref: artifactPath, note: 'Captured field note artifact' },
      ],
      practice: reference,
      blocker: null,
    });

    return { receipt, artifactPath };
  }
}

function isRuntimePractice(slug: string): slug is RuntimePracticeSlug {
  return (RUNTIME_PRACTICE_SLUGS as readonly string[]).includes(slug);
}

function resolveInvocation(practice: PracticeRecord, requested?: string): string {
  const trimmed = requested?.trim();
  if (trimmed) {
    const match = practice.invocations.find((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (match) return match;
    const prefix = practice.invocations.find((item) => trimmed.toLowerCase().startsWith(item.toLowerCase()));
    if (prefix) return prefix;
    throw new Error(`Invocation not declared for ${practice.slug}: ${trimmed}`);
  }
  const slug = practice.slug as RuntimePracticeSlug;
  const fallback = DEFAULT_INVOCATIONS[slug];
  if (practice.invocations.includes(fallback)) return fallback;
  return practice.invocations[0] ?? `/${practice.slug}`;
}

function practiceReference(practice: PracticeRecord, invocation: string): PracticeReference {
  return {
    slug: practice.slug,
    name: practice.name,
    version: practice.version,
    status: practice.status,
    invocation,
    ref: practice.file,
  };
}
