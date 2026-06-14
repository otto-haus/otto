import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type {
  PracticeReference,
  Receipt,
  ReceiptBlocker,
  ReceiptEvidence,
  ReceiptStatus,
  RoutineReference,
  StandardCitation,
} from '@otto-haus/core';
import { RECEIPTS_DIR } from './receipt-writer';
import type { ReceiptDetail, ReceiptListResult, ReceiptSummary } from './shared/types';

export class ReceiptStore {
  constructor(private dir = RECEIPTS_DIR) {}

  list(): ReceiptListResult {
    if (!existsSync(this.dir)) return { dir: this.dir, receipts: [], skipped: 0 };
    const entries = readdirSync(this.dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => join(this.dir, entry.name));

    let skipped = 0;
    const receipts: ReceiptDetail[] = [];
    for (const path of entries) {
      const receipt = this.read(path);
      if (receipt) receipts.push(receipt);
      else skipped += 1;
    }

    receipts.sort((a, b) => timestampMs(b.timestamp) - timestampMs(a.timestamp));
    return { dir: this.dir, receipts: receipts.map(summaryFor), skipped };
  }

  get(id: string): ReceiptDetail | null {
    if (!existsSync(this.dir)) return null;
    for (const entry of readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const receipt = this.read(join(this.dir, entry.name));
      if (receipt?.id === id) return receipt;
    }
    return null;
  }

  private read(path: string): ReceiptDetail | null {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
      const receipt = normalizeReceipt(raw);
      return receipt ? { ...receipt, path } : null;
    } catch {
      return null;
    }
  }
}

function summaryFor(receipt: ReceiptDetail): ReceiptSummary {
  return {
    id: receipt.id,
    timestamp: receipt.timestamp,
    status: receipt.status,
    action: receipt.action,
    subjectType: receipt.subject.type,
    subjectId: receipt.subject.id ?? null,
    summary: receipt.result.summary,
    blockerCode: receipt.blocker?.code ?? null,
    evidenceCount: receipt.evidence.length,
    practiceSlug: receipt.practice?.slug ?? null,
    routineSlug: receipt.routine?.slug ?? null,
    path: receipt.path,
  };
}

function normalizeReceipt(value: unknown): Receipt | null {
  if (!isRecord(value)) return null;
  if (value.schema !== 'otto.receipt.v1') return null;
  if (!isString(value.id) || !isString(value.timestamp) || !isStatus(value.status) || !isString(value.action)) return null;
  if (!isValidTimestamp(value.timestamp)) return null;
  if (!isRecord(value.subject) || !isString(value.subject.type)) return null;
  if (!isRecord(value.input) || !isRecord(value.result) || !isString(value.result.summary)) return null;
  if (!Array.isArray(value.evidence)) return null;
  const evidence = value.evidence.map(normalizeEvidence);
  if (evidence.some((entry) => !entry)) return null;
  const blocker = normalizeBlocker(value.blocker);
  if (blocker === undefined) return null;

  return {
    schema: 'otto.receipt.v1',
    id: value.id,
    timestamp: value.timestamp,
    status: value.status,
    subject: {
      type: value.subject.type as Receipt['subject']['type'],
      id: isString(value.subject.id) || value.subject.id === null ? value.subject.id : null,
    },
    action: value.action,
    input: value.input,
    result: {
      summary: value.result.summary,
      data: isRecord(value.result.data) ? value.result.data : undefined,
    },
    evidence: evidence as ReceiptEvidence[],
    standards: Array.isArray(value.standards) ? value.standards.map(normalizeStandardCitation).filter(isStandardCitation) : undefined,
    practice: normalizePracticeReference(value.practice),
    routine: normalizeRoutineReference(value.routine),
    blocker,
  };
}

function normalizeEvidence(value: unknown): ReceiptEvidence | null {
  if (!isRecord(value) || !isString(value.kind) || !isString(value.ref)) return null;
  return {
    kind: value.kind as ReceiptEvidence['kind'],
    ref: value.ref,
    proves: Array.isArray(value.proves) ? value.proves.filter(isString) : undefined,
    note: isString(value.note) ? value.note : undefined,
    data: value.data,
  };
}

function normalizeBlocker(value: unknown): ReceiptBlocker | null | undefined {
  if (value === null) return null;
  if (!isRecord(value) || !isString(value.code) || !isString(value.message) || typeof value.recoverable !== 'boolean') {
    return undefined;
  }
  return {
    code: value.code,
    message: value.message,
    recoverable: value.recoverable,
    next_action: isString(value.next_action) ? value.next_action : undefined,
  };
}

function normalizeStandardCitation(value: unknown): StandardCitation | null {
  if (!isRecord(value) || !isString(value.slug) || !isString(value.name) || !isString(value.ref) || !isString(value.reason)) {
    return null;
  }
  return {
    slug: value.slug,
    name: value.name,
    ref: value.ref,
    reason: value.reason,
    evidence: Array.isArray(value.evidence) ? value.evidence.filter(isString) : undefined,
  };
}

function isStandardCitation(value: StandardCitation | null): value is StandardCitation {
  return value !== null;
}

function normalizePracticeReference(value: unknown): PracticeReference | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isRecord(value) || !isString(value.slug) || !isString(value.name) || !isString(value.ref) || !isString(value.invocation)) {
    return undefined;
  }
  return {
    slug: value.slug,
    name: value.name,
    version: isString(value.version) ? value.version : '0.0.0',
    status: value.status === 'draft' || value.status === 'active' || value.status === 'deprecated'
      ? value.status
      : 'active',
    invocation: value.invocation,
    ref: value.ref,
  };
}

function normalizeRoutineReference(value: unknown): RoutineReference | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isRecord(value) || !isString(value.slug) || !isString(value.name) || !isString(value.ref) || !isString(value.id)) {
    return undefined;
  }
  return {
    id: value.id,
    slug: value.slug,
    name: value.name,
    mode: value.mode === 'scheduled' ? 'scheduled' : 'manual',
    ref: value.ref,
  };
}

function timestampMs(value: string): number {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function isValidTimestamp(value: string): boolean {
  return Number.isFinite(new Date(value).getTime());
}

function isStatus(value: unknown): value is ReceiptStatus {
  return value === 'success' || value === 'blocked' || value === 'failed';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
