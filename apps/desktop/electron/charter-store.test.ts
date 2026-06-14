import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { CharterStore } from './charter-store';
import { ReceiptWriter } from './receipt-writer';

let tmp: string | null = null;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

function store() {
  tmp = mkdtempSync(join(tmpdir(), 'otto-charter-store-test-'));
  return new CharterStore(join(tmp, 'charters'), new ReceiptWriter(join(tmp, 'receipts')));
}

describe('CharterStore', () => {
  it('creates a file-backed charter and writes a creation receipt', () => {
    const result = store().create({
      slug: 'Ship Receipts',
      objective: 'Ship the receipts surface.',
      status: 'active',
      acceptanceCriteria: [{ id: 'AC1', text: 'Receipts are visible.' }],
    });

    expect(result.charter.schema).toBe('otto.charter.v1');
    expect(result.charter.slug).toBe('ship-receipts');
    expect(result.charter.status).toBe('active');
    expect(result.charter.acceptance_criteria[0]).toEqual({ id: 'AC1', text: 'Receipts are visible.', receipts: [] });
    expect(result.charter.receipt_ids).toContain(result.receipt.id);
    expect(result.charter.change_receipt_ids).toContain(result.receipt.id);
    expect(result.charter.approval_required_for_changes).toContain('external-side-effects');
    expect(existsSync(result.path)).toBe(true);
    expect(result.receipt.schema).toBe('otto.receipt.v1');
    expect(result.receipt.subject).toEqual({ type: 'charter', id: result.charter.id });
    expect(result.receipt.action).toBe('charter.created');
  });

  it('rejects invalid create status values before writing a charter', () => {
    const s = store();

    expect(() => s.create({
      slug: 'bad-status',
      objective: 'Do not persist invalid statuses.',
      status: 'done' as never,
      acceptanceCriteria: [{ id: 'AC1', text: 'Invalid status is rejected.' }],
    })).toThrow('Invalid charter status');
    expect(existsSync(join(tmp!, 'charters', 'bad-status', 'charter.json'))).toBe(false);
  });

  it('links run and receipt ids to a charter and records the change receipt', () => {
    const s = store();
    s.create({
      slug: 'ship-receipts',
      objective: 'Ship the receipts surface.',
      acceptanceCriteria: [{ id: 'AC1', text: 'Receipts are visible.' }],
    });

    const result = s.linkRunReceipt('ship-receipts', {
      runId: 'run-005',
      receiptId: 'receipt-005',
      summary: 'Mapped ticket 005 proof.',
    });

    expect(result.charter.run_ids).toEqual(['run-005']);
    expect(result.charter.receipt_ids).toContain('receipt-005');
    expect(result.charter.receipt_ids).toContain(result.receipt.id);
    expect(result.receipt.action).toBe('charter.references-linked');
    expect(result.receipt.input.runIds).toEqual(['run-005']);
    expect(result.receipt.input.receiptIds).toEqual(['receipt-005']);
  });

  it('changes charter status with an auditable receipt and persisted change log', () => {
    const s = store();
    s.create({
      slug: 'ship-receipts',
      objective: 'Ship the receipts surface.',
      status: 'active',
      acceptanceCriteria: [{ id: 'AC1', text: 'Receipts are visible.' }],
    });

    const result = s.updateStatus('ship-receipts', 'blocked', 'Blocked pending acceptance proof.');
    const persisted = JSON.parse(readFileSync(result.path, 'utf8'));

    expect(result.charter.status).toBe('blocked');
    expect(result.receipt.action).toBe('charter.status-changed');
    expect(result.receipt.input.fromStatus).toBe('active');
    expect(result.receipt.input.toStatus).toBe('blocked');
    expect(persisted.changes.at(-1).kind).toBe('status-changed');
    expect(persisted.changes.at(-1).receipt_id).toBe(result.receipt.id);
  });

  it('rejects invalid update status values without rewriting the charter', () => {
    const s = store();
    const created = s.create({
      slug: 'ship-receipts',
      objective: 'Ship the receipts surface.',
      status: 'active',
      acceptanceCriteria: [{ id: 'AC1', text: 'Receipts are visible.' }],
    });

    expect(() => s.updateStatus('ship-receipts', 'done' as never)).toThrow('Invalid charter status');
    const persisted = JSON.parse(readFileSync(created.path, 'utf8'));
    expect(persisted.status).toBe('active');
    expect(persisted.changes).toHaveLength(1);
  });

  it('blocks complete when acceptance criteria lack receipt proof', () => {
    const s = store();
    s.create({
      slug: 'ship-receipts',
      objective: 'Ship the receipts surface.',
      status: 'active',
      acceptanceCriteria: [{ id: 'AC1', text: 'Receipts are visible.' }],
    });

    expect(() => s.updateStatus('ship-receipts', 'complete')).toThrow(/missing receipt proof/i);
  });

  it('allows complete when every acceptance criterion has receipt proof', () => {
    const s = store();
    s.create({
      slug: 'ship-receipts',
      objective: 'Ship the receipts surface.',
      status: 'active',
      acceptanceCriteria: [{ id: 'AC1', text: 'Receipts are visible.' }],
    });

    s.linkRunReceipt('ship-receipts', { receiptId: 'receipt-ac1', acId: 'AC1' });
    const result = s.updateStatus('ship-receipts', 'complete');
    expect(result.charter.status).toBe('complete');
    expect(result.charter.acceptance_criteria[0]?.receipts).toContain('receipt-ac1');
  });
});
