import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PracticeMiningLoop } from './practice-mining';
import { PracticeStore } from './practice-store';
import { ProposalStore } from './proposal-store';
import { ReceiptStore } from './receipt-store';
import { ReceiptWriter } from './receipt-writer';
import { isPracticeMiningGated, triggerPracticeMining } from './practice-mining-trigger';

function seedReceipts(dir: string, action: string, count: number): void {
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < count; i += 1) {
    writeFileSync(
      join(dir, `receipt-${action.replace(/[^a-z0-9]/gi, '-')}-${i}.json`),
      JSON.stringify({ schema: 'otto.receipt.v1', id: `r-${i}`, action, status: 'success' }),
    );
  }
}

function makeLoop(tmp: string): { loop: PracticeMiningLoop; proposals: ProposalStore } {
  const proposalsDir = join(tmp, 'curation', 'proposals');
  const receiptsDir = join(tmp, 'receipts');
  const practicesDir = join(tmp, 'practices');
  mkdirSync(practicesDir, { recursive: true });
  const proposals = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir), new ReceiptStore(receiptsDir));
  const loop = new PracticeMiningLoop(new PracticeStore(practicesDir), proposals, new ReceiptWriter(receiptsDir));
  return { loop, proposals };
}

describe('triggerPracticeMining (#636)', () => {
  test('Labs-gated off: does not run, returns gated marker', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-mine-'));
    try {
      const { loop, proposals } = makeLoop(tmp);
      const scanDir = join(tmp, 'scan');
      seedReceipts(scanDir, 'practice.charter.run', 3);

      const result = triggerPracticeMining({ enabled: false, loop, receiptsDir: scanDir });

      expect(isPracticeMiningGated(result)).toBe(true);
      // Nothing fired: no proposals surfaced to Curation.
      expect(proposals.list().proposals).toHaveLength(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('Labs-gated on: receipts trigger practice mining and surface proposals in Curation', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-mine-'));
    try {
      const { loop, proposals } = makeLoop(tmp);
      const scanDir = join(tmp, 'scan');
      seedReceipts(scanDir, 'practice.charter.run', 3);

      const result = triggerPracticeMining({ enabled: true, loop, receiptsDir: scanDir });

      expect(isPracticeMiningGated(result)).toBe(false);
      if (isPracticeMiningGated(result)) throw new Error('unreachable');

      // The dead path now fires: an observe receipt is written...
      expect(result.receipt.action).toBe('practice.mining.observe');
      expect(result.proposals.length).toBeGreaterThanOrEqual(1);

      // ...and the drafted Practice proposal is visible to Curation (same store).
      const surfaced = proposals.list().proposals;
      expect(surfaced.length).toBe(result.proposals.length);
      expect(surfaced.every((p) => p.kind === 'practice')).toBe(true);
      expect(surfaced.every((p) => p.status === 'needs_approval')).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('does not draft proposals below the minimum occurrence threshold', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-mine-'));
    try {
      const { loop, proposals } = makeLoop(tmp);
      const scanDir = join(tmp, 'scan');
      seedReceipts(scanDir, 'practice.charter.run', 1);

      const result = triggerPracticeMining({ enabled: true, loop, receiptsDir: scanDir, minOccurrences: 2 });
      expect(isPracticeMiningGated(result)).toBe(false);
      expect(proposals.list().proposals).toHaveLength(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
