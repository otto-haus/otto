import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import {
  APPROVAL_FLOOR,
  type AcceptanceCriterion,
  type Charter,
  type CharterChange,
  type CharterRef,
  type CharterStatus,
  type Receipt,
  type Run,
} from '@otto-haus/core';
import { OTTO_DIR } from './config-store';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';

export const CHARTERS_DIR = join(OTTO_DIR, 'charters');

export interface CharterCreateInput {
  slug: string;
  objective: string;
  title?: string;
  status?: CharterStatus;
  acceptanceCriteria: Array<{ id: string; text: string; receipts?: string[] }>;
  runIds?: string[];
  receiptIds?: string[];
}

export interface CharterUpdateResult {
  charter: Charter;
  path: string;
  receipt: WrittenReceipt;
}

export type CharterDetail = Charter & { root: string; path: string };

export class CharterStore {
  constructor(
    private dir = CHARTERS_DIR,
    private receipts = new ReceiptWriter(),
  ) {}

  create(input: CharterCreateInput): CharterUpdateResult {
    const slug = safeSlug(input.slug);
    if (!slug) throw new Error('Charter slug is required.');
    const path = this.pathFor(slug);
    if (existsSync(path)) throw new Error(`Charter already exists: ${slug}`);
    const now = new Date().toISOString();
    const status = input.status ?? 'proposed';
    const base: Charter = {
      schema: 'otto.charter.v1',
      id: `charter-${slug}`,
      slug,
      title: input.title?.trim() || input.objective.trim(),
      objective: input.objective.trim(),
      status,
      created_at: now,
      updated_at: now,
      acceptance_criteria: input.acceptanceCriteria.map(normalizeAcceptanceCriterion),
      run_ids: unique(input.runIds ?? []),
      receipt_ids: unique(input.receiptIds ?? []),
      change_receipt_ids: [],
      approval_required_for_changes: [...APPROVAL_FLOOR],
      changes: [],
    };
    const receipt = this.writeChangeReceipt(base, {
      kind: 'created',
      summary: `Charter created: ${base.objective}`,
      to_status: status,
      run_ids: base.run_ids,
      receipt_ids: base.receipt_ids,
      approval_id: null,
    });
    const charter = this.applyChange(base, receipt, {
      kind: 'created',
      summary: `Charter created: ${base.objective}`,
      to_status: status,
      run_ids: base.run_ids,
      receipt_ids: base.receipt_ids,
      approval_id: null,
    });
    this.write(charter);
    return { charter, path, receipt };
  }

  get(slug: string): Charter | null {
    const path = this.pathFor(safeSlug(slug));
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8')) as Charter;
  }

  detail(slug: string): CharterDetail | null {
    const charter = this.get(slug);
    return charter ? { ...charter, root: this.rootFor(charter.slug), path: this.pathFor(charter.slug) } : null;
  }

  listResult(): { dir: string; charters: CharterRef[] } {
    return { dir: this.dir, charters: this.list() };
  }

  list(): CharterRef[] {
    if (!existsSync(this.dir)) return [];
    return readdirSync(this.dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => this.get(entry.name))
      .filter((charter): charter is Charter => !!charter)
      .map((charter) => this.toRef(charter));
  }

  updateStatus(slug: string, status: CharterStatus, summary = `Charter status changed to ${status}.`): CharterUpdateResult {
    const current = this.require(slug);
    if (status === 'complete') {
      const missing = current.acceptance_criteria.filter((ac) => ac.receipts.length === 0);
      if (missing.length) {
        const ids = missing.map((ac) => ac.id).join(', ');
        throw new Error(
          `Cannot mark charter complete: ${missing.length} acceptance ${missing.length === 1 ? 'criterion' : 'criteria'} missing receipt proof (${ids}). Link a receipt to each AC first.`,
        );
      }
    }
    const receipt = this.writeChangeReceipt(current, {
      kind: 'status-changed',
      summary,
      from_status: current.status,
      to_status: status,
      approval_id: null,
    });
    const charter = this.applyChange({ ...current, status }, receipt, {
      kind: 'status-changed',
      summary,
      from_status: current.status,
      to_status: status,
      approval_id: null,
    });
    this.write(charter);
    return { charter, path: this.pathFor(charter.slug), receipt };
  }

  linkRunReceipt(
    slug: string,
    input: { runId?: Run['id']; receiptId?: Receipt['id']; acId?: string; summary?: string },
  ): CharterUpdateResult {
    if (!input.runId && !input.receiptId) throw new Error('runId or receiptId is required.');
    const current = this.require(slug);
    const acId = input.acId?.trim();
    const acceptance_criteria = acId
      ? current.acceptance_criteria.map((ac) =>
          ac.id === acId && input.receiptId
            ? { ...ac, receipts: unique([...ac.receipts, input.receiptId]) }
            : ac,
        )
      : current.acceptance_criteria;
    if (acId && !acceptance_criteria.some((ac) => ac.id === acId)) {
      throw new Error(`Acceptance criterion not found: ${acId}`);
    }
    const next: Charter = {
      ...current,
      acceptance_criteria,
      run_ids: unique([...current.run_ids, input.runId]),
      receipt_ids: unique([...current.receipt_ids, input.receiptId]),
    };
    const receipt = this.writeChangeReceipt(next, {
      kind: 'references-linked',
      summary: input.summary ?? 'Charter linked to run/receipt evidence.',
      run_ids: input.runId ? [input.runId] : [],
      receipt_ids: input.receiptId ? [input.receiptId] : [],
      approval_id: null,
    });
    const charter = this.applyChange(next, receipt, {
      kind: 'references-linked',
      summary: input.summary ?? 'Charter linked to run/receipt evidence.',
      run_ids: input.runId ? [input.runId] : [],
      receipt_ids: input.receiptId ? [input.receiptId] : [],
      approval_id: null,
    });
    this.write(charter);
    return { charter, path: this.pathFor(charter.slug), receipt };
  }

  toRef(charter: Charter): CharterRef {
    return {
      id: charter.id,
      slug: charter.slug,
      status: charter.status,
      root: this.rootFor(charter.slug),
      acceptance_criteria: charter.acceptance_criteria,
      run_ids: charter.run_ids,
      receipt_ids: charter.receipt_ids,
    };
  }

  private require(slug: string): Charter {
    const charter = this.get(slug);
    if (!charter) throw new Error(`Charter not found: ${slug}`);
    return charter;
  }

  private applyChange(charter: Charter, receipt: WrittenReceipt, change: Omit<CharterChange, 'id' | 'at' | 'receipt_id'>): Charter {
    const next: Charter = {
      ...charter,
      updated_at: receipt.timestamp,
      receipt_ids: unique([...charter.receipt_ids, receipt.id]),
      change_receipt_ids: unique([...charter.change_receipt_ids, receipt.id]),
      changes: [
        ...charter.changes,
        {
          id: `change-${randomUUID()}`,
          at: receipt.timestamp,
          receipt_id: receipt.id,
          ...change,
        },
      ],
    };
    return next;
  }

  private writeChangeReceipt(charter: Charter, change: Omit<CharterChange, 'id' | 'at' | 'receipt_id'>): WrittenReceipt {
    return this.receipts.write({
      status: 'success',
      subject: { type: 'charter', id: charter.id },
      action: `charter.${change.kind}`,
      input: {
        charterId: charter.id,
        slug: charter.slug,
        fromStatus: change.from_status ?? null,
        toStatus: change.to_status ?? charter.status,
        runIds: change.run_ids ?? [],
        receiptIds: change.receipt_ids ?? [],
        approvalId: change.approval_id ?? null,
      },
      result: {
        summary: change.summary,
        data: {
          charterId: charter.id,
          slug: charter.slug,
          status: change.to_status ?? charter.status,
          approvalRequiredForChanges: charter.approval_required_for_changes,
        },
      },
      evidence: [{ kind: 'file', ref: this.pathFor(charter.slug), note: 'File-backed charter record' }],
      blocker: null,
    });
  }

  private write(charter: Charter): void {
    const root = this.rootFor(charter.slug);
    mkdirSync(root, { recursive: true });
    writeFileSync(this.pathFor(charter.slug), `${JSON.stringify(charter, null, 2)}\n`);
  }

  private rootFor(slug: string): string {
    return join(this.dir, safeSlug(slug));
  }

  private pathFor(slug: string): string {
    return join(this.rootFor(slug), 'charter.json');
  }
}

function normalizeAcceptanceCriterion(input: { id: string; text: string; receipts?: string[] }): AcceptanceCriterion {
  const id = input.id.trim();
  const text = input.text.trim();
  if (!id || !text) throw new Error('Acceptance criteria require id and text.');
  return { id, text, receipts: unique(input.receipts ?? []) };
}

function unique(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !out.includes(trimmed)) out.push(trimmed);
  }
  return out;
}

function safeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}
