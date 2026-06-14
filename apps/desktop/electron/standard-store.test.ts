import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StandardStore } from './standard-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const standardsDir = join(repoRoot, 'standards');

describe('StandardStore', () => {
  test('loads active Standards from file-backed canon', () => {
    const store = new StandardStore(standardsDir);
    const result = store.listResult();

    expect(result.storage).toBe('files');
    expect(result.registryPath).toBe(join(standardsDir, 'registry.yaml'));
    expect(result.registry.ratification.standards_changes_require_human).toBe(true);
    expect(result.skipped).toEqual([]);
    expect(result.standards.length).toBeGreaterThanOrEqual(6);

    const quality = result.standards.find((standard) => standard.slug === 'quality');
    expect(quality?.schema).toBe('otto.standard.v1');
    expect(quality?.file).toBe(join(standardsDir, 'standards/quality.md'));
    expect(quality?.meaning).toContain('Done means proven');
    expect(quality?.markdown).toContain('# Quality / No Fake Done');
  });

  test('creates runtime citations that point to Standard files', () => {
    const store = new StandardStore(standardsDir);
    const citations = store.citationsForText('done requires receipt proof before review');

    expect(citations.some((citation) => citation.slug === 'quality')).toBe(true);
    expect(citations[0].ref).toContain('/standards/');
    expect(citations[0].reason).toContain('file-backed Standards');
  });

  test('conflictForStandard surfaces candor vs kindness precedent', () => {
    const store = new StandardStore(standardsDir);
    const result = store.conflictForStandard('candor-kindness');

    expect(result).not.toBeNull();
    expect(result?.between).toContain('candor-kindness');
    expect(result?.precedent?.file).toBe('precedents/2026-06-13-candor-vs-kindness.md');
    expect(result?.precedent?.excerpt).toContain('Candor wins');
    expect(result?.tie_breaker).toContain('kindness');
  });

  test('conflict without precedent returns honest no case law message', () => {
    const store = new StandardStore(standardsDir);
    const result = store.conflictForStandard('quality');

    expect(result).not.toBeNull();
    expect(result?.between).toEqual(['quality', 'winning']);
    expect(result?.precedent).toBeUndefined();
    expect(result?.message).toContain('No case law yet');
  });

  test('readPrecedent returns null for missing file', () => {
    const store = new StandardStore(standardsDir);
    expect(store.readPrecedent('precedents/does-not-exist.md')).toBeNull();
  });

  test('readPrecedent rejects paths outside standards dir', () => {
    const root = mkdtempSync(join(tmpdir(), 'otto-standards-precedent-'));
    const standardsRoot = join(root, 'standards');
    const outside = join(root, 'outside.md');
    writeFileSync(outside, '## Decision\nOutside precedent should not be readable.');

    const store = new StandardStore(standardsRoot);

    expect(store.readPrecedent('../outside.md')).toBeNull();
  });

  test('readPrecedent rejects absolute paths outside standards dir', () => {
    const root = mkdtempSync(join(tmpdir(), 'otto-standards-precedent-'));
    const standardsRoot = join(root, 'standards');
    const outside = join(root, 'outside.md');
    mkdirSync(standardsRoot);
    writeFileSync(outside, '## Decision\nAbsolute outside precedent should not be readable.');

    const store = new StandardStore(standardsRoot);

    expect(store.readPrecedent(outside)).toBeNull();
  });

  test('readPrecedent rejects symlink escapes from standards dir', () => {
    const root = mkdtempSync(join(tmpdir(), 'otto-standards-precedent-'));
    const standardsRoot = join(root, 'standards');
    const precedentsRoot = join(standardsRoot, 'precedents');
    const outside = join(root, 'outside.md');
    mkdirSync(precedentsRoot, { recursive: true });
    writeFileSync(outside, '## Decision\nSymlinked outside precedent should not be readable.');
    symlinkSync(outside, join(precedentsRoot, 'outside.md'));

    const store = new StandardStore(standardsRoot);

    expect(store.readPrecedent('precedents/outside.md')).toBeNull();
  });

  test('IPC conflict-for-standard handler contract matches store lookup', () => {
    const store = new StandardStore(standardsDir);
    const handler = (slug: string) => store.conflictForStandard(slug);
    const result = handler('candor-kindness');

    expect(result).not.toBeNull();
    expect(result?.precedent?.file).toBe('precedents/2026-06-13-candor-vs-kindness.md');
    expect(result?.precedent?.excerpt).toContain('Candor wins');
    expect(result?.message).toContain('Case law applies');
  });
});
