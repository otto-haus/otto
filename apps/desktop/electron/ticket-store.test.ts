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
});
