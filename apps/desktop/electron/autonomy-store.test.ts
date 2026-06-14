import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AutonomyStore, classifyAction } from './autonomy-store';
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
  });

  test('evaluateAction writes autonomy decision receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-autonomy-test-'));
    const receiptsDir = join(tmp, 'receipts');
    try {
      const store = new AutonomyStore(join(repoRoot, 'autonomy'), new ReceiptWriter(receiptsDir));
      const blocked = store.evaluateAction({ action: 'send customer email', context: 'ticket smoke' });
      expect(blocked.receipt.action).toBe('autonomy.action.evaluate');
      expect(blocked.receipt.subject.type).toBe('autonomy');
      expect(blocked.receipt.status).toBe('blocked');
      expect(blocked.receipt.blocker?.code).toBe('approval_required');
      expect(blocked.evaluation.door_id).toBe('send');

      const allowed = store.evaluateAction({ action: 'run bun test' });
      expect(allowed.receipt.status).toBe('success');
      expect(allowed.receipt.blocker).toBeNull();
      expect(allowed.evaluation.zone).toBe('green');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
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
});
