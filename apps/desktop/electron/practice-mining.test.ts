import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ProposalStore } from './proposal-store';
import { PracticeMiningLoop } from './practice-mining';
import { PracticeStore } from './practice-store';
import { ReceiptWriter } from './receipt-writer';

describe('PracticeMiningLoop', () => {
  test('does not propose on single occurrence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-mining-'));
    process.env.OTTO_HOME = dir;
    try {
      const receiptsDir = join(dir, 'receipts');
      mkdirSync(receiptsDir, { recursive: true });
      writeFileSync(
        join(receiptsDir, 'one.json'),
        JSON.stringify({ action: 'ticket.compile', id: 'r1' }),
      );

      const loop = new PracticeMiningLoop(
        new PracticeStore(),
        new ProposalStore(),
        new ReceiptWriter(),
      );
      const result = loop.observe(receiptsDir);

      expect(result.proposals).toHaveLength(0);
      expect(result.candidates).toHaveLength(0);
      expect(result.receipt.action).toBe('practice.mining.observe');
      expect(result.receipt.input.receiptsDir).toBe(receiptsDir);
    } finally {
      delete process.env.OTTO_HOME;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('creates Curation proposal when action repeats', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-mining-'));
    process.env.OTTO_HOME = dir;
    try {
      const receiptsDir = join(dir, 'receipts');
      mkdirSync(receiptsDir, { recursive: true });
      for (let i = 0; i < 2; i += 1) {
        writeFileSync(
          join(receiptsDir, `repeat-${i}.json`),
          JSON.stringify({ action: 'ticket.compile', id: `r${i}` }),
        );
      }

      const loop = new PracticeMiningLoop(
        new PracticeStore(),
        new ProposalStore(),
        new ReceiptWriter(),
      );
      const result = loop.observe(receiptsDir);

      expect(result.proposals).toHaveLength(1);
      expect(result.proposals[0]?.target.kind).toBe('practice');
      expect(result.proposals[0]?.status).toBe('needs_approval');
      expect(result.candidates).toContain('practice-from:ticket.compile');
      expect(result.receipt.result.data.proposalIds).toHaveLength(1);
    } finally {
      delete process.env.OTTO_HOME;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
