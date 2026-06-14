import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
