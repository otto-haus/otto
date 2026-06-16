import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { ReceiptWriter } from './receipt-writer';
import { ReceiptStore } from './receipt-store';
import { receiptPreviewBodyFor } from './receipt-preview-body';

let tmp: string | null = null;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('receiptPreviewBodyFor (#660)', () => {
  it('returns markdown preview from artifact file when readable', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-receipt-preview-body-'));
    const artifactPath = join(tmp, 'proof.md');
    writeFileSync(artifactPath, '# Proof\n\nTurn completed.', 'utf8');
    const writer = new ReceiptWriter(tmp);
    writer.write({
      id: 'receipt-artifact-preview',
      timestamp: '2026-06-16T10:00:00.000Z',
      status: 'success',
      subject: { type: 'chat', id: 'thread-a' },
      action: 'chat.send',
      input: { text: 'hello' },
      result: { summary: 'Turn completed.' },
      evidence: [{ kind: 'file', ref: artifactPath, note: 'Markdown export' }],
      blocker: null,
    });

    const result = receiptPreviewBodyFor(new ReceiptStore(tmp).get('receipt-artifact-preview'));
    expect(result.eligible).toBe(true);
    expect(result.content?.kind).toBe('markdown');
    expect(result.content?.body).toContain('# Proof');
  });
});
