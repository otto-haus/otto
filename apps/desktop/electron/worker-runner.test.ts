import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { WorkerRunner } from './worker-runner';
import { WorkerStore } from './worker-store';
import { TicketStore } from './ticket-store';
import { RunStore } from './run-store';
import { AutonomyStore } from './autonomy-store';
import { CheckRunner } from './check-runner';
import { ReceiptWriter } from './receipt-writer';

describe('WorkerRunner', () => {
  test('runBounded records receipt for unknown worker as error path', () => {
    expect(() => new WorkerRunner().runBounded('missing-worker')).toThrow(/not found/i);
  });

  test('runBounded blocks when Letta session transport is not wired', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-worker-'));
    process.env.OTTO_HOME = dir;
    try {
      const workers = new WorkerStore();
      const tickets = new TicketStore();
      const compiled = tickets.compile({ objective: 'worker test', slug: 'worker-test' });
      const worker = workers.spawn({ ticket_id: compiled.ticket.ticket_id });
      const runner = new WorkerRunner(workers, tickets, new RunStore(), new AutonomyStore(), new ReceiptWriter());
      const result = runner.runBounded(worker.id, { maxTurns: 2 });
      expect(result.receipt_id).toBeTruthy();
      expect(result.status).toBe('blocked');
      expect(result.turns).toBe(0);
      expect(result.summary).toMatch(/not executed|not wired/i);
    } finally {
      delete process.env.OTTO_HOME;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('runBounded writes autonomy-blocked receipt when action requires approval', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-worker-'));
    process.env.OTTO_HOME = dir;
    try {
      const workers = new WorkerStore();
      const tickets = new TicketStore();
      const compiled = tickets.compile({ objective: 'worker smoke', slug: 'worker-smoke' });
      const worker = workers.spawn({ ticket_id: compiled.ticket.ticket_id });
      const runner = new WorkerRunner(workers, tickets, new RunStore(), new AutonomyStore(), new ReceiptWriter());
      const result = runner.runBounded(worker.id, { maxTurns: 1 });
      expect(result.status).toBe('blocked');
      expect(result.turns).toBe(0);
      expect(result.receipt_id).toBeTruthy();
      expect(result.summary).toMatch(/approval|prompt/i);
    } finally {
      delete process.env.OTTO_HOME;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('runBounded attaches 051 review gate blocking merged without reviewer evidence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-worker-'));
    process.env.OTTO_HOME = dir;
    try {
      const workers = new WorkerStore();
      const tickets = new TicketStore();
      const compiled = tickets.compile({ objective: 'worker test', slug: 'worker-test' });
      const worker = workers.spawn({ ticket_id: compiled.ticket.ticket_id });
      const runner = new WorkerRunner(
        workers,
        tickets,
        new RunStore(),
        new AutonomyStore(),
        new ReceiptWriter(),
        new CheckRunner(),
      );
      const result = runner.runBounded(worker.id, { maxTurns: 1 });
      expect(result.status).toBe('blocked');
      expect(result.review_gate?.some((r) => !r.passed)).toBe(true);
      tickets.updateStatus(compiled.ticket.ticket_id, { status: 'active' });
      tickets.updateStatus(compiled.ticket.ticket_id, { status: 'review' });
      expect(() => tickets.updateStatus(compiled.ticket.ticket_id, { status: 'merged' })).toThrow(/reviewer_verdict/i);
    } finally {
      delete process.env.OTTO_HOME;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
