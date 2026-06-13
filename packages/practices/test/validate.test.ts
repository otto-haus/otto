import { describe, expect, test } from 'bun:test';
import type { PracticeSpec } from '@vinny-os/core';
import { loadPracticeSpec, normalizeApprovalRequirement, validatePracticeSpec } from '../src/index.js';

const root = '/Users/seb/Code/vinny-os/.letta/worktrees/practices-core';

const validSpec: PracticeSpec = {
  name: 'Example',
  slug: 'example',
  version: '0.1',
  status: 'draft',
  summary: 'Example practice.',
  invocations: ['/example run'],
  triggers: ['example trigger'],
  inputs: ['input'],
  outputs: ['output'],
  state_paths: ['examples/'],
  guardrails: ['guardrail'],
  evidence_standard: ['evidence'],
  metrics: ['uses'],
  owner: 'Vinny',
  approval_required_for: ['enabling-globally', 'external-side-effects', 'permission-expansion'],
};

describe('validatePracticeSpec', () => {
  test('accepts a valid practice spec', () => {
    expect(validatePracticeSpec(validSpec, 'example')).toEqual({ errors: [], warnings: [] });
  });

  test('reports a missing approval floor requirement', () => {
    const result = validatePracticeSpec(
      { ...validSpec, approval_required_for: ['enabling-globally', 'external-side-effects'] },
      'example',
    );

    expect(result.errors).toContain('approval_required_for must include approval floor requirement "permission-expansion"');
  });

  test('reports a slug mismatch', () => {
    const result = validatePracticeSpec(validSpec, 'different-directory');

    expect(result.errors).toContain('slug must equal directory name: expected "different-directory", got "example"');
  });

  test('reports empty evidence_standard', () => {
    const result = validatePracticeSpec({ ...validSpec, evidence_standard: [] }, 'example');

    expect(result.errors).toContain('evidence_standard must be a non-empty array of strings');
  });
});

describe('loadPracticeSpec', () => {
  test('normalizes approval wording from practice yaml into contract tokens', async () => {
    const spec = await loadPracticeSpec(`${root}/practices/charter/practice.yaml`);

    expect(spec.approval_required_for).toEqual([
      'enabling-globally',
      'external-side-effects',
      'permission-expansion',
    ]);
    expect(validatePracticeSpec(spec, 'charter').errors).toEqual([]);
  });

  test('maps outbound send wording to send-or-publish', () => {
    expect(normalizeApprovalRequirement('ANY send / post / publish / outbound touch')).toBe('send-or-publish');
  });
});
