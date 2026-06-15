import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ProposalStore } from './proposal-store';
import { PaperclipStatusStore } from './paperclip-status-store';
import { ReceiptWriter } from './receipt-writer';
import { TicketStore } from './ticket-store';

describe('PaperclipStatusStore (075)', () => {
  test('Paperclip complete → review requested + receipt + proposal; not merged', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-paperclip-075-'));
    try {
      const ticketsDir = join(tmp, 'tickets');
      const receiptsDir = join(tmp, 'receipts');
      const proposalsDir = join(tmp, 'curation', 'proposals');
      const mappingsPath = join(tmp, 'paperclip', 'mappings.json');

      const tickets = new TicketStore(ticketsDir, new ReceiptWriter(receiptsDir));
      const compiled = tickets.compile({
        slug: 'paperclip-slice',
        objective: 'Verify Paperclip completion surfaces review requested only.',
      });
      tickets.updateStatus(compiled.ticket.ticket_id, { status: 'active' });

      const store = new PaperclipStatusStore(
        mappingsPath,
        tickets,
        new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir)),
        new ReceiptWriter(receiptsDir),
      );
      store.saveMapping({
        otto_ticket_id: compiled.ticket.ticket_id,
        paperclip_task_id: 'pc-task-001',
        paperclip_url: 'https://paperclip.example/tasks/pc-task-001',
      });

      const result = store.ingestCompletion({
        paperclip_task_id: 'pc-task-001',
        completed_at: '2026-06-14T12:00:00.000Z',
      });

      expect(result.ticket_status).toBe('review');
      expect(result.signal.status_advanced).toBe(true);
      expect(result.signal.proposal_id).toBeTruthy();
      expect(result.receipt.action).toBe('paperclip.completion.review_requested');
      expect(result.receipt.result.data).toMatchObject({ auto_done: false, review_requested: true });

      const ticket = tickets.get(compiled.ticket.ticket_id);
      expect(ticket?.status).toBe('review');
      expect(ticket?.paperclip?.review_requested_at).toBe('2026-06-14T12:00:00.000Z');
      expect(ticket?.paperclip?.review_signal_receipt_id).toBe(result.receipt.id);

      expect(() =>
        tickets.updateStatus(compiled.ticket.ticket_id, { status: 'merged' }),
      ).toThrow(/reviewer_verdict/);

      const proposals = new ProposalStore(proposalsDir).list().proposals;
      expect(proposals.some((p) => p.id === result.signal.proposal_id && p.source === 'paperclip_event')).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('idempotent mapping save replaces prior link for same ticket or task', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-paperclip-map-'));
    try {
      const mappingsPath = join(tmp, 'paperclip', 'mappings.json');
      const store = new PaperclipStatusStore(
        mappingsPath,
        new TicketStore(join(tmp, 'tickets')),
        new ProposalStore(join(tmp, 'proposals')),
        new ReceiptWriter(join(tmp, 'receipts')),
      );
      store.saveMapping({ otto_ticket_id: 'ticket_a', paperclip_task_id: 'pc-1' });
      store.saveMapping({ otto_ticket_id: 'ticket_a', paperclip_task_id: 'pc-2' });
      const mappings = store.listMappings();
      expect(mappings).toHaveLength(1);
      expect(mappings[0]?.paperclip_task_id).toBe('pc-2');
      expect(existsSync(mappingsPath)).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('completion without mapping is blocked with error', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-paperclip-miss-'));
    try {
      const store = new PaperclipStatusStore(
        join(tmp, 'paperclip', 'mappings.json'),
        new TicketStore(join(tmp, 'tickets')),
        new ProposalStore(join(tmp, 'proposals')),
        new ReceiptWriter(join(tmp, 'receipts')),
      );
      expect(() =>
        store.ingestCompletion({
          paperclip_task_id: 'missing-task',
          completed_at: new Date().toISOString(),
        }),
      ).toThrow(/No otto ticket mapping/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('does not mutate merged tickets', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-paperclip-merged-'));
    try {
      const ticketsDir = join(tmp, 'tickets');
      const receiptsDir = join(tmp, 'receipts');
      const tickets = new TicketStore(ticketsDir, new ReceiptWriter(receiptsDir));
      const compiled = tickets.compile({ slug: 'merged-slice', objective: 'Already merged.' });
      tickets.updateStatus(compiled.ticket.ticket_id, { status: 'active' });
      tickets.updateStatus(compiled.ticket.ticket_id, { status: 'review' });
      tickets.updateStatus(compiled.ticket.ticket_id, {
        status: 'merged',
        review: {
          verdict: '+1',
          evidence: ['receipts/2026-06-13/merged-slice.md'],
          reviewed_at: new Date().toISOString(),
        },
      });

      const store = new PaperclipStatusStore(
        join(tmp, 'paperclip', 'mappings.json'),
        tickets,
        new ProposalStore(join(tmp, 'proposals'), new ReceiptWriter(receiptsDir)),
        new ReceiptWriter(receiptsDir),
      );
      store.saveMapping({
        otto_ticket_id: compiled.ticket.ticket_id,
        paperclip_task_id: 'pc-merged',
      });

      expect(() =>
        store.ingestCompletion({
          paperclip_task_id: 'pc-merged',
          completed_at: new Date().toISOString(),
        }),
      ).toThrow(/merged/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('records review metadata on ticket yaml without advancing proposed status', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-paperclip-proposed-'));
    try {
      const ticketsDir = join(tmp, 'tickets');
      const receiptsDir = join(tmp, 'receipts');
      const tickets = new TicketStore(ticketsDir, new ReceiptWriter(receiptsDir));
      const compiled = tickets.compile({ slug: 'proposed-slice', objective: 'Still proposed.' });

      const store = new PaperclipStatusStore(
        join(tmp, 'paperclip', 'mappings.json'),
        tickets,
        new ProposalStore(join(tmp, 'proposals'), new ReceiptWriter(receiptsDir)),
        new ReceiptWriter(receiptsDir),
      );
      store.saveMapping({
        otto_ticket_id: compiled.ticket.ticket_id,
        paperclip_task_id: 'pc-proposed',
      });

      const result = store.ingestCompletion({
        paperclip_task_id: 'pc-proposed',
        completed_at: '2026-06-14T13:00:00.000Z',
      });

      expect(result.ticket_status).toBe('proposed');
      expect(result.signal.status_advanced).toBe(false);

      const raw = parse(readFileSync(compiled.ticket.ticketPath, 'utf8')) as Record<string, unknown>;
      const paperclip = raw.paperclip as Record<string, unknown>;
      expect(paperclip.review_requested_at).toBe('2026-06-14T13:00:00.000Z');
      expect(raw.status).toBe('proposed');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
