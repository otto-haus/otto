import { describe, expect, test } from 'bun:test';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PracticeStore } from './practice-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const practicesDir = join(repoRoot, 'practices');

describe('PracticeStore', () => {
  test('loads Practices from file-backed canon', () => {
    const store = new PracticeStore(practicesDir);
    const result = store.listResult();

    expect(result.storage).toBe('files');
    expect(result.practices.length).toBeGreaterThanOrEqual(5);
    expect(result.skipped).toEqual([]);

    const charter = result.practices.find((practice) => practice.slug === 'charter');
    expect(charter?.status).toBe('active');
    expect(charter?.file).toBe(join(practicesDir, 'charter/practice.yaml'));
    expect(charter?.invocations).toContain('/charter step');
    expect(charter?.approval_required_for).toContain('enabling-globally');
  });

  test('resolves a Practice reference from invocation text', () => {
    const store = new PracticeStore(practicesDir);
    const reference = store.resolveForText('/charter step ship onboarding');

    expect(reference?.slug).toBe('charter');
    expect(reference?.invocation).toBe('/charter step');
    expect(reference?.ref).toContain('/practices/charter/practice.yaml');
  });

  test('does not resolve partial invocation words', () => {
    const store = new PracticeStore(practicesDir);

    expect(store.resolveForText('/charter stepper ship onboarding')).toBeNull();
  });
});
