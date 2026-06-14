import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { ReceiptStore } from './receipt-store';
import { ReceiptWriter } from './receipt-writer';

let tmp: string | null = null;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('ReceiptStore', () => {
  it('lists success and blocked receipts newest-first with summaries', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-receipt-store-test-'));
    const writer = new ReceiptWriter(tmp);
    writer.write({
      id: 'receipt-success',
      timestamp: '2026-06-14T00:00:00.000Z',
      status: 'success',
      subject: { type: 'chat', id: 'local-conv-1' },
      action: 'chat.send',
      input: { text: 'hello' },
      result: { summary: 'Chat turn completed.', data: { conversationId: 'local-conv-1' } },
      evidence: [{ kind: 'log', ref: '/tmp/success.jsonl' }],
      blocker: null,
    });
    writer.write({
      id: 'receipt-blocked',
      timestamp: '2026-06-14T00:00:01.000Z',
      status: 'blocked',
      subject: { type: 'chat', id: null },
      action: 'chat.send',
      input: { text: 'hello' },
      result: { summary: 'Chat turn blocked before send.' },
      evidence: [{ kind: 'status', ref: 'runtime.status', data: { ready: false } }],
      blocker: {
        code: 'runtime-not-ready',
        message: 'Runtime not ready.',
        recoverable: true,
        next_action: 'Open Settings and connect Letta.',
      },
    });
    writeFileSync(join(tmp, 'broken.json'), '{not json');

    const result = new ReceiptStore(tmp).list();
    expect(result.receipts.map((receipt) => receipt.id)).toEqual(['receipt-blocked', 'receipt-success']);
    expect(result.receipts[0].blockerCode).toBe('runtime-not-ready');
    expect(result.receipts[1].status).toBe('success');
    expect(result.skipped).toBe(1);
  });

  it('loads receipt detail by id', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-receipt-store-test-'));
    new ReceiptWriter(tmp).write({
      id: 'receipt-detail',
      timestamp: '2026-06-14T00:00:00.000Z',
      status: 'success',
      subject: { type: 'chat', id: 'local-conv-1' },
      action: 'chat.send',
      input: { text: 'hello' },
      result: { summary: 'Chat turn completed.' },
      evidence: [{ kind: 'log', ref: '/tmp/success.jsonl' }],
      standards: [{
        slug: 'quality',
        name: 'Quality / No Fake Done',
        ref: '/repo/standards/standards/quality.md',
        reason: 'Runtime receipt cites relevant file-backed Standards.',
      }],
      blocker: null,
    });

    const receipt = new ReceiptStore(tmp).get('receipt-detail');
    expect(receipt?.schema).toBe('otto.receipt.v1');
    expect(receipt?.standards?.[0]?.slug).toBe('quality');
    expect(receipt?.standards?.[0]?.ref).toBe('/repo/standards/standards/quality.md');
    expect(receipt?.path.endsWith('.json')).toBe(true);
    expect(new ReceiptStore(tmp).get('missing')).toBeNull();
  });
});
