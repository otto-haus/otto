import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse } from 'yaml';
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
      expect(result.proposals[0]?.target.action).toBe('create');
      expect(result.proposals[0]?.target.path).toContain('ticket-compile/practice.yaml');
      expect(result.proposals[0]?.status).toBe('needs_approval');
      expect(result.candidates).toContain('practice-from:ticket.compile');
      expect(result.receipt.result.data.proposalIds).toHaveLength(1);
    } finally {
      delete process.env.OTTO_HOME;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('mined practice proposal can be accepted and creates draft YAML', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-mining-'));
    process.env.OTTO_HOME = dir;
    const practicesDir = join(dir, 'practices');
    process.env.OTTO_PRACTICES_DIR = practicesDir;
    try {
      const receiptsDir = join(dir, 'receipts');
      mkdirSync(receiptsDir, { recursive: true });
      for (let i = 0; i < 2; i += 1) {
        writeFileSync(
          join(receiptsDir, `repeat-${i}.json`),
          JSON.stringify({ action: 'ticket.compile', id: `r${i}` }),
        );
      }

      const proposals = new ProposalStore();
      const loop = new PracticeMiningLoop(
        new PracticeStore(practicesDir),
        proposals,
        new ReceiptWriter(),
      );
      const result = loop.observe(receiptsDir);
      const proposal = result.proposals[0];
      expect(proposal?.target.path).toBe(join(practicesDir, 'ticket-compile', 'practice.yaml'));

      const accepted = proposals.decide(proposal!.id, { decision: 'accept' });
      expect(accepted.blocked).toBeUndefined();
      expect(accepted.proposal.status).toBe('applied');
      expect(existsSync(proposal!.target.path!)).toBe(true);

      const doc = parse(readFileSync(proposal!.target.path!, 'utf8')) as Record<string, unknown>;
      expect(doc.slug).toBe('ticket-compile');
      expect(doc.status).toBe('draft');
    } finally {
      delete process.env.OTTO_HOME;
      delete process.env.OTTO_PRACTICES_DIR;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
