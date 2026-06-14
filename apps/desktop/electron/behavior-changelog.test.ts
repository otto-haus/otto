import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BehaviorChangelog } from './behavior-changelog';
import { ProposalStore } from './proposal-store';
import { ReceiptWriter } from './receipt-writer';
import { ReceiptStore } from './receipt-store';
import { ConstitutionStore } from './constitution-store';

describe('BehaviorChangelog', () => {
  test('empty week returns honest empty message', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-changelog-'));
    const originalOttoHome = process.env.OTTO_HOME;
    process.env.OTTO_HOME = tmp;
    try {
      const proposalsDir = join(tmp, 'curation', 'proposals');
      const receiptsDir = join(tmp, 'receipts');
      mkdirSync(proposalsDir, { recursive: true });
      mkdirSync(receiptsDir, { recursive: true });
      const changelog = new BehaviorChangelog(
        new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir)),
        new ReceiptStore(receiptsDir),
        new ConstitutionStore(join(tmp, 'constitution.yaml'), join(tmp, 'constitution.md'), new ReceiptWriter(receiptsDir)),
      );
      const result = changelog.list();
      expect(result.entries).toHaveLength(0);
      expect(result.empty_message).toBe('No behavior changes this week.');
      expect(result.dir).toBe(tmp);
    } finally {
      if (originalOttoHome === undefined) {
        delete process.env.OTTO_HOME;
      } else {
        process.env.OTTO_HOME = originalOttoHome;
      }
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('default stores honor runtime OTTO_HOME', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-changelog-runtime-'));
    const originalOttoHome = process.env.OTTO_HOME;
    process.env.OTTO_HOME = tmp;
    try {
      const proposalsDir = join(tmp, 'curation', 'proposals');
      const receiptsDir = join(tmp, 'receipts');
      const canonPath = join(tmp, 'practice.yaml');
      writeFileSync(canonPath, 'slug: demo\nname: Demo\nguardrails: []\n');
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir), new ReceiptStore(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Always cite receipts when changing canon.',
        rationale: 'Missing proof on last change.',
        target: { kind: 'practice', id: 'demo', path: canonPath, action: 'update' },
      });
      const accepted = store.decide(created.proposal.id, { decision: 'accept' });

      const result = new BehaviorChangelog().list();

      expect(result.dir).toBe(tmp);
      expect(result.entries.some((e) => e.receipt_id === accepted.receipt.id)).toBe(true);
    } finally {
      if (originalOttoHome === undefined) {
        delete process.env.OTTO_HOME;
      } else {
        process.env.OTTO_HOME = originalOttoHome;
      }
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('applied proposal appears in changelog with receipt id', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-changelog-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'practice.yaml');
    writeFileSync(canonPath, 'slug: demo\nname: Demo\nguardrails: []\n');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Always cite receipts when changing canon.',
        rationale: 'Missing proof on last change.',
        target: { kind: 'practice', id: 'demo', path: canonPath, action: 'update' },
      });
      const accepted = store.decide(created.proposal.id, { decision: 'accept' });
      const changelog = new BehaviorChangelog(
        store,
        new ReceiptStore(receiptsDir),
        new ConstitutionStore(join(tmp, 'constitution.yaml'), join(tmp, 'constitution.md'), new ReceiptWriter(receiptsDir)),
      );
      const result = changelog.list();
      expect(result.entries.some((e) => e.receipt_id === accepted.receipt.id)).toBe(true);
      expect(result.entries[0]?.source).toBe('proposal_ratified');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
