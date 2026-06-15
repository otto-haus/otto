import { describe, expect, test } from 'bun:test';
import { parse } from 'yaml';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReceiptWriter } from './receipt-writer';
import { ReceiptStore } from './receipt-store';
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

  test('createFromCorrection preserves Chat message evidence refs', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const result = store.createFromCorrection({
        correction: 'Always cite precedent before improvising on Standards conflicts.',
        rationale: 'Chat correction from assistant mistake.',
        target: { kind: 'standard', id: 'candor-kindness', action: 'update' },
        evidence: [{ kind: 'message', ref: 'msg-abc-123', note: 'Otto guessed instead of citing case law.' }],
      });

      expect(result.proposal.evidence.some((e) => e.kind === 'message' && e.ref === 'msg-abc-123')).toBe(true);
      expect(result.proposal.summary).toContain('precedent');
      expect(result.receipt.action).toBe('curation.proposal.create');
      expect(store.list().proposals.some((p) => p.id === result.proposal.id)).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('classify preview matches IPC handler contract', () => {
    const classification = classifyProposal(
      { kind: 'memory', action: 'update' },
      'Remember to always write a receipt after manual routine runs.',
    );
    expect(classification.route).toBe('ask');
    expect(classification.required_gate).toBe('human_ratification');
  });

  test('memory_writeback proposals cannot skip Curation', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const result = store.createFromCorrection({
        correction: 'Remember to cite precedent before answering Standards questions.',
        rationale: 'Memory writeback from correction flow.',
        target: { kind: 'memory', action: 'update' },
      });

      expect(result.proposal.kind).toBe('memory_writeback');
      expect(result.proposal.status).toBe('needs_approval');
      expect(result.proposal.classification.route).toBe('ask');
      expect(result.proposal.classification.required_gate).toBe('human_ratification');
      expect(result.proposal.classification.canon_impact).toBe('memory');

      const accepted = store.decide(result.proposal.id, { decision: 'accept', note: 'Ratified memory writeback.' });
      expect(accepted.blocked).toBeUndefined();
      expect(accepted.proposal.status).toBe('applied');
      expect(accepted.receipt.action).toBe('curation.proposal.accept');
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

  test('accepting duplicate yaml practice rationale does not append duplicate ratified entries or guardrails', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-yaml-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'practice.yaml');
    const rationale = 'Accepted changes must appear in the next file-backed practice load.';
    writeFileSync(canonPath, 'slug: charter\nname: Charter\nguardrails: []\n');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const first = store.createFromCorrection({
        correction: 'Charter practice should require explicit receipt linkage on every status change.',
        rationale,
        target: { kind: 'practice', id: 'charter', path: canonPath, action: 'update' },
      });
      const second = store.createFromCorrection({
        correction: 'Charter practice should require explicit receipt linkage on every status change.',
        rationale,
        target: { kind: 'practice', id: 'charter', path: canonPath, action: 'update' },
      });

      const firstDecision = store.decide(first.proposal.id, { decision: 'accept', note: 'Ratified.' });
      const secondDecision = store.decide(second.proposal.id, { decision: 'accept', note: 'Ratified again.' });
      const doc = parse(readFileSync(canonPath, 'utf8')) as { otto_ratified?: Array<Record<string, unknown>>; guardrails?: string[] };
      const ratified = Array.isArray(doc.otto_ratified) ? doc.otto_ratified : [];
      const guardrails = Array.isArray(doc.guardrails) ? doc.guardrails : [];

      expect(firstDecision.receipt.result.data?.canonChanged).toBe(true);
      expect(secondDecision.proposal.status).toBe('applied');
      expect(secondDecision.receipt.result.data?.canonApplied).toBe(true);
      expect(secondDecision.receipt.result.data?.canonChanged).toBe(false);
      expect(secondDecision.receipt.result.data?.canonApplyReason).toBe('already_ratified');
      expect(ratified.filter((entry) => entry.rationale === rationale)).toHaveLength(1);
      expect(ratified.map((entry) => entry.proposal_id)).toContain(first.proposal.id);
      expect(ratified.map((entry) => entry.proposal_id)).not.toContain(second.proposal.id);
      expect(guardrails.filter((guardrail) => guardrail.includes(rationale))).toHaveLength(1);
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

  test('accepting a practice create proposal writes draft YAML at target path', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const practicesDir = join(tmp, 'practices');
    const canonPath = join(practicesDir, 'ticket-compile', 'practice.yaml');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromSystem({
        summary: 'Practice candidate from repeated ticket.compile',
        rationale: 'Observed 2 receipts with action "ticket.compile".',
        target: { kind: 'practice', id: 'ticket-compile', path: canonPath, action: 'create' },
        source: 'run_review',
        created_by: 'otto',
      });

      expect(existsSync(canonPath)).toBe(false);

      const accepted = store.decide(created.proposal.id, { decision: 'accept', note: 'Ratified mined practice.' });
      expect(accepted.blocked).toBeUndefined();
      expect(accepted.proposal.status).toBe('applied');
      expect(accepted.receipt.result.data?.canonApplied).toBe(true);
      expect(accepted.receipt.result.data?.canonApplyReason).toBe('created');
      expect(existsSync(canonPath)).toBe(true);

      const doc = parse(readFileSync(canonPath, 'utf8')) as Record<string, unknown>;
      expect(doc.slug).toBe('ticket-compile');
      expect(doc.status).toBe('draft');
      expect(doc.summary).toBe('Practice candidate from repeated ticket.compile');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('accepting a routine create proposal writes draft YAML at target path (#794)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'routines', 'morning-review', 'routine.yaml');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromSystem({
        summary: 'Routine candidate from repeated review cadence',
        rationale: 'Observed a recurring morning review correction.',
        target: { kind: 'routine', id: 'morning-review', path: canonPath, action: 'create' },
        source: 'run_review',
        created_by: 'otto',
      });

      const accepted = store.decide(created.proposal.id, { decision: 'accept', note: 'Ratified mined routine.' });
      expect(accepted.blocked).toBeUndefined();
      expect(accepted.proposal.status).toBe('applied');
      expect(accepted.receipt.result.data?.canonApplied).toBe(true);
      expect(accepted.receipt.result.data?.canonApplyReason).toBe('created');
      expect(existsSync(canonPath)).toBe(true);

      const doc = parse(readFileSync(canonPath, 'utf8')) as Record<string, unknown>;
      expect(doc.slug).toBe('morning-review');
      expect(doc.kind).toBe('routine');
      expect(doc.status).toBe('draft');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('accepting a standard create proposal writes draft markdown at target path (#794)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'standards', 'standards', 'evidence-first.md');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromSystem({
        summary: 'Standard candidate: evidence before done',
        rationale: 'Repeated blocked receipts cite missing evidence.',
        target: { kind: 'standard', id: 'evidence-first', path: canonPath, action: 'create' },
        source: 'run_review',
        created_by: 'otto',
      });

      const accepted = store.decide(created.proposal.id, { decision: 'accept', note: 'Ratified mined standard.' });
      expect(accepted.blocked).toBeUndefined();
      expect(accepted.proposal.status).toBe('applied');
      expect(accepted.receipt.result.data?.canonApplied).toBe(true);
      expect(accepted.receipt.result.data?.canonApplyReason).toBe('created');
      expect(existsSync(canonPath)).toBe(true);

      const raw = readFileSync(canonPath, 'utf8');
      expect(raw).toContain('otto:ratified');
      expect(raw).toContain('Standard candidate: evidence before done');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('accepting an amend practice proposal without an existing file is blocked', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'practices', 'missing', 'practice.yaml');
    try {
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Missing practice should gain a guardrail.',
        target: { kind: 'practice', id: 'missing', path: canonPath, action: 'update' },
      });

      const accepted = store.decide(created.proposal.id, { decision: 'accept' });
      expect(accepted.blocked).toBe(true);
      expect(accepted.proposal.status).toBe('needs_approval');
      expect(accepted.receipt.blocker?.code).toBe('canon_apply_missing_target');
      expect(existsSync(canonPath)).toBe(false);
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

  test('accepting a standard proposal compiles check and writes check.compiled receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-standard-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const checksDir = join(tmp, 'checks');
    const standardPath = join(tmp, 'quality.md');
    writeFileSync(standardPath, '# Quality\n\nslug: quality\n');
    try {
      process.env.OTTO_CHECKS_DIR = checksDir;
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Quality standard must block fake done claims.',
        rationale: 'Ratify quality standard for Culture CI compile path.',
        target: { kind: 'standard', id: 'quality', path: standardPath, action: 'update' },
      });

      const decided = store.decide(created.proposal.id, { decision: 'accept', note: 'Ratified.' });
      expect(decided.blocked).toBeUndefined();
      expect(decided.compiledCheckId).toBe('completion-requires-receipts');
      expect(existsSync(join(checksDir, 'completion-requires-receipts.yaml'))).toBe(true);

      const receipts = new ReceiptStore(receiptsDir).list();
      const compiledSummary = receipts.receipts.find((r) => r.action === 'check.compiled');
      expect(compiledSummary?.status).toBe('success');
      expect(compiledSummary?.subjectId).toBe('completion-requires-receipts');
      const compiledReceipt = new ReceiptStore(receiptsDir).get(compiledSummary!.id);
      expect(compiledReceipt?.input?.proposal_id).toBe(created.proposal.id);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('accepting duplicate markdown standard rationale does not append duplicate canon blocks', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-standard-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const checksDir = join(tmp, 'checks');
    const standardPath = join(tmp, 'quality.md');
    const rationale = 'Ratify quality standard for Culture CI compile path.';
    writeFileSync(standardPath, '# Quality\n\nslug: quality\n');
    try {
      process.env.OTTO_CHECKS_DIR = checksDir;
      const store = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir));
      const first = store.createFromCorrection({
        correction: 'Quality standard must block fake done claims.',
        rationale,
        target: { kind: 'standard', id: 'quality', path: standardPath, action: 'update' },
      });
      const second = store.createFromCorrection({
        correction: 'Quality standard must block fake done claims.',
        rationale,
        target: { kind: 'standard', id: 'quality', path: standardPath, action: 'update' },
      });

      const firstDecision = store.decide(first.proposal.id, { decision: 'accept', note: 'Ratified.' });
      const secondDecision = store.decide(second.proposal.id, { decision: 'accept', note: 'Ratified again.' });
      const canon = readFileSync(standardPath, 'utf8');

      expect(firstDecision.receipt.result.data?.canonChanged).toBe(true);
      expect(secondDecision.proposal.status).toBe('applied');
      expect(secondDecision.receipt.result.data?.canonApplied).toBe(true);
      expect(secondDecision.receipt.result.data?.canonChanged).toBe(false);
      expect(secondDecision.receipt.result.data?.canonApplyReason).toBe('already_ratified');
      expect((canon.match(new RegExp(rationale, 'g')) ?? [])).toHaveLength(1);
      expect(canon).toContain(first.proposal.id);
      expect(canon).not.toContain(second.proposal.id);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('listApprovals derives decision records from applied rejected and deferred proposals', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-proposal-test-'));
    const proposalsDir = join(tmp, 'curation', 'proposals');
    const receiptsDir = join(tmp, 'receipts');
    const canonPath = join(tmp, 'practice.yaml');
    writeFileSync(canonPath, 'slug: charter\nname: Charter\nguardrails: []\n');
    try {
      const receipts = new ReceiptWriter(receiptsDir);
      const store = new ProposalStore(proposalsDir, receipts, new ReceiptStore(receiptsDir));
      const created = store.createFromCorrection({
        correction: 'Charter practice should require explicit receipt linkage on every status change.',
        target: { kind: 'practice', id: 'charter', path: canonPath, action: 'update' },
      });
      store.decide(created.proposal.id, { decision: 'accept', note: 'Ratified.' });
      const rejected = store.createFromCorrection({
        correction: 'Quality standard should not add this rejected behavior.',
        target: { kind: 'standard', id: 'quality', action: 'update' },
      });
      store.decide(rejected.proposal.id, { decision: 'reject', note: 'Do not ratify.' });
      const deferred = store.createFromCorrection({
        correction: 'Routine activation should wait for more context.',
        target: { kind: 'routine', id: 'morning', action: 'activate' },
      });
      store.decide(deferred.proposal.id, { decision: 'defer', note: 'Needs more review.' });

      const approvals = store.listApprovals();
      expect(approvals.approvals).toHaveLength(3);
      expect(approvals.approvals).toEqual(expect.arrayContaining([
        expect.objectContaining({ proposal_id: created.proposal.id, status: 'approved' }),
        expect.objectContaining({ proposal_id: rejected.proposal.id, status: 'denied' }),
        expect.objectContaining({ proposal_id: deferred.proposal.id, status: 'deferred' }),
      ]));
      for (const approval of approvals.approvals) {
        expect(approval.receipt_id).toBeTruthy();
        expect(approval.receipt_path).toContain(receiptsDir);
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

});
