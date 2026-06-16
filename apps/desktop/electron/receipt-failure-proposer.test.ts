import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ProposalStore } from './proposal-store';
import { ReceiptWriter } from './receipt-writer';
import { proposeFromBlockedReceipt } from './receipt-failure-proposer';
import { onBlockedReceipt } from './receipt-events';

describe('receipt failure proposer (#658)', () => {
  const tmpRoots: string[] = [];

  afterEach(() => {
    while (tmpRoots.length) {
      rmSync(tmpRoots.pop()!, { recursive: true, force: true });
    }
  });

  it('drafts receipt_failure proposal from blocked receipt with 7d dedupe', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-receipt-failure-'));
    tmpRoots.push(tmp);
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
    const writer = new ReceiptWriter(receiptsDir);

    const blocked = writer.write({
      status: 'blocked',
      subject: { type: 'check', id: 'done-claim' },
      action: 'check.failed',
      input: { claim: 'done' },
      result: { summary: 'Done claim blocked' },
      evidence: [],
      blocker: {
        code: 'missing-evidence',
        message: 'No verification output attached',
        recoverable: true,
        next_action: 'Attach command output before claiming done.',
      },
    });

    proposeFromBlockedReceipt(store, blocked);
    proposeFromBlockedReceipt(store, blocked);

    const listed = store.list().proposals.filter((p) => p.source === 'receipt_failure');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.target.kind).toBe('none');
    expect(listed[0]?.evidence.some((entry) => entry.ref === blocked.id)).toBe(true);
  });

  it('skips curation and proposal blocked receipts to avoid recursion', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-receipt-failure-'));
    tmpRoots.push(tmp);
    const store = new ProposalStore(join(tmp, 'proposals'), new ReceiptWriter(join(tmp, 'receipts')));
    const writer = new ReceiptWriter(join(tmp, 'receipts'));

    const curationBlocked = writer.write({
      status: 'blocked',
      subject: { type: 'proposal', id: 'prop_test' },
      action: 'curation.proposal.accept',
      input: {},
      result: { summary: 'Proposal closed' },
      evidence: [],
      blocker: { code: 'proposal_closed', message: 'Already applied', recoverable: false },
    });

    proposeFromBlockedReceipt(store, curationBlocked);
    expect(store.list().proposals.filter((p) => p.source === 'receipt_failure')).toHaveLength(0);
  });

  it('receipt writer emits blocked events for listeners', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-receipt-failure-'));
    tmpRoots.push(tmp);
    const writer = new ReceiptWriter(join(tmp, 'receipts'));
    const seen: string[] = [];
    const off = onBlockedReceipt((receipt) => seen.push(receipt.id));

    writer.write({
      status: 'blocked',
      subject: { type: 'worker', id: 'w1' },
      action: 'worker.run_bounded',
      input: {},
      result: { summary: 'Worker blocked' },
      evidence: [],
      blocker: { code: 'limit', message: 'Autonomy limit', recoverable: true },
    });
    writer.write({
      status: 'success',
      subject: { type: 'worker', id: 'w1' },
      action: 'worker.run_bounded',
      input: {},
      result: { summary: 'Worker ok' },
      evidence: [],
      blocker: null,
    });

    off();
    expect(seen).toHaveLength(1);
  });
});
