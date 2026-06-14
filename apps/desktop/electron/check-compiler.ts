import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Check } from '@otto-haus/core';
import type { CurationProposalRecord } from '@otto-haus/core';
import { CheckStore } from './check-store';
import { hashStandardContent } from './check-runner';
import { ReceiptWriter } from './receipt-writer';

/** Maps ratified standard slugs to compilable check templates (v1 explicit table). */
const STANDARD_CHECK_MAP: Record<string, Partial<Check>> = {
  quality: {
    id: 'completion-requires-receipts',
    source: 'standards/standards/quality.md',
    trigger: { event: 'done_claim' },
    inspect: {
      require: ['acceptance_criteria_mapped', 'evidence_attached', 'test_or_log_or_artifact_present'],
    },
    on_fail: {
      block_claim: true,
      message: 'Not done: missing mapped proof.',
      write_receipt: true,
    },
  },
  'no-fake-done': {
    id: 'completion-requires-receipts',
    source: 'standard/no-fake-done.md',
    trigger: { event: 'done_claim' },
    inspect: {
      require: ['acceptance_criteria_mapped', 'evidence_attached', 'test_or_log_or_artifact_present'],
    },
    on_fail: {
      block_claim: true,
      message: 'Not done: missing mapped proof.',
      write_receipt: true,
    },
  },
  'one-way-doors': {
    id: 'one-way-door-approval',
    source: 'standard/one-way-doors.md',
    trigger: { event: 'one_way_door_action' },
    inspect: { require: ['approval_present'] },
    on_fail: {
      block_claim: true,
      message: 'Blocked: one-way door requires explicit approval.',
      write_receipt: true,
    },
  },
};

export class CheckCompiler {
  constructor(
    private store = new CheckStore(),
    private receipts = new ReceiptWriter(),
  ) {}

  compileFromProposal(proposal: CurationProposalRecord, standardsDir: string): { compiled: Check | null; skipped?: string } {
    if (proposal.target?.kind !== 'standard') {
      return { compiled: null, skipped: 'Proposal target is not a standard' };
    }
    const slug = proposal.target.id ?? slugFromPath(proposal.target.path);
    const template = STANDARD_CHECK_MAP[slug];
    if (!template?.id) {
      return { compiled: null, skipped: `No compilable check mapping for standard "${slug}"` };
    }
    const standardPath = proposal.target.path ?? join(standardsDir, `${slug}.md`);
    if (!existsSync(standardPath)) {
      return { compiled: null, skipped: `Standard file missing: ${standardPath}` };
    }
    const existing = this.store.get(template.id);
    const version = bumpVersion(existing?.version ?? '0.0.0');
    const check: Check = {
      schema: 'otto.check.v1',
      id: template.id,
      version,
      source: template.source ?? `standard/${slug}.md`,
      trigger: template.trigger!,
      inspect: template.inspect!,
      on_fail: template.on_fail!,
      compiled_from_proposal_id: proposal.id,
      compiled_at: new Date().toISOString(),
      standard_hash: hashStandardContent(standardPath),
      standard_slug: slug,
      active: true,
    };
    this.store.save(check);
    this.receipts.write({
      status: 'success',
      subject: { type: 'check', id: check.id },
      action: 'check.compiled',
      input: { proposal_id: proposal.id, standard_slug: slug },
      result: { summary: `Compiled check ${check.id}@${check.version}`, data: { check_id: check.id, source: check.source } },
      evidence: [{ kind: 'file', ref: standardPath, note: 'Ratified standard source' }],
      blocker: null,
    });
    return { compiled: check };
  }
}

function slugFromPath(path?: string | null): string {
  if (!path) return '';
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.md$/i, '');
}

function bumpVersion(current: string): string {
  const parts = current.split('.').map((p) => Number(p) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return parts.join('.');
}
