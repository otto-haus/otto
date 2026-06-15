import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigStore } from './config-store';
import { CogneeStore, cogneeEnabled, isLoopbackUrl, writeCogneeRecallReceipt } from './cognee-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('CogneeStore helpers', () => {
  test('rejects non-loopback URLs', () => {
    expect(isLoopbackUrl('http://127.0.0.1:8000')).toBe(true);
    expect(isLoopbackUrl('http://localhost:8000/health')).toBe(true);
    expect(isLoopbackUrl('https://cognee.cloud')).toBe(false);
  });

  test('disabled by default', () => {
    const prev = process.env.OTTO_COGNEE_ENABLED;
    delete process.env.OTTO_COGNEE_ENABLED;
    expect(cogneeEnabled()).toBe(false);
    const health = new CogneeStore().health();
    expect(health.status).toBe('disabled');
    if (prev !== undefined) process.env.OTTO_COGNEE_ENABLED = prev;
  });

  test('recall smoke is honest when disabled', () => {
    const prev = process.env.OTTO_COGNEE_ENABLED;
    delete process.env.OTTO_COGNEE_ENABLED;
    const result = new CogneeStore().recallSmoke();
    expect(result.ok).toBe(false);
    expect(result.citations).toEqual([]);
    expect(result.error).toContain('disabled');
    if (prev !== undefined) process.env.OTTO_COGNEE_ENABLED = prev;
  });

  test('health rejects non-loopback base URL when enabled', () => {
    const prevEnabled = process.env.OTTO_COGNEE_ENABLED;
    const prevUrl = process.env.OTTO_COGNEE_BASE_URL;
    process.env.OTTO_COGNEE_ENABLED = '1';
    process.env.OTTO_COGNEE_BASE_URL = 'https://cognee.cloud';
    const health = new CogneeStore().health();
    expect(health.status).toBe('error');
    expect(health.lastError).toContain('loopback');
    if (prevEnabled !== undefined) process.env.OTTO_COGNEE_ENABLED = prevEnabled;
    else delete process.env.OTTO_COGNEE_ENABLED;
    if (prevUrl !== undefined) process.env.OTTO_COGNEE_BASE_URL = prevUrl;
    else delete process.env.OTTO_COGNEE_BASE_URL;
  });

  test('persists enabled flag in config when ConfigStore present', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-cognee-cfg-'));
    const prevDir = process.env.OTTO_CONFIG_DIR;
    const prevEnabled = process.env.OTTO_COGNEE_ENABLED;
    try {
      process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
      delete process.env.OTTO_COGNEE_ENABLED;
      const config = new ConfigStore();
      const store = new CogneeStore(config);
      expect(store.settings().enabled).toBe(false);
      store.saveSettings({ enabled: true, baseUrl: 'http://127.0.0.1:8000' });
      expect(config.get().cognee?.enabled).toBe(true);
      expect(cogneeEnabled(config)).toBe(true);
    } finally {
      if (prevDir !== undefined) process.env.OTTO_CONFIG_DIR = prevDir;
      else delete process.env.OTTO_CONFIG_DIR;
      if (prevEnabled !== undefined) process.env.OTTO_COGNEE_ENABLED = prevEnabled;
      else delete process.env.OTTO_COGNEE_ENABLED;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('captureDryRun lists allowlisted paths without secrets', () => {
    const prev = process.env.OTTO_ROOT;
    process.env.OTTO_ROOT = repoRoot;
    const result = new CogneeStore().captureDryRun();
    expect(result.count).toBeGreaterThan(0);
    expect(result.paths.some((p) => p.includes('receipts'))).toBe(true);
    expect(result.paths.every((p) => !p.includes('.env') && !p.includes('secrets'))).toBe(true);
    if (prev !== undefined) process.env.OTTO_ROOT = prev;
    else delete process.env.OTTO_ROOT;
  });

  test('recall smoke returns path-backed citations when ready and capture receipt exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-cognee-recall-'));
    const prevRoot = process.env.OTTO_ROOT;
    const prevEnabled = process.env.OTTO_COGNEE_ENABLED;
    const prevUrl = process.env.OTTO_COGNEE_BASE_URL;
    try {
      process.env.OTTO_ROOT = dir;
      process.env.OTTO_COGNEE_ENABLED = '1';
      process.env.OTTO_COGNEE_BASE_URL = 'http://127.0.0.1:8000';
      const captureDir = join(dir, 'receipts/cognee/capture');
      const receiptPath = join(dir, 'receipts/otto-v01/sample.md');
      const precedentPath = join(dir, 'standards/precedents/foo.md');
      mkdirSync(captureDir, { recursive: true });
      writeFileSync(
        join(captureDir, 'capture-test.json'),
        JSON.stringify({
          id: 'capture-test',
          capturedAt: '2026-06-14T00:00:00Z',
          paths: [receiptPath, precedentPath],
        }),
      );

      const store = new CogneeStore();
      const healthSpy = store.health.bind(store);
      store.health = () => ({
        status: 'ready',
        baseUrl: 'http://127.0.0.1:8000',
        lastError: null,
        lastCheckedAt: new Date().toISOString(),
      });

      const result = store.recallSmoke('receipt precedent');
      expect(result.ok).toBe(true);
      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.citations.map((citation) => citation.path)).toEqual([
        'receipts/otto-v01/sample.md',
        'standards/precedents/foo.md',
      ]);
      store.health = healthSpy;
    } finally {
      if (prevRoot !== undefined) process.env.OTTO_ROOT = prevRoot;
      else delete process.env.OTTO_ROOT;
      if (prevEnabled !== undefined) process.env.OTTO_COGNEE_ENABLED = prevEnabled;
      else delete process.env.OTTO_COGNEE_ENABLED;
      if (prevUrl !== undefined) process.env.OTTO_COGNEE_BASE_URL = prevUrl;
      else delete process.env.OTTO_COGNEE_BASE_URL;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('latestCapture picks the newest capture by timestamp, not filename', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-cognee-latest-'));
    const prevRoot = process.env.OTTO_ROOT;
    try {
      process.env.OTTO_ROOT = dir;
      const captureDir = join(dir, 'receipts/cognee/capture');
      mkdirSync(captureDir, { recursive: true });
      writeFileSync(
        join(captureDir, 'capture-z-old.json'),
        JSON.stringify({ id: 'old', capturedAt: '2026-06-14T00:00:00Z', paths: ['/old.md'] }),
      );
      writeFileSync(
        join(captureDir, 'capture-a-new.json'),
        JSON.stringify({ id: 'new', capturedAt: '2026-06-14T01:00:00Z', paths: ['/new.md'] }),
      );

      expect(new CogneeStore().latestCapture()?.id).toBe('new');
    } finally {
      if (prevRoot !== undefined) process.env.OTTO_ROOT = prevRoot;
      else delete process.env.OTTO_ROOT;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('latestCapture skips malformed capture receipts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-cognee-malformed-'));
    const prevRoot = process.env.OTTO_ROOT;
    try {
      process.env.OTTO_ROOT = dir;
      const captureDir = join(dir, 'receipts/cognee/capture');
      mkdirSync(captureDir, { recursive: true });
      writeFileSync(join(captureDir, 'capture-z-bad.json'), '{');
      writeFileSync(
        join(captureDir, 'capture-a-valid.json'),
        JSON.stringify({ id: 'valid', capturedAt: '2026-06-14T01:00:00Z', paths: ['/valid.md'] }),
      );

      expect(new CogneeStore().latestCapture()?.id).toBe('valid');
    } finally {
      if (prevRoot !== undefined) process.env.OTTO_ROOT = prevRoot;
      else delete process.env.OTTO_ROOT;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('latestCapture falls back to legacy at when capturedAt is malformed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-cognee-legacy-fallback-'));
    const prevRoot = process.env.OTTO_ROOT;
    try {
      process.env.OTTO_ROOT = dir;
      const captureDir = join(dir, 'receipts/cognee/capture');
      mkdirSync(captureDir, { recursive: true });
      writeFileSync(
        join(captureDir, 'capture-z-invalid.json'),
        JSON.stringify({
          id: 'invalid',
          capturedAt: 'not-a-timestamp',
          at: '2026-06-13T00:00:00Z',
          paths: ['/legacy.md'],
        }),
      );
      writeFileSync(
        join(captureDir, 'capture-a-newer.json'),
        JSON.stringify({ id: 'newer', capturedAt: '2026-06-14T00:00:00Z', paths: ['/newer.md'] }),
      );

      expect(new CogneeStore().latestCapture()?.id).toBe('newer');
    } finally {
      if (prevRoot !== undefined) process.env.OTTO_ROOT = prevRoot;
      else delete process.env.OTTO_ROOT;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('recall smoke snippets use legacy capture at timestamps', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-cognee-legacy-at-'));
    const prevRoot = process.env.OTTO_ROOT;
    const prevEnabled = process.env.OTTO_COGNEE_ENABLED;
    const prevUrl = process.env.OTTO_COGNEE_BASE_URL;
    try {
      process.env.OTTO_ROOT = dir;
      process.env.OTTO_COGNEE_ENABLED = '1';
      process.env.OTTO_COGNEE_BASE_URL = 'http://127.0.0.1:8000';
      const captureDir = join(dir, 'receipts/cognee/capture');
      const receiptPath = join(dir, 'receipts/otto-v01/legacy.md');
      mkdirSync(captureDir, { recursive: true });
      writeFileSync(
        join(captureDir, 'capture-legacy.json'),
        JSON.stringify({
          id: 'capture-legacy',
          at: '2026-06-14T02:00:00Z',
          paths: [receiptPath],
        }),
      );

      const store = new CogneeStore();
      const healthSpy = store.health.bind(store);
      store.health = () => ({
        status: 'ready',
        baseUrl: 'http://127.0.0.1:8000',
        lastError: null,
        lastCheckedAt: new Date().toISOString(),
      });

      const result = store.recallSmoke('legacy');
      expect(result.ok).toBe(true);
      expect(result.citations[0]?.snippet).toBe('Indexed in capture capture-legacy (2026-06-14T02:00:00Z)');
      store.health = healthSpy;
    } finally {
      if (prevRoot !== undefined) process.env.OTTO_ROOT = prevRoot;
      else delete process.env.OTTO_ROOT;
      if (prevEnabled !== undefined) process.env.OTTO_COGNEE_ENABLED = prevEnabled;
      else delete process.env.OTTO_COGNEE_ENABLED;
      if (prevUrl !== undefined) process.env.OTTO_COGNEE_BASE_URL = prevUrl;
      else delete process.env.OTTO_COGNEE_BASE_URL;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('writeCogneeRecallReceipt writes under receipts/cognee/recall', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-cognee-recall-receipt-'));
    const prev = process.env.OTTO_ROOT;
    try {
      process.env.OTTO_ROOT = dir;
      const path = writeCogneeRecallReceipt({
        ok: true,
        query: 'test',
        citations: [{ path: '/receipts/foo.md', snippet: 'indexed' }],
        error: null,
      });
      expect(path).toContain('receipts/cognee/recall');
      expect(path).toStartWith(dir);
    } finally {
      if (prev !== undefined) process.env.OTTO_ROOT = prev;
      else delete process.env.OTTO_ROOT;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
