import { describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PracticeSpec } from '@otto-haus/core';
import { loadPracticeSpec, normalizeApprovalRequirement, validatePracticeSpec } from '../src/index.js';

// Repo root resolved from this test file — portable across clones, no hardcoded absolute path.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

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
  owner: 'Otto',
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

  test('reports missing required scalar fields', () => {
    const result = validatePracticeSpec(
      {
        ...validSpec,
        name: '',
        version: '',
        summary: '',
        owner: '',
      },
      'example',
    );

    expect(result.errors).toContain('name must be present and non-empty');
    expect(result.errors).toContain('version must be present and non-empty');
    expect(result.errors).toContain('summary must be present and non-empty');
    expect(result.errors).toContain('owner must be present and non-empty');
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

  test('keeps missing version invalid instead of stringifying it', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'otto-practice-spec-'));
    const specPath = join(tempDir, 'practice.yaml');

    try {
      await writeFile(
        specPath,
        `name: Example
slug: example
status: draft
summary: Example practice.
invocations:
  - /example run
triggers:
  - example trigger
inputs:
  - input
outputs:
  - output
state_paths:
  - examples/
guardrails:
  - guardrail
evidence_standard:
  - evidence
metrics:
  - uses
owner: Otto
approval_required_for:
  - enabling globally
  - external side effects
  - permission expansion
`,
      );

      const spec = await loadPracticeSpec(specPath);

      expect((spec as Partial<PracticeSpec>).version).toBeUndefined();
      expect(validatePracticeSpec(spec, 'example').errors).toContain('version must be present and non-empty');
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });
});
