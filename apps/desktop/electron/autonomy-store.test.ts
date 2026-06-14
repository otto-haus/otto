import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AutonomyStore, classifyAction } from './autonomy-store';
import { CheckRunner } from './check-runner';
import { CheckStore } from './check-store';
import { KnowledgeStore } from './knowledge-store';
import { ReceiptWriter } from './receipt-writer';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const policyPath = join(repoRoot, 'autonomy', 'policy.yaml');

describe('AutonomyStore', () => {
  test('loads file-backed policy with green/yellow/red zones and doors', () => {
    expect(existsSync(policyPath)).toBe(true);
    const store = new AutonomyStore(join(repoRoot, 'autonomy'));
    const loaded = store.loadResult();
    expect(loaded.storage).toBe('files');
    expect(loaded.policy.schema).toBe('otto.autonomy.policy.v1');
    expect(loaded.policy.zones.map((zone) => zone.id)).toEqual(['green', 'yellow', 'red']);
    expect(loaded.policy.doors.length).toBeGreaterThanOrEqual(6);
    expect(loaded.policy.settings.safe_auto_merge).toBe('disabled');
    expect(loaded.policy.limitations.some((line) => line.includes('Ticketcraft'))).toBe(true);
  });

  test('normalizes malformed max_parallel_workers to the default', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-autonomy-policy-'));
    try {
      writeFileSync(
        join(tmp, 'policy.yaml'),
        `version: "0.1"
summary: Test policy
doctrine: Test doctrine
settings:
  max_parallel_workers: many
`,
      );

      const loaded = new AutonomyStore(tmp).loadResult();

      expect(loaded.policy.settings.max_parallel_workers).toBe(3);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('classifies consequential actions as red and approval-required', () => {
    const store = new AutonomyStore(join(repoRoot, 'autonomy'));
    const policy = store.getPolicy();
    const deploy = classifyAction('deploy to production', policy, policyPath);
    expect(deploy.zone).toBe('red');
    expect(deploy.door_id).toBe('deploy');
    expect(deploy.requires_approval).toBe(true);
    expect(deploy.allowed_without_approval).toBe(false);
  });

  test('classifies reversible work as green without approval', () => {
    const store = new AutonomyStore(join(repoRoot, 'autonomy'));
    const policy = store.getPolicy();
    const tests = classifyAction('run tests in worktree', policy, policyPath);
    expect(tests.zone).toBe('green');
    expect(tests.requires_approval).toBe(false);
    expect(tests.allowed_without_approval).toBe(true);

    const orchestrate = classifyAction('orchestrate ticket_035', policy, policyPath);
    expect(orchestrate.zone).toBe('green');
    expect(orchestrate.allowed_without_approval).toBe(true);
  });

  test('classifies unknown actions as yellow, not green', () => {
    const store = new AutonomyStore(join(repoRoot, 'autonomy'));
    const policy = store.getPolicy();
    const unknown = classifyAction('do something completely unmapped xyz123', policy, policyPath);
    expect(unknown.zone).toBe('yellow');
    expect(unknown.requires_approval).toBe(true);
    expect(unknown.allowed_without_approval).toBe(false);
  });

  test('evaluateAction writes autonomy decision receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-autonomy-test-'));
    const receiptsDir = join(tmp, 'receipts');
    const checksDir = join(tmp, 'checks');
    try {
      process.env.OTTO_CHECKS_DIR = checksDir;
      const checkStore = new CheckStore(checksDir);
      checkStore.listResult();
      const checks = new CheckRunner(checkStore, new ReceiptWriter(receiptsDir));
      const store = new AutonomyStore(join(repoRoot, 'autonomy'), new ReceiptWriter(receiptsDir), new KnowledgeStore(), checks);
      const blocked = store.evaluateAction({ action: 'send customer email', context: 'ticket smoke' });
      expect(blocked.receipt.action).toBe('autonomy.action.evaluate');
      expect(blocked.receipt.subject.type).toBe('autonomy');
      expect(blocked.receipt.status).toBe('blocked');
      expect(blocked.receipt.blocker?.code).toBe('approval_required');
      expect(blocked.evaluation.door_id).toBe('send');
      expect(blocked.check_results?.some((r) => r.check_id === 'one-way-door-approval' && !r.passed)).toBe(true);

      const allowed = store.evaluateAction({ action: 'run bun test' });
      expect(allowed.receipt.status).toBe('success');
      expect(allowed.receipt.blocker).toBeNull();
      expect(allowed.evaluation.zone).toBe('green');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('evaluateAction passes one-way door check when session is allowed', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-autonomy-session-'));
    const receiptsDir = join(tmp, 'receipts');
    const checksDir = join(tmp, 'checks');
    try {
      process.env.OTTO_CHECKS_DIR = checksDir;
      const checkStore = new CheckStore(checksDir);
      checkStore.listResult();
      const checks = new CheckRunner(checkStore, new ReceiptWriter(receiptsDir));
      const store = new AutonomyStore(join(repoRoot, 'autonomy'), new ReceiptWriter(receiptsDir), new KnowledgeStore(), checks);
      const result = store.evaluateAction({
        action: 'deploy to production',
        session_allowed: true,
      });
      expect(result.check_results?.find((r) => r.check_id === 'one-way-door-approval')?.passed).toBe(true);
      expect(result.receipt.status).toBe('blocked');
      expect(result.evaluation.requires_approval).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('evaluateAction attaches knowledge routing for review actions', () => {
    const store = new AutonomyStore(
      join(repoRoot, 'autonomy'),
      new ReceiptWriter(),
      new KnowledgeStore(join(repoRoot, 'knowledge')),
    );
    const result = store.evaluateAction({ action: 'run standards review', context: 'quality gate' });
    expect(result.evaluation.knowledge_routing?.role).toBe('standards_review');
    expect(result.evaluation.knowledge_routing?.model).toBeTruthy();
  });

  test('classifies cognee capture apply as yellow (approval required)', () => {
    const store = new AutonomyStore(join(repoRoot, 'autonomy'));
    const policy = store.getPolicy();
    const capture = classifyAction('cognee capture apply index', policy, policyPath);
    expect(capture.zone).toBe('yellow');
    expect(capture.requires_approval).toBe(true);
  });

  test('classifies cognee recall read as green or yellow — not silent red deploy', () => {
    const store = new AutonomyStore(join(repoRoot, 'autonomy'));
    const policy = store.getPolicy();
    const recall = classifyAction('cognee recall search local graph', policy, policyPath);
    expect(recall.zone).toBe('green');
    expect(recall.requires_approval).toBe(false);
    expect(recall.door_id).not.toBe('deploy');
  });

  test('classifies cognee.delete as red with delete door', () => {
    const store = new AutonomyStore(join(repoRoot, 'autonomy'));
    const policy = store.getPolicy();
    const del = classifyAction('cognee.delete purge graph', policy, policyPath);
    expect(del.zone).toBe('red');
    expect(del.door_id).toBe('delete');
    expect(del.requires_approval).toBe(true);
  });

  test('policy.yaml documents cognee action classes', () => {
    const store = new AutonomyStore(join(repoRoot, 'autonomy'));
    const raw = store.loadResult();
    expect(existsSync(policyPath)).toBe(true);
    const yaml = readFileSync(policyPath, 'utf8');
    expect(yaml).toContain('cognee.recall');
    expect(yaml).toContain('cognee.capture');
    expect(yaml).toContain('cognee.delete');
    expect(raw.policy.limitations.length).toBeGreaterThan(0);
  });
});
