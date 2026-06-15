import { describe, expect, test } from 'bun:test';
import {
  classifyCaptureSourceKind,
  dedupeAgainstPriorCaptures,
  filterAllowedCapturePaths,
  isForbiddenCapturePath,
  loadPriorContentHashes,
  pathMatchesCaptureKind,
  recallSpotCheckFromReceipt,
  selectSmokeCapturePaths,
  toRepoRelativePath,
} from './cognee-capture.js';

const ROOT = '/Users/seb/Code/otto';

describe('cognee capture allowlist', () => {
  test('forbids secrets and env paths', () => {
    expect(isForbiddenCapturePath('/repo/.env')).toBe(true);
    expect(isForbiddenCapturePath('/repo/secrets/api.key')).toBe(true);
    expect(isForbiddenCapturePath('/repo/receipts/otto-v01/foo.md')).toBe(false);
  });

  test('filterAllowedCapturePaths drops forbidden entries', () => {
    const paths = [
      `${ROOT}/receipts/otto-v01/a.md`,
      `${ROOT}/.env`,
      `${ROOT}/secrets/token.txt`,
    ];
    const allowed = filterAllowedCapturePaths(paths);
    expect(allowed).toHaveLength(1);
    expect(allowed[0]).toContain('receipts/otto-v01/a.md');
  });

  test('classifies source kinds from repo-relative paths', () => {
    expect(classifyCaptureSourceKind('receipts/otto-v01/x.md')).toBe('receipt');
    expect(classifyCaptureSourceKind('receipts/cognee/capture/x.json')).toBe('manual');
    expect(classifyCaptureSourceKind('standards/precedents/p.md')).toBe('precedent');
    expect(classifyCaptureSourceKind('standards/foo.md')).toBe('standard');
    expect(classifyCaptureSourceKind('planning/hq-tickets/_Done/043.md')).toBe('ticket');
    expect(classifyCaptureSourceKind('charters/main.md')).toBe('charter');
  });

  test('pathMatchesCaptureKind respects receipt cognee exclusion', () => {
    expect(pathMatchesCaptureKind('receipts/otto-v01/a.md', 'receipt')).toBe(true);
    expect(pathMatchesCaptureKind('receipts/cognee/capture/x.json', 'receipt')).toBe(false);
    expect(pathMatchesCaptureKind('standards/precedents/p.md', 'precedent')).toBe(true);
  });

  test('selectSmokeCapturePaths picks at least three receipts and one precedent', () => {
    const paths = [
      `${ROOT}/receipts/otto-v01/a.md`,
      `${ROOT}/receipts/otto-v01/b.md`,
      `${ROOT}/receipts/otto-v01/c.md`,
      `${ROOT}/receipts/otto-v01/d.md`,
      `${ROOT}/standards/precedents/p.md`,
      `${ROOT}/standards/precedents/q.md`,
    ];
    const smoke = selectSmokeCapturePaths(paths, ROOT);
    expect(smoke.filter((p) => p.includes('receipts'))).toHaveLength(3);
    expect(smoke.filter((p) => p.includes('precedents'))).toHaveLength(1);
  });

  test('toRepoRelativePath strips root prefix', () => {
    expect(toRepoRelativePath(`${ROOT}/receipts/foo.md`, ROOT)).toBe('receipts/foo.md');
  });
});

describe('cognee capture idempotency', () => {
  test('dedupeAgainstPriorCaptures skips unchanged hashes', () => {
    const prior = new Map([['receipts/a.md', 'hash-a']]);
    const entries = [
      { absPath: `${ROOT}/receipts/a.md`, repo_path: 'receipts/a.md', content_hash: 'hash-a' },
      { absPath: `${ROOT}/receipts/b.md`, repo_path: 'receipts/b.md', content_hash: 'hash-b' },
    ];
    const { toIngest, skipped } = dedupeAgainstPriorCaptures(entries, prior);
    expect(skipped).toEqual(['receipts/a.md']);
    expect(toIngest).toHaveLength(1);
    expect(toIngest[0]?.repo_path).toBe('receipts/b.md');
  });

  test('loadPriorContentHashes reads entries from prior receipts', () => {
    const map = loadPriorContentHashes([
      {
        entries: [
          { source_kind: 'receipt', repo_path: 'receipts/x.md', content_hash: 'abc', captured_at: 't' },
        ],
      },
    ]);
    expect(map.get('receipts/x.md')).toBe('abc');
  });
});

describe('cognee recall spot-check', () => {
  test('recallSpotCheckFromReceipt returns receipts/ citation', () => {
    const result = recallSpotCheckFromReceipt({
      paths: [],
      entries: [
        {
          source_kind: 'receipt',
          repo_path: 'receipts/otto-v01/demo.md',
          content_hash: 'x',
          captured_at: '2026-06-14T00:00:00Z',
        },
        {
          source_kind: 'precedent',
          repo_path: 'standards/precedents/p.md',
          content_hash: 'y',
          captured_at: '2026-06-14T00:00:00Z',
        },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.citations[0]?.path).toContain('receipts/');
  });
});
