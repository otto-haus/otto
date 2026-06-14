import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { CurationProposalRecord } from '@otto-haus/core';
import { CheckCompiler } from './check-compiler';
import { CheckStore } from './check-store';
import { ReceiptWriter } from './receipt-writer';
import { ReceiptStore } from './receipt-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const qualityStandard = join(repoRoot, 'standards/standards/quality.md');

function proposalFixture(overrides: Partial<CurationProposalRecord> & { target: CurationProposalRecord['target'] }): CurationProposalRecord {
  const now = '2026-06-13T12:00:00.000Z';
  return {
    schema: 'otto.proposal.v1',
    id: 'prop_20260613_test',
    source: 'manual',
    kind: 'standard',
    summary: 'Ratify quality standard',
    rationale: 'Compile to check.',
    evidence: [{ kind: 'message', ref: 'user.correction', note: 'Fixture' }],
    target: overrides.target,
    classification: {
      reversibility: 'hard_to_reverse',
      scope: 'internal',
      canon_impact: 'standard',
      risk: 'high',
      required_gate: 'human_ratification',
      route: 'ask',
      reason: 'Canon-changing proposals require human ratification before apply.',
    },
    status: 'applied',
    created_at: now,
    updated_at: now,
    created_by: 'user',
    path: join(tmpdir(), 'prop_fixture.json'),
    ...overrides,
  };
}

describe('CheckCompiler', () => {
  test('compiles ratified quality standard into active check with receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-check-compile-'));
    const checksDir = join(tmp, 'checks');
    const receiptsDir = join(tmp, 'receipts');
    try {
      process.env.OTTO_CHECKS_DIR = checksDir;
      const store = new CheckStore(checksDir);
      const receipts = new ReceiptWriter(receiptsDir);
      const compiler = new CheckCompiler(store, receipts);

      const proposal = proposalFixture({
        target: { kind: 'standard', id: 'quality', path: qualityStandard, action: 'update' },
      });
      const result = compiler.compileFromProposal(proposal, join(repoRoot, 'standards/standards'));

      expect(result.compiled).not.toBeNull();
      expect(result.compiled?.id).toBe('completion-requires-receipts');
      expect(result.compiled?.source).toContain('quality');
      expect(result.compiled?.compiled_from_proposal_id).toBe(proposal.id);
      expect(existsSync(join(checksDir, 'completion-requires-receipts.yaml'))).toBe(true);

      const listed = store.listResult();
      expect(listed.checks.some((c) => c.id === 'completion-requires-receipts')).toBe(true);

      const receiptList = new ReceiptStore(receiptsDir).list();
      const compiledSummary = receiptList.receipts.find((r) => r.action === 'check.compiled');
      expect(compiledSummary?.status).toBe('success');
      expect(compiledSummary?.subjectType).toBe('check');
      expect(compiledSummary?.subjectId).toBe('completion-requires-receipts');
      const compiledReceipt = new ReceiptStore(receiptsDir).get(compiledSummary!.id);
      expect(compiledReceipt?.input?.proposal_id).toBe(proposal.id);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('re-compiling bumps patch version idempotently on same check id', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-check-bump-'));
    const checksDir = join(tmp, 'checks');
    try {
      process.env.OTTO_CHECKS_DIR = checksDir;
      const store = new CheckStore(checksDir);
      const compiler = new CheckCompiler(store, new ReceiptWriter(join(tmp, 'receipts')));
      const target = { kind: 'standard' as const, id: 'quality', path: qualityStandard, action: 'update' as const };
      const proposal = proposalFixture({ target });

      const first = compiler.compileFromProposal(proposal, join(repoRoot, 'standards/standards'));
      const second = compiler.compileFromProposal({ ...proposal, id: 'prop_20260613_test2' }, join(repoRoot, 'standards/standards'));

      expect(first.compiled?.version).toBe('1.0.1');
      expect(second.compiled?.version).toBe('1.0.2');
      expect(store.listResult().checks.filter((c) => c.id === 'completion-requires-receipts')).toHaveLength(1);

      const onDisk = parse(readFileSync(join(checksDir, 'completion-requires-receipts.yaml'), 'utf8')) as { version: string };
      expect(onDisk.version).toBe('1.0.2');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('skips non-compilable standard without writing a check file', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-check-skip-'));
    const checksDir = join(tmp, 'checks');
    const standardPath = join(tmp, 'judgment.md');
    writeFileSync(standardPath, '# Judgment\n\nNot in compile map.\n');
    try {
      process.env.OTTO_CHECKS_DIR = checksDir;
      const store = new CheckStore(checksDir);
      store.listResult();
      const compiler = new CheckCompiler(store, new ReceiptWriter(join(tmp, 'receipts')));

      const result = compiler.compileFromProposal(
        proposalFixture({
          target: { kind: 'standard', id: 'judgment', path: standardPath, action: 'update' },
        }),
        tmp,
      );

      expect(result.compiled).toBeNull();
      expect(result.skipped).toMatch(/No compilable check mapping/);
      expect(readdirYamlCount(checksDir)).toBe(2);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });
});

function readdirYamlCount(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml')).length;
}
