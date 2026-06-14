import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify } from 'yaml';
import { ConstitutionStore, validateConstitution } from './constitution-store';
import { ReceiptWriter } from './receipt-writer';

describe('ConstitutionStore', () => {
  test('seeds default constitution on first load', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-constitution-'));
    const yamlPath = join(tmp, 'constitution.yaml');
    const mdPath = join(tmp, 'constitution.md');
    try {
      const store = new ConstitutionStore(yamlPath, mdPath, new ReceiptWriter(join(tmp, 'receipts')));
      const result = store.load();
      expect(result.document.schema).toBe('otto.constitution.v1');
      expect(existsSync(yamlPath)).toBe(true);
      expect(existsSync(mdPath)).toBe(true);
      expect(readFileSync(mdPath, 'utf8')).toContain('Forbidden actions');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('seeds custom nested constitution directory on first load', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-constitution-nested-'));
    const dir = join(tmp, 'custom', 'constitution');
    const yamlPath = join(dir, 'constitution.yaml');
    const mdPath = join(dir, 'constitution.md');
    try {
      const store = new ConstitutionStore(yamlPath, mdPath, new ReceiptWriter(join(tmp, 'receipts')));
      const result = store.load();
      expect(result.dir).toBe(dir);
      expect(existsSync(yamlPath)).toBe(true);
      expect(existsSync(mdPath)).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('invalid amend is blocked with receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-constitution-'));
    const yamlPath = join(tmp, 'constitution.yaml');
    const mdPath = join(tmp, 'constitution.md');
    const receiptsDir = join(tmp, 'receipts');
    try {
      const store = new ConstitutionStore(yamlPath, mdPath, new ReceiptWriter(receiptsDir));
      store.load();
      const outcome = store.amend('schema: broken\nversion: 0\n');
      expect('blocked' in outcome && outcome.blocked).toBe(true);
      if ('blocked' in outcome && outcome.blocked) {
        expect(outcome.receipt.status).toBe('blocked');
        expect(outcome.receipt.action).toBe('constitution.amend');
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('valid amend writes receipt and updates files', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-constitution-'));
    const yamlPath = join(tmp, 'constitution.yaml');
    const mdPath = join(tmp, 'constitution.md');
    const receiptsDir = join(tmp, 'receipts');
    try {
      const store = new ConstitutionStore(yamlPath, mdPath, new ReceiptWriter(receiptsDir));
      const loaded = store.load();
      const next = {
        ...loaded.document,
        values: [...loaded.document.values, 'New value line'],
      };
      const outcome = store.amend(stringify(next));
      expect('document' in outcome).toBe(true);
      if ('document' in outcome) {
        expect(outcome.receipt.status).toBe('success');
        expect(outcome.document.values).toContain('New value line');
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('validateConstitution rejects non-proposal_only writeback', () => {
    const bad = validateConstitution({
      schema: 'otto.constitution.v1',
      version: '0.1',
      values: ['x'],
      forbidden_actions: [],
      approval_rules: [],
      standards_refs: [],
      ratification_requirements: [],
      writeback_policy: { mode: 'auto', requires_curation_accept: false, silent_apply_forbidden: false },
    });
    expect(bad.ok).toBe(false);
  });
});
