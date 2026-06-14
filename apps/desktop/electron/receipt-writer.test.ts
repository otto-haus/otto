import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { ReceiptWriter } from './receipt-writer';

let tmp: string | null = null;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('ReceiptWriter', () => {
  it('writes a durable success receipt with the required contract fields', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-receipt-test-'));
    const receipt = new ReceiptWriter(tmp).write({
      id: 'receipt-test-success',
      timestamp: '2026-06-14T00:00:00.000Z',
      status: 'success',
      subject: { type: 'chat', id: 'conversation-1' },
      action: 'chat.send',
      input: { text: 'hello' },
      result: { summary: 'Chat turn completed.', data: { conversationId: 'conversation-1' } },
      evidence: [{ kind: 'log', ref: '/tmp/trace.jsonl', note: 'raw trace' }],
      standards: [{
        slug: 'quality',
        name: 'Quality / No Fake Done',
        ref: '/repo/standards/standards/quality.md',
        reason: 'Runtime receipt cites relevant file-backed Standards.',
        evidence: ['every acceptance criterion mapped to a receipt'],
      }],
      practice: {
        slug: 'charter',
        name: 'Charter',
        version: '0.1',
        status: 'active',
        invocation: '/charter step',
        ref: '/repo/practices/charter/practice.yaml',
      },
      blocker: null,
    });

    const persisted = JSON.parse(readFileSync(receipt.path, 'utf8'));
    expect(persisted.schema).toBe('otto.receipt.v1');
    expect(persisted.timestamp).toBe('2026-06-14T00:00:00.000Z');
    expect(persisted.input.text).toBe('hello');
    expect(persisted.action).toBe('chat.send');
    expect(persisted.result.summary).toBe('Chat turn completed.');
    expect(persisted.evidence[0].ref).toBe('/tmp/trace.jsonl');
    expect(persisted.standards[0].slug).toBe('quality');
    expect(persisted.standards[0].ref).toBe('/repo/standards/standards/quality.md');
    expect(persisted.practice.slug).toBe('charter');
    expect(persisted.practice.invocation).toBe('/charter step');
    expect(persisted.blocker).toBeNull();
  });

  it('writes a blocked receipt with a truthful blocker', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-receipt-test-'));
    const receipt = new ReceiptWriter(tmp).write({
      id: 'receipt-test-blocked',
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

    const persisted = JSON.parse(readFileSync(receipt.path, 'utf8'));
    expect(persisted.status).toBe('blocked');
    expect(persisted.blocker.code).toBe('runtime-not-ready');
    expect(persisted.blocker.recoverable).toBe(true);
    expect(persisted.evidence[0].kind).toBe('status');
  });
});
