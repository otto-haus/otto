import type { CheckRunResult, WorkerRecord } from '@otto-haus/core';
import { AutonomyStore } from './autonomy-store';
import { CheckRunner } from './check-runner';
import { ReceiptWriter } from './receipt-writer';
import { RunStore } from './run-store';
import { TicketStore } from './ticket-store';
import { WorkerStore } from './worker-store';

export type WorkerBoundedRunResult = {
  worker: WorkerRecord;
  status: 'completed' | 'blocked' | 'stopped';
  turns: number;
  receipt_id: string;
  summary: string;
  /** 051 review gate snapshot — merged requires reviewer +1 via TicketStore.updateStatus. */
  review_gate?: CheckRunResult[];
};

/**
 * Bounded autonomous worker loop (060) — checkpoint + autonomy gate, no unsupervised merge.
 * Letta session execution in worktree remains stubbed (039 follow-up).
 */
export class WorkerRunner {
  constructor(
    private workers = new WorkerStore(),
    private tickets = new TicketStore(),
    private runs = new RunStore(),
    private autonomy = new AutonomyStore(),
    private receipts = new ReceiptWriter(),
    private checks = new CheckRunner(),
  ) {}

  runBounded(workerId: string, opts: { maxTurns?: number } = {}): WorkerBoundedRunResult {
    const worker = this.workers.list().workers.find((w) => w.id === workerId);
    if (!worker) throw new Error(`Worker not found: ${workerId}`);
    const ticket = worker.ticket_id ? this.tickets.get(worker.ticket_id) : null;
    const maxTurns = Math.min(Math.max(opts.maxTurns ?? 3, 1), 10);

    const evalDoor = this.autonomy.evaluateAction({
      action: `worker ${workerId} bounded loop for ${ticket?.ticket_id ?? 'unknown ticket'}`,
      context: ticket?.objective,
    });
    if (evalDoor.evaluation.requires_approval) {
      const receipt = this.receipts.write({
        status: 'blocked',
        subject: { type: 'worker', id: workerId },
        action: 'worker.run_bounded',
        input: { workerId, maxTurns, ticket_id: ticket?.ticket_id ?? null },
        result: { summary: evalDoor.evaluation.reason, data: { turns: 0 } },
        evidence: [{ kind: 'file', ref: evalDoor.receipt.path, note: 'autonomy evaluation' }],
        blocker: {
          code: 'approval_required',
          message: evalDoor.evaluation.reason,
          recoverable: true,
          next_action: 'Approve worker action or adjust autonomy policy.',
        },
      });
      this.workers.updateStatus(workerId, 'blocked', receipt.id);
      return {
        worker: { ...worker, status: 'blocked' },
        status: 'blocked',
        turns: 0,
        receipt_id: receipt.id,
        summary: evalDoor.evaluation.reason,
      };
    }

    const reviewGate = ticket
      ? this.checks.evaluateDoneClaim({
          acceptance_criteria: ticket.acceptance_criteria,
          review: null,
          evidence: [],
        })
      : [];
    const mergedWouldBlock = reviewGate.some((r) => r.blocked && !r.passed);

    const summary = `Worker ${workerId} bounded loop not executed — Letta session transport not wired (039).`;
    const receipt = this.receipts.write({
      status: 'blocked',
      subject: { type: 'worker', id: workerId },
      action: 'worker.run_bounded',
      input: { workerId, maxTurns, ticket_id: ticket?.ticket_id ?? null },
      result: {
        summary,
        data: {
          turns: 0,
          note: 'Letta session execution wires in 039 transport follow-up.',
          review_gate: reviewGate,
          merged_blocked_without_review: mergedWouldBlock,
        },
      },
      evidence: ticket ? [{ kind: 'file', ref: ticket.ticketPath, note: 'ticket.yaml' }] : [],
      blocker: {
        code: 'execution_not_wired',
        message: summary,
        recoverable: false,
        next_action: 'Ship Letta worker session transport (039) before bounded loops run.',
      },
    });

    this.workers.updateStatus(workerId, 'blocked', receipt.id);
    if (ticket) {
      this.runs.record({
        id: `run_${workerId}_bounded`,
        practice: 'ticketcraft',
        charter: ticket.charter,
        status: 'blocked',
        summary: `Bounded worker loop blocked for ${ticket.ticket_id}`,
        worker_id: workerId,
        ticket_id: ticket.ticket_id,
      });
    }

    return {
      worker: { ...worker, status: 'blocked' },
      status: 'blocked',
      turns: 0,
      receipt_id: receipt.id,
      summary,
      review_gate: reviewGate.length ? reviewGate : undefined,
    };
  }
}
