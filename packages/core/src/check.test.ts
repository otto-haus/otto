import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCheck, CHECK_SCHEMA } from './check.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function loadCheckFixture(name: string) {
  const path = join(repoRoot, 'checks', `${name}.yaml`);
  return validateCheck(Bun.YAML.parse(readFileSync(path, 'utf8')));
}

describe('otto.check.v1', () => {
  test('validates completion-requires-receipts fixture shape', () => {
    const result = validateCheck({
      schema: CHECK_SCHEMA,
      id: 'completion-requires-receipts',
      version: '1.0.0',
      source: 'standard/no-fake-done.md',
      trigger: { event: 'done_claim' },
      inspect: {
        require: ['acceptance_criteria_mapped', 'evidence_attached', 'test_or_log_or_artifact_present'],
      },
      on_fail: {
        block_claim: true,
        message: 'Not done: missing mapped proof.',
        write_receipt: true,
      },
      active: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.check.id).toBe('completion-requires-receipts');
      expect(result.check.trigger.event).toBe('done_claim');
    }
  });

  test('loads completion-requires-receipts seed from disk', () => {
    const result = loadCheckFixture('completion-requires-receipts');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.check.schema).toBe(CHECK_SCHEMA);
      expect(result.check.id).toBe('completion-requires-receipts');
      expect(result.check.trigger.event).toBe('done_claim');
    }
  });

  test('loads one-way-door-approval seed from disk', () => {
    const result = loadCheckFixture('one-way-door-approval');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.check.trigger.event).toBe('one_way_door_action');
      expect(result.check.inspect.require).toContain('approval_present');
    }
  });

  test('rejects malformed check', () => {
    const result = validateCheck({ schema: 'otto.check.v1', id: '' });
    expect(result.ok).toBe(false);
  });
});
