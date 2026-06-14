import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReceiptWriter } from './receipt-writer';
import { ProposalStore, classifyProposal } from './proposal-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const practiceCanon = join(repoRoot, 'practices', 'charter', 'practice.yaml');

describe('ProposalStore', () => {
  test('creates a proposal from user correction with classification and receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const beforeCanon = statSync(practiceCanon).mtimeMs;

      const result = store.createFromCorrection({
        correction: 'Charter practice should require explicit receipt linkage on every status change.',
        rationale: 'We keep missing proof when charter status flips.',
        target: { kind: 'practice', id: 'charter', path: practiceCanon, action: 'update' },
        sourceReceiptId: 'receipt-example-1',
      });

      expect(result.proposal.schema).toBe('otto.proposal.v1');
      expect(result.proposal.source).toBe('user_correction');
      expect(result.proposal.kind).toBe('practice');
      expect(result.proposal.status).toBe('needs_approval');
      expect(result.proposal.classification.required_gate).toBe('human_ratification');
      expect(result.proposal.classification.canon_impact).toBe('practice');
      expect(result.proposal.evidence.length).toBeGreaterThanOrEqual(2);
      expect(result.proposal.receipt_id).toBe(result.receipt.id);
      expect(existsSync(result.proposal.path)).toBe(true);

      const listed = store.list();
      expect(listed.proposals.some((proposal) => proposal.id === result.proposal.id)).toBe(true);

      const afterCanon = statSync(practiceCanon).mtimeMs;
      expect(afterCanon).toBe(beforeCanon);
      expect(readFileSync(practiceCanon, 'utf8')).not.toContain('receipt linkage on every status change');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('classifies standards changes as high-risk ratification', () => {
    const classification = classifyProposal(
      { kind: 'standard', id: 'quality', action: 'update' },
      'Quality standard should forbid fake done language.',
    );
    expect(classification.risk).toBe('high');
    expect(classification.route).toBe('ask');
    expect(classification.required_gate).toBe('human_ratification');
  });

  test('accepting a proposal applies the ratified canon update and persists the decision', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'practice.yaml');
    writeFileSync(canonPath, 'slug: charter\nname: Charter\nguardrails: []\n');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Charter practice should require explicit receipt linkage on every status change.',
        rationale: 'Accepted changes must appear in the next file-backed practice load.',
        target: { kind: 'practice', id: 'charter', path: canonPath, action: 'update' },
      });

      const decided = store.decide(created.proposal.id, { decision: 'accept', note: 'Ratified by user.' });
      expect(decided.blocked).toBeUndefined();
      expect(decided.proposal.status).toBe('applied');
      expect(decided.proposal.decision_receipt_id).toBe(decided.receipt.id);
      expect(decided.receipt.action).toBe('curation.proposal.accept');
      expect(decided.receipt.result.data?.canonApplied).toBe(true);

      const canon = readFileSync(canonPath, 'utf8');
      expect(canon).toContain('otto_ratified');
      expect(canon).toContain(created.proposal.id);
      expect(canon).toContain('[ratified:');

      const reloaded = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir)).get(created.proposal.id);
      expect(reloaded?.status).toBe('applied');
      expect(reloaded?.decision_note).toBe('Ratified by user.');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('rejecting a proposal writes a receipt, leaves canon unchanged, and blocks retry', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'practice.yaml');
    const originalCanon = 'slug: charter\nname: Charter\nguardrails: []\n';
    writeFileSync(canonPath, originalCanon);
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Charter practice should add a rejected behavior.',
        target: { kind: 'practice', id: 'charter', path: canonPath, action: 'update' },
      });

      const rejected = store.decide(created.proposal.id, { decision: 'reject', note: 'Wrong behavior.' });
      expect(rejected.proposal.status).toBe('rejected');
      expect(rejected.receipt.action).toBe('curation.proposal.reject');
      expect(readFileSync(canonPath, 'utf8')).toBe(originalCanon);

      const retry = store.decide(created.proposal.id, { decision: 'accept' });
      expect(retry.blocked).toBe(true);
      expect(retry.receipt.status).toBe('blocked');
      expect(retry.receipt.blocker?.code).toBe('proposal_closed');
      expect(readFileSync(canonPath, 'utf8')).toBe(originalCanon);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('deferring a proposal writes a receipt and leaves canon unchanged', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'practice.yaml');
    const originalCanon = 'slug: charter\nname: Charter\nguardrails: []\n';
    writeFileSync(canonPath, originalCanon);
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Charter practice should wait for more review.',
        target: { kind: 'practice', id: 'charter', path: canonPath, action: 'update' },
      });

      const deferred = store.decide(created.proposal.id, { decision: 'defer', note: 'Need more context.' });
      expect(deferred.proposal.status).toBe('deferred');
      expect(deferred.proposal.decision_receipt_id).toBe(deferred.receipt.id);
      expect(deferred.receipt.action).toBe('curation.proposal.defer');
      expect(readFileSync(canonPath, 'utf8')).toBe(originalCanon);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('accepting a canon-impact proposal without a target path is blocked', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Quality standard should change, but no target path was provided.',
        target: { kind: 'standard', id: 'quality', action: 'update' },
      });

      const accepted = store.decide(created.proposal.id, { decision: 'accept' });
      expect(accepted.blocked).toBe(true);
      expect(accepted.proposal.status).toBe('needs_approval');
      expect(accepted.receipt.status).toBe('blocked');
      expect(accepted.receipt.blocker?.code).toBe('canon_apply_missing_target');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('persists and reloads proposal records', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    try {
      mkdirSync(proposalsDir, { recursive: true });
      writeFileSync(
        join(proposalsDir, 'prop_test.json'),
        `${JSON.stringify({
          schema: 'otto.proposal.v1',
          id: 'prop_test',
          source: 'manual',
          kind: 'task',
          summary: 'Test proposal',
          rationale: 'Because',
          evidence: [{ kind: 'message', ref: 'user.correction', note: 'Because' }],
          target: { kind: 'none' },
          classification: classifyProposal({ kind: 'none' }, 'Because'),
          status: 'proposed',
          created_at: '2026-06-13T00:00:00.000Z',
          updated_at: '2026-06-13T00:00:00.000Z',
          created_by: 'user',
        }, null, 2)}\n`,
      );

      const store = new ProposalStore(proposalsDir);
      const proposal = store.get('prop_test');
      expect(proposal?.summary).toBe('Test proposal');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('listApprovals derives ratification records from decided proposals', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'practice.yaml');
    writeFileSync(canonPath, 'slug: charter\nname: Charter\nguardrails: []\n');
    try {
      const receipts = new ReceiptWriter(receiptsDir);
      const store = new ProposalStore(proposalsDir, receipts);
      const created = store.createFromCorrection({
        correction: 'Charter practice should require explicit receipt linkage on every status change.',
        target: { kind: 'practice', id: 'charter', path: canonPath, action: 'update' },
      });
      store.decide(created.proposal.id, { decision: 'accept', note: 'Ratified.' });

      const approvals = store.listApprovals();
      expect(approvals.approvals.length).toBeGreaterThan(0);
      expect(approvals.approvals[0].proposal_id).toBe(created.proposal.id);
      expect(approvals.approvals[0].receipt_id).toBeTruthy();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

});
