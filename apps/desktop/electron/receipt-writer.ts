import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { Receipt } from '@otto-haus/core';
import { OTTO_DIR } from './config-store';

export const RECEIPTS_DIR = join(OTTO_DIR, 'receipts');

export type ReceiptWriteInput = Omit<Receipt, 'schema' | 'id' | 'timestamp'> & {
  id?: string;
  timestamp?: string;
};

export type WrittenReceipt = Receipt & { path: string };

export class ReceiptWriter {
  constructor(private dir = RECEIPTS_DIR) {}

  get directory(): string {
    return this.dir;
  }

  write(input: ReceiptWriteInput): WrittenReceipt {
    mkdirSync(this.dir, { recursive: true });
    const timestamp = input.timestamp ?? new Date().toISOString();
    const id = input.id ?? `receipt-${randomUUID()}`;
    const receipt: Receipt = {
      schema: 'otto.receipt.v1',
      id,
      timestamp,
      status: input.status,
      subject: input.subject,
      action: input.action,
      input: input.input,
      result: input.result,
      evidence: input.evidence,
      standards: input.standards,
      practice: input.practice ?? null,
      routine: input.routine ?? null,
      blocker: input.blocker,
    };
    const filename = `${safeTimestamp(timestamp)}-${safeId(id)}.json`;
    const path = join(this.dir, filename);
    writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
    return { ...receipt, path };
  }
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'receipt';
}

function safeTimestamp(value: string): string {
  const safe = value
    .replace(/[:.]/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return safe || 'timestamp';
}
