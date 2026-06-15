import { describe, expect, test } from 'bun:test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXTENSION_COMMANDS,
  runExtensionParitySmoke,
  validateExtensionFiles,
} from './extension-parity-smoke';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('extension parity smoke', () => {
  test('extension command files exist and register ids', () => {
    expect(validateExtensionFiles(repoRoot)).toBeNull();
    expect(EXTENSION_COMMANDS.map((c) => c.id)).toEqual(['charter', 'review', 'field-note', 'routine']);
  });

  test('charter + review runs emit receipts listable from OTTO_HOME', async () => {
    const result = await runExtensionParitySmoke({ repoRoot });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.charterReceiptId).toMatch(/^receipt-/);
      expect(result.reviewReceiptId).toMatch(/^receipt-/);
      expect(result.receiptCount).toBeGreaterThanOrEqual(2);
      expect(result.receiptPath).toContain('124-extension-parity');
    }
  });
});
