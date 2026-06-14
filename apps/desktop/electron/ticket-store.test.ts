import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { CheckRunner } from './check-runner';
import { CheckStore } from './check-store';
import { ReceiptWriter } from './receipt-writer';
import { ReceiptStore } from './receipt-store';
import { TicketStore } from './ticket-store';

describe('TicketStore', () => {
  test('compile writes ticket.yaml and returns receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ticket-test-'));
    try {
      const store = new TicketStore(join(tmp, 'tickets'));
      const result = store.compile({
        slug: 'smoke-slice',
        objective: 'Prove ticket compile writes a bounded worker slice.',
      });

      expect(result.ticket.ticket_id).toBe('ticket_smoke-slice');
      expect(result.ticket.status).toBe('proposed');
      expect(existsSync(result.ticket.ticketPath)).toBe(true);
      expect(result.receipt.action).toBe('ticket.compile');
      expect(result.receipt.status).toBe('success');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('blocks merged without reviewer +1 and evidence', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ticket-gate-'));
    try {
      const store = new TicketStore(join(tmp, 'tickets'));
      const compiled = store.compile({ slug: 'gate-slice', objective: 'Review gate fixture.' });
      store.updateStatus(compiled.ticket.ticket_id, { status: 'active' });
      store.updateStatus(compiled.ticket.ticket_id, { status: 'review' });
      expect(() => store.updateStatus(compiled.ticket.ticket_id, { status: 'merged' })).toThrow(/reviewer_verdict/);
      expect(() =>
        store.updateStatus(compiled.ticket.ticket_id, {
          status: 'merged',
          review: { verdict: '+1', evidence: [] },
        }),
      ).toThrow(/evidence refs/);
      const merged = store.updateStatus(compiled.ticket.ticket_id, {
        status: 'merged',
        review: { verdict: '+1', evidence: ['receipts/2026-06-13/gate-slice.md'], reviewed_at: new Date().toISOString() },
      });
      expect(merged.status).toBe('merged');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('blocks merged when check fails and surfaces receipt_id', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ticket-check-'));
    const checksDir = join(tmp, 'checks');
    const receiptsDir = join(tmp, 'receipts');
    try {
      process.env.OTTO_CHECKS_DIR = checksDir;
      const checkStore = new CheckStore(checksDir);
      checkStore.listResult();
      const checks = new CheckRunner(checkStore, new ReceiptWriter(receiptsDir));
      const store = new TicketStore(join(tmp, 'tickets'), new ReceiptWriter(receiptsDir), checks);
      const compiled = store.compile({ slug: 'check-gate', objective: 'Culture CI gate fixture.' });
      store.updateStatus(compiled.ticket.ticket_id, { status: 'active' });
      store.updateStatus(compiled.ticket.ticket_id, { status: 'review' });

      const raw = parse(readFileSync(compiled.ticket.ticketPath, 'utf8')) as Record<string, unknown>;
      const acs = raw.acceptance_criteria as Array<{ id: string; text: string; proof?: string }>;
      acs[0].proof = '';
      writeFileSync(compiled.ticket.ticketPath, stringify(raw), 'utf8');

      expect(() =>
        store.updateStatus(compiled.ticket.ticket_id, {
          status: 'merged',
          review: { verdict: '+1', evidence: ['receipts/2026-06-13/check-gate.md'], reviewed_at: new Date().toISOString() },
        }),
      ).toThrow(/receipt:/);

      const failedReceipts = new ReceiptStore(receiptsDir).list().receipts.filter((r) => r.action === 'check.failed');
      expect(failedReceipts.length).toBeGreaterThan(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('blocks skip from active straight to merged', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ticket-gate-'));
    try {
      const store = new TicketStore(join(tmp, 'tickets'));
      const compiled = store.compile({ slug: 'skip-slice', objective: 'No fake done.' });
      store.updateStatus(compiled.ticket.ticket_id, { status: 'active' });
      expect(() =>
        store.updateStatus(compiled.ticket.ticket_id, {
          status: 'merged',
          review: { verdict: '+1', evidence: ['receipts/x.md'] },
        }),
      ).toThrow(/review/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
