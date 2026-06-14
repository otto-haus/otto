import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCheck, CHECK_SCHEMA } from './check.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

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

  test('repo seed yaml declares otto.check.v1', () => {
    const text = readFileSync(join(repoRoot, 'checks/completion-requires-receipts.yaml'), 'utf8');
    expect(text).toContain('schema: otto.check.v1');
    expect(text).toContain('done_claim');
  });

  test('rejects malformed check', () => {
    const result = validateCheck({ schema: 'otto.check.v1', id: '' });
    expect(result.ok).toBe(false);
  });
});
