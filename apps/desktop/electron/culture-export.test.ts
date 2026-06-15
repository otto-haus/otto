import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, test } from 'bun:test';
import { CultureExporter } from './culture-export';

describe('CultureExporter', () => {
  let ottoDir = '';

  afterEach(() => {
    if (ottoDir) rmSync(ottoDir, { recursive: true, force: true });
  });

  test('export bundle includes canon dirs and passes secrets scan', () => {
    ottoDir = mkdtempSync(join(tmpdir(), 'otto-culture-export-'));
    const exporter = new CultureExporter(ottoDir);
    const result = exporter.exportBundle();

    expect(existsSync(result.bundlePath)).toBe(true);
    const stagingDir = result.bundlePath.endsWith('.zip')
      ? result.bundlePath.slice(0, -4)
      : result.bundlePath;
    expect(existsSync(join(stagingDir, 'manifest.json'))).toBe(true);

    const manifest = JSON.parse(readFileSync(join(stagingDir, 'manifest.json'), 'utf8')) as {
      includes: string[];
    };
    expect(manifest.includes).toContain('constitution.yaml');
    expect(manifest.includes.some((rel) => rel.startsWith('canon/standards'))).toBe(true);
    expect(manifest.includes.some((rel) => rel.startsWith('canon/practices'))).toBe(true);
    expect(manifest.includes.some((rel) => rel.startsWith('canon/routines'))).toBe(true);

    const bundleText = readFileSync(join(stagingDir, 'manifest.json'), 'utf8');
    expect(/\b(api[_-]?key|secret|token|password|bearer)\b/i.test(bundleText)).toBe(false);
  });

  test('export bundle includes compiled checks (#720) and curation proposals (#721)', () => {
    ottoDir = mkdtempSync(join(tmpdir(), 'otto-culture-export-state-'));
    mkdirSync(join(ottoDir, 'checks'), { recursive: true });
    writeFileSync(join(ottoDir, 'checks', 'evidence-first.yaml'), 'id: evidence-first\nstatus: active\n');
    mkdirSync(join(ottoDir, 'curation', 'proposals'), { recursive: true });
    writeFileSync(join(ottoDir, 'curation', 'proposals', 'prop_1.json'), '{"id":"prop_1","status":"proposed"}\n');

    const result = new CultureExporter(ottoDir).exportBundle();
    const stagingDir = result.bundlePath.endsWith('.zip')
      ? result.bundlePath.slice(0, -4)
      : result.bundlePath;

    const manifest = JSON.parse(readFileSync(join(stagingDir, 'manifest.json'), 'utf8')) as {
      includes: string[];
    };
    expect(manifest.includes).toContain('checks');
    expect(manifest.includes).toContain('curation/proposals');
    expect(existsSync(join(stagingDir, 'checks', 'evidence-first.yaml'))).toBe(true);
    expect(existsSync(join(stagingDir, 'curation', 'proposals', 'prop_1.json'))).toBe(true);
  });

  test('previewImport rejects manifest include paths that escape the workspace', () => {
    ottoDir = mkdtempSync(join(tmpdir(), 'otto-culture-import-'));
    const unsafeIncludes: unknown[][] = [
      ['../outside.md'],
      ['..\\outside.md'],
      ['/tmp/outside.md'],
      ['C:\\outside.md'],
      ['C:outside.md'],
      [''],
      ['.'],
      [null],
      ['constitution.yaml', 7],
    ];

    unsafeIncludes.forEach((includes, index) => {
      const bundleDir = join(ottoDir, `bundle-${index}`);
      mkdirSync(bundleDir, { recursive: true });
      writeManifest(bundleDir, includes);

      const preview = new CultureExporter(ottoDir).previewImport(bundleDir);

      expect(preview.valid).toBe(false);
      expect(preview.blocked_reason).toMatch(/unsafe/i);
      expect(preview.diff).toEqual([]);
    });
  });

  test('previewImport rejects manifest includes that are not arrays', () => {
    ottoDir = mkdtempSync(join(tmpdir(), 'otto-culture-import-'));
    const bundleDir = join(ottoDir, 'bundle');
    mkdirSync(bundleDir, { recursive: true });
    writeManifest(bundleDir, 'constitution.yaml');

    const preview = new CultureExporter(ottoDir).previewImport(bundleDir);

    expect(preview.valid).toBe(false);
    expect(preview.blocked_reason).toMatch(/includes must be an array/i);
    expect(preview.diff).toEqual([]);
  });
});

function writeManifest(bundleDir: string, includes: unknown): void {
  writeFileSync(join(bundleDir, 'manifest.json'), `${JSON.stringify({
    schema: 'otto.culture-export.v1',
    exported_at: '2026-06-14T00:00:00.000Z',
    workspace: 'test',
    includes,
    excludes: [],
    receipt_index_count: 0,
    constitution_hash: null,
  }, null, 2)}\n`);
}
