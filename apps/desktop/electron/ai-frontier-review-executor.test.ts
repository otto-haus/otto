import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AiFrontierReviewExecutor } from './ai-frontier-review-executor';
import { KnowledgeStore } from './knowledge-store';
import { ProposalStore } from './proposal-store';
import { ReceiptWriter } from './receipt-writer';

function seedKnowledge(dir: string): void {
  const frontierDir = join(dir, 'ai-frontier');
  mkdirSync(join(dir, '_templates'), { recursive: true });
  mkdirSync(frontierDir, { recursive: true });
  writeFileSync(join(frontierDir, 'capability-notes.md'), '# Capability notes\n');
  writeFileSync(
    join(frontierDir, 'model-registry.yaml'),
    `version: 0.1
status: proposed
last_reviewed: "2026-01-01"
models:
  - provider: openai
    model: test-model
    last_verified: "2026-01-01"
routing:
  status: proposed
  assignments:
    ticket_worker: openai/test-model
`,
  );
}

describe('AiFrontierReviewExecutor', () => {
  test('manual run updates facts and writes receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ai-frontier-'));
    try {
      seedKnowledge(tmp);
      const registryPath = join(tmp, 'ai-frontier', 'model-registry.yaml');
      const executor = new AiFrontierReviewExecutor(
        new KnowledgeStore(tmp),
        new ReceiptWriter(join(tmp, 'receipts')),
        new ProposalStore(join(tmp, 'proposals')),
      );
      const result = executor.run();

      expect(result.receipt.action).toBe('knowledge.frontier_review.manual');
      expect(result.touched.length).toBeGreaterThan(0);
      expect(result.receipt.result.data.routingProposal).toBe(false);

      const registry = readFileSync(registryPath, 'utf8');
      expect(registry).toContain('last_reviewed:');
      expect(registry).toContain('last_verified:');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('manual run records one daily capability note when run twice', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ai-frontier-'));
    try {
      seedKnowledge(tmp);
      const notesPath = join(tmp, 'ai-frontier', 'capability-notes.md');
      const today = new Date().toISOString().slice(0, 10);
      const marker = `<!-- ai-frontier-review ${today} -->`;
      const executor = new AiFrontierReviewExecutor(
        new KnowledgeStore(tmp),
        new ReceiptWriter(join(tmp, 'receipts')),
        new ProposalStore(join(tmp, 'proposals')),
      );

      executor.run();
      executor.run();

      const notes = readFileSync(notesPath, 'utf8');
      expect(notes.split(marker).length - 1).toBe(1);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('routing change creates knowledge proposal instead of silent routing edit', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ai-frontier-'));
    try {
      seedKnowledge(tmp);
      const proposals = new ProposalStore(join(tmp, 'curation', 'proposals'));
      const executor = new AiFrontierReviewExecutor(
        new KnowledgeStore(tmp),
        new ReceiptWriter(join(tmp, 'receipts')),
        proposals,
      );
      const result = executor.run({
        routingChangeDetected: true,
        routingSummary: 'Shift docs_worker routing after benchmark review',
      });

      expect(result.routingProposalId).toBeTruthy();
      expect(result.receipt.result.data.routingProposal).toBe(true);
      const listed = proposals.list().proposals;
      expect(listed.some((p) => p.id === result.routingProposalId)).toBe(true);
      expect(listed.find((p) => p.id === result.routingProposalId)?.target.kind).toBe('knowledge');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('manual run skips malformed registry without crashing', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ai-frontier-'));
    try {
      const frontierDir = join(tmp, 'ai-frontier');
      mkdirSync(join(tmp, '_templates'), { recursive: true });
      mkdirSync(frontierDir, { recursive: true });
      const notesPath = join(frontierDir, 'capability-notes.md');
      const registryPath = join(frontierDir, 'model-registry.yaml');
      writeFileSync(notesPath, '# Capability notes\n');
      writeFileSync(registryPath, 'models: [unterminated\n');
      const executor = new AiFrontierReviewExecutor(
        new KnowledgeStore(tmp),
        new ReceiptWriter(join(tmp, 'receipts')),
        new ProposalStore(join(tmp, 'proposals')),
      );

      const result = executor.run();

      expect(result.receipt.action).toBe('knowledge.frontier_review.manual');
      expect(result.touched).toContain(notesPath);
      expect(result.touched).not.toContain(registryPath);
      expect(readFileSync(registryPath, 'utf8')).toBe('models: [unterminated\n');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
