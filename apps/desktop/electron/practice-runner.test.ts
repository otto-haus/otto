import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AutonomyStore } from './autonomy-store';
import { PracticeMetricsStore } from './practice-metrics-store';
import { PracticeRunner } from './practice-runner';
import { PracticeStore } from './practice-store';
import { ReceiptWriter } from './receipt-writer';
import { RunStore } from './run-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const practicesDir = join(repoRoot, 'practices');

describe('PracticeRunner', () => {
  test('charter step writes receipt with practice reference and run id', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-practice-test-'));
    try {
      const runner = new PracticeRunner(
        new PracticeStore(practicesDir),
        new RunStore(join(tmp, 'runs')),
        new ReceiptWriter(join(tmp, 'receipts')),
        new PracticeMetricsStore(join(tmp, 'metrics')),
        new AutonomyStore(),
      );
      const result = runner.run({ slug: 'charter', invocation: '/charter step', payload: { intent: 'ship onboarding' } });

      expect(result.receipt.action).toBe('practice.charter.run');
      expect(result.receipt.practice?.slug).toBe('charter');
      expect(result.receipt.practice?.invocation).toBe('/charter step');
      expect(result.run.practice).toBe('charter');
      expect(result.blocked).toBe(false);
      expect(runner.metricsFor('charter').last_used_at).toBeTruthy();
      expect(runner.metricsFor('charter').last_receipt_id).toBe(result.receipt.id);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('review done runs done_claim checks and blocks without evidence', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-practice-test-'));
    try {
      const runner = new PracticeRunner(
        new PracticeStore(practicesDir),
        new RunStore(join(tmp, 'runs')),
        new ReceiptWriter(join(tmp, 'receipts')),
        new PracticeMetricsStore(join(tmp, 'metrics')),
        new AutonomyStore(),
      );
      const result = runner.run({
        slug: 'review',
        invocation: '/review done',
        payload: {
          acceptance_criteria: [{ id: 'AC1', text: 'Receipt emitted' }],
        },
      });

      expect(result.receipt.action).toBe('practice.review.done');
      expect(result.receipt.status).toBe('blocked');
      expect(result.check_results?.some((r) => !r.passed)).toBe(true);
      expect(result.receipt.result.data.recommendation).toBe('fail');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('review done passes with mapped proof suitable for 051 gate', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-practice-test-'));
    try {
      const runner = new PracticeRunner(
        new PracticeStore(practicesDir),
        new RunStore(join(tmp, 'runs')),
        new ReceiptWriter(join(tmp, 'receipts')),
        new PracticeMetricsStore(join(tmp, 'metrics')),
        new AutonomyStore(),
      );
      const result = runner.run({
        slug: 'review',
        invocation: '/review done',
        payload: {
          acceptance_criteria: [{ id: 'AC1', text: 'Receipt emitted', proof: 'receipt-123' }],
          review: { verdict: '+1', evidence: ['receipts/test.json'], reviewed_at: new Date().toISOString() },
          evidence: ['receipts/test.json'],
        },
      });

      expect(result.receipt.status).toBe('success');
      expect(result.receipt.result.data.recommendation).toBe('pass');
      expect(result.blocked).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('field note capture appends artifact and receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-practice-test-'));
    const priorHome = process.env.OTTO_HOME;
    process.env.OTTO_HOME = tmp;
    try {
      const runner = new PracticeRunner(
        new PracticeStore(practicesDir),
        new RunStore(join(tmp, 'runs')),
        new ReceiptWriter(join(tmp, 'receipts')),
        new PracticeMetricsStore(join(tmp, 'metrics')),
        new AutonomyStore(),
      );
      const result = runner.run({
        slug: 'field-note',
        invocation: '/field-note capture',
        payload: {
          raw_note: 'Customer said: "We need proof before wire."',
          source: { who: 'Operator A', role: 'escrow officer', where: 'busy Friday', when: '2026-06-13' },
        },
      });

      expect(result.artifactPath).toBeTruthy();
      expect(existsSync(result.artifactPath!)).toBe(true);
      const body = readFileSync(result.artifactPath!, 'utf8');
      expect(body).toContain('We need proof before wire');
      expect(result.receipt.action).toBe('practice.field_note.capture');
      expect(result.receipt.evidence.some((e) => e.ref === result.artifactPath)).toBe(true);
    } finally {
      process.env.OTTO_HOME = priorHome;
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('blocks external side-effect invocations via autonomy floor', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-practice-test-'));
    try {
      const runner = new PracticeRunner(
        new PracticeStore(practicesDir),
        new RunStore(join(tmp, 'runs')),
        new ReceiptWriter(join(tmp, 'receipts')),
        new PracticeMetricsStore(join(tmp, 'metrics')),
        new AutonomyStore(),
      );
      const result = runner.run({
        slug: 'field-note',
        invocation: '/field-note capture',
        payload: { raw_note: 'please send this email now' },
      });

      expect(result.blocked).toBe(true);
      expect(result.receipt.action).toBe('autonomy.action.evaluate');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
