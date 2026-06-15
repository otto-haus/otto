import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';
import type {
  ApprovalListResult,
  ApprovalRecord,
  ApprovalRequirement,
  CreateProposalFromCorrectionInput,
  CurationProposal,
  CurationProposalRecord,
  DecideProposalInput,
  ProposalClassification,
  ProposalDecisionKind,
  ProposalEvidenceRef,
  ProposalKind,
  ProposalTarget,
} from '@otto-haus/core';
import { OTTO_DIR } from './config-store';
import { CheckCompiler } from './check-compiler';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import { ReceiptStore } from './receipt-store';
import { StandardStore } from './standard-store';

export const PROPOSALS_DIR = join(OTTO_DIR, 'curation', 'proposals');

export interface ProposalListResult {
  dir: string;
  proposals: CurationProposalRecord[];
  skipped: number;
  storage: 'files';
}

export interface CreateProposalResult {
  proposal: CurationProposalRecord;
  receipt: WrittenReceipt;
}

export interface CreateProposalFromSystemInput {
  summary: string;
  rationale: string;
  target: ProposalTarget;
  evidence?: ProposalEvidenceRef[];
  source?: CurationProposal['source'];
  created_by?: CurationProposal['created_by'];
}

export interface DecideProposalResult {
  proposal: CurationProposalRecord;
  receipt: WrittenReceipt;
  blocked?: boolean;
  compiledCheckId?: string | null;
  /** Result of the post-ratification Letta write/inject pass (#639 + #637). */
  lettaApply?: import('./ratification-apply').RatificationApplyResult | { error: string };
}

export type CanonApplyResult = {
  applied: boolean;
  changed: boolean;
  reason: 'not_required' | 'updated' | 'already_ratified' | 'missing_target' | 'unsupported_target' | 'created';
};

export class ProposalStore {
  constructor(
    private dir = PROPOSALS_DIR,
    private receipts = new ReceiptWriter(),
    private receiptLookup = new ReceiptStore(),
  ) {}

  listApprovals(): ApprovalListResult {
    const proposals = this.list().proposals.filter((proposal) => proposal.decision_receipt_id);
    const approvals: ApprovalRecord[] = proposals
      .map((proposal) => approvalFromProposal(proposal, this.receiptLookup))
      .filter((record): record is ApprovalRecord => !!record);
    approvals.sort((a, b) => timestampMs(b.decided_at) - timestampMs(a.decided_at));
    return { dir: this.dir, approvals, storage: 'files' };
  }

  list(): ProposalListResult {
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this.dir)) {
      return { dir: this.dir, proposals: [], skipped: 0, storage: 'files' };
    }

    let skipped = 0;
    const proposals: CurationProposalRecord[] = [];
    for (const entry of readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const path = join(this.dir, entry.name);
      const proposal = this.read(path);
      if (proposal) proposals.push(proposal);
      else skipped += 1;
    }

    proposals.sort((a, b) => timestampMs(b.updated_at) - timestampMs(a.updated_at));
    return { dir: this.dir, proposals, skipped, storage: 'files' };
  }

  get(id: string): CurationProposalRecord | null {
    return this.list().proposals.find((proposal) => proposal.id === id) ?? null;
  }

  createFromCorrection(input: CreateProposalFromCorrectionInput): CreateProposalResult {
    mkdirSync(this.dir, { recursive: true });
    const now = new Date().toISOString();
    const id = `prop_${now.slice(0, 10).replace(/-/g, '')}_${randomUUID().slice(0, 8)}`;
    const classification = classifyProposal(input.target, input.correction);
    const kind = kindForTarget(input.target);
    const evidence = normalizeEvidence(input.evidence, input.sourceReceiptId, input.correction);
    const rationale = (input.rationale ?? input.correction).trim();
    const status = classification.required_gate === 'none' ? 'proposed' : 'needs_approval';

    const proposalBody: CurationProposal = {
      schema: 'otto.proposal.v1',
      id,
      source: 'user_correction',
      kind,
      summary: summarizeCorrection(input.correction),
      rationale,
      evidence,
      target: input.target,
      classification,
      status,
      created_at: now,
      updated_at: now,
      created_by: input.created_by ?? 'user',
    };

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'proposal', id },
      action: 'curation.proposal.create',
      input: {
        correction: input.correction,
        target: input.target,
        classification,
      },
      result: {
        summary: `Proposal recorded: ${proposalBody.summary}`,
        data: { proposalId: id, route: classification.route },
      },
      evidence: evidence.map((entry) => ({
        kind: entry.kind === 'receipt' ? 'log' : entry.kind === 'file' ? 'file' : 'message',
        ref: entry.ref,
        note: entry.note,
      })),
      blocker: null,
    });

    const record: CurationProposalRecord = {
      ...proposalBody,
      receipt_id: receipt.id,
      path: join(this.dir, `${safeId(id)}.json`),
    };
    writeFileSync(record.path, `${JSON.stringify(record, null, 2)}\n`);

    return { proposal: record, receipt };
  }

  createFromSystem(input: CreateProposalFromSystemInput): CreateProposalResult {
    mkdirSync(this.dir, { recursive: true });
    const now = new Date().toISOString();
    const id = `prop_${now.slice(0, 10).replace(/-/g, '')}_${randomUUID().slice(0, 8)}`;
    const classification = classifyProposal(input.target, input.rationale);
    const kind = kindForTarget(input.target);
    const evidence = input.evidence ?? [];
    const rationale = input.rationale.trim();
    const summary = input.summary.trim();
    const status = classification.required_gate === 'none' ? 'proposed' : 'needs_approval';

    const proposalBody: CurationProposal = {
      schema: 'otto.proposal.v1',
      id,
      source: input.source ?? 'run_review',
      kind,
      summary,
      rationale,
      evidence,
      target: input.target,
      classification,
      status,
      created_at: now,
      updated_at: now,
      created_by: input.created_by ?? 'otto',
    };

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'proposal', id },
      action: 'curation.proposal.create',
      input: {
        summary,
        target: input.target,
        classification,
        source: proposalBody.source,
      },
      result: {
        summary: `Proposal recorded: ${proposalBody.summary}`,
        data: { proposalId: id, route: classification.route },
      },
      evidence: evidence.map((entry) => ({
        kind: entry.kind === 'receipt' ? 'log' : entry.kind === 'file' ? 'file' : 'message',
        ref: entry.ref,
        note: entry.note,
      })),
      blocker: null,
    });

    const record: CurationProposalRecord = {
      ...proposalBody,
      receipt_id: receipt.id,
      path: join(this.dir, `${safeId(id)}.json`),
    };
    writeFileSync(record.path, `${JSON.stringify(record, null, 2)}\n`);

    return { proposal: record, receipt };
  }

  decide(id: string, input: DecideProposalInput): DecideProposalResult {
    const existing = this.get(id);
    if (!existing) throw new Error(`Proposal not found: ${id}`);

    if (existing.status === 'rejected' || existing.status === 'applied') {
      const receipt = this.receipts.write({
        status: 'blocked',
        subject: { type: 'proposal', id },
        action: decisionAction(input.decision),
        input: { decision: input.decision, note: input.note ?? null },
        result: {
          summary: `Proposal ${existing.status}; decision not applied`,
          data: { proposalId: id, status: existing.status },
        },
        evidence: [],
        blocker: {
          code: 'proposal_closed',
          message: `Proposal already ${existing.status}; rejected proposals are not retried.`,
          recoverable: false,
        },
      });
      return { proposal: existing, receipt, blocked: true };
    }

    const now = new Date().toISOString();
    let nextStatus: CurationProposalRecord['status'] = existing.status;
    let appliedAt: string | undefined;
    let canonApplied = false;
    let canonApply: CanonApplyResult = { applied: false, changed: false, reason: 'not_required' };

    if (input.decision === 'reject') {
      nextStatus = 'rejected';
    } else if (input.decision === 'defer') {
      nextStatus = 'deferred';
    } else {
      const requiresCanonWrite = requiresCanonApply(existing.target);
      canonApply = applyAcceptedProposal(existing, now);
      canonApplied = canonApply.applied;
      if (requiresCanonWrite && !canonApplied) {
        const receipt = this.receipts.write({
          status: 'blocked',
          subject: { type: 'proposal', id },
          action: decisionAction(input.decision),
          input: {
            decision: input.decision,
            note: input.note ?? null,
            target: existing.target,
          },
          result: {
            summary: `Accepted proposal could not update canon: ${existing.summary}`,
            data: { proposalId: id, status: existing.status, canonApplied: false },
          },
          evidence: existing.evidence.map((entry) => ({
            kind: entry.kind === 'receipt' ? 'log' : entry.kind === 'file' ? 'file' : 'message',
            ref: entry.ref,
            note: entry.note,
          })),
          blocker: {
            code: 'canon_apply_missing_target',
            message: 'Canon-impact proposal needs an existing target path before it can be accepted.',
            recoverable: true,
            next_action: 'Add an existing target path to the proposal before accepting it.',
          },
        });
        return { proposal: existing, receipt, blocked: true };
      }
      nextStatus = 'applied';
      appliedAt = now;
    }

    const receipt = this.receipts.write({
      status: input.decision === 'reject' ? 'success' : 'success',
      subject: { type: 'proposal', id },
      action: decisionAction(input.decision),
      input: {
        decision: input.decision,
        note: input.note ?? null,
        target: existing.target,
      },
      result: {
        summary: decisionSummary(input.decision, existing.summary, canonApply),
        data: {
          proposalId: id,
          status: nextStatus,
          canonApplied,
          canonChanged: canonApply.changed,
          canonApplyReason: canonApply.reason,
        },
      },
      evidence: existing.evidence.map((entry) => ({
        kind: entry.kind === 'receipt' ? 'log' : entry.kind === 'file' ? 'file' : 'message',
        ref: entry.ref,
        note: entry.note,
      })),
      blocker: null,
    });

    const updated: CurationProposalRecord = {
      ...existing,
      status: nextStatus,
      updated_at: now,
      decision_receipt_id: receipt.id,
      decision_note: input.note?.trim() || undefined,
      applied_at: appliedAt,
    };
    writeFileSync(updated.path, `${JSON.stringify(updated, null, 2)}\n`);

    let compiledCheckId: string | null = null;
    if (input.decision === 'accept' && nextStatus === 'applied') {
      const compiler = new CheckCompiler(undefined, this.receipts);
      const standardsDir = new StandardStore().listResult().dir;
      const compiled = compiler.compileFromProposal(updated, standardsDir);
      if (compiled.compiled) compiledCheckId = compiled.compiled.id;
    }

    return { proposal: updated, receipt, compiledCheckId };
  }

  private read(path: string): CurationProposalRecord | null {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
      return normalizeProposal(raw, path);
    } catch {
      return null;
    }
  }
}

export function classifyProposal(target: ProposalTarget, correction: string): ProposalClassification {
  const canonImpact = target.kind;
  const text = correction.toLowerCase();

  if (canonImpact === 'standard' || canonImpact === 'practice' || canonImpact === 'routine' || canonImpact === 'knowledge') {
    return {
      reversibility: 'hard_to_reverse',
      scope: inferScope(text),
      canon_impact: canonImpact,
      risk: canonImpact === 'standard' ? 'high' : 'medium',
      required_gate: 'human_ratification',
      route: 'ask',
      reason: 'Canon-changing proposals require human ratification before apply.',
    };
  }

  if (canonImpact === 'memory') {
    return {
      reversibility: 'reversible',
      scope: 'internal',
      canon_impact: 'memory',
      risk: 'medium',
      required_gate: 'human_ratification',
      route: 'ask',
      reason: 'Memory writeback is consequential; proposal only — no silent apply.',
    };
  }

  return {
    reversibility: 'reversible',
    scope: 'internal',
    canon_impact: 'none',
    risk: 'low',
    required_gate: 'none',
    route: 'auto_apply',
    reason: 'Low-impact note; stored as proposal without canon mutation.',
  };
}

function kindForTarget(target: ProposalTarget): ProposalKind {
  if (target.kind === 'standard') return 'standard';
  if (target.kind === 'practice') return 'practice';
  if (target.kind === 'routine') return 'routine';
  if (target.kind === 'memory') return 'memory_writeback';
  if (target.kind === 'knowledge') return 'knowledge';
  return 'task';
}

function summarizeCorrection(correction: string): string {
  const line = correction.trim().split(/\r?\n/)[0] ?? correction;
  return line.length > 120 ? `${line.slice(0, 117)}…` : line;
}

function normalizeEvidence(
  evidence: ProposalEvidenceRef[] | undefined,
  sourceReceiptId: string | undefined,
  correction: string,
): ProposalEvidenceRef[] {
  const refs = [...(evidence ?? [])];
  if (sourceReceiptId) {
    refs.unshift({ kind: 'receipt', ref: sourceReceiptId, note: 'Source receipt for correction' });
  }
  if (!refs.some((entry) => entry.kind === 'message')) {
    refs.push({ kind: 'message', ref: 'user.correction', note: correction.trim() });
  }
  return refs;
}

function inferScope(text: string): ProposalClassification['scope'] {
  if (/spend|payment|invoice|wire/.test(text)) return 'spend';
  if (/legal|contract|compliance/.test(text)) return 'legal';
  if (/security|credential|secret|auth/.test(text)) return 'security';
  if (/customer|client|public|publish|send/.test(text)) return 'external';
  return 'internal';
}

function normalizeProposal(value: unknown, path: string): CurationProposalRecord | null {
  if (!isRecord(value)) return null;
  if (value.schema !== 'otto.proposal.v1') return null;
  if (!isString(value.id) || !isString(value.summary) || !isString(value.rationale)) return null;
  if (!isRecord(value.target) || !isRecord(value.classification)) return null;
  if (!Array.isArray(value.evidence)) return null;

  return {
    schema: 'otto.proposal.v1',
    id: value.id,
    source: isProposalSource(value.source) ? value.source : 'manual',
    kind: isProposalKind(value.kind) ? value.kind : 'task',
    summary: value.summary,
    rationale: value.rationale,
    evidence: value.evidence.filter(isEvidenceRef),
    target: value.target as unknown as ProposalTarget,
    classification: value.classification as unknown as ProposalClassification,
    status: isProposalStatus(value.status) ? value.status : 'proposed',
    created_at: isString(value.created_at) ? value.created_at : new Date().toISOString(),
    updated_at: isString(value.updated_at) ? value.updated_at : new Date().toISOString(),
    created_by: value.created_by === 'otto' || value.created_by === 'adapter' ? value.created_by : 'user',
    receipt_id: isString(value.receipt_id) ? value.receipt_id : undefined,
    decision_receipt_id: isString(value.decision_receipt_id) ? value.decision_receipt_id : undefined,
    applied_at: isString(value.applied_at) ? value.applied_at : undefined,
    decision_note: isString(value.decision_note) ? value.decision_note : undefined,
    path,
  };
}

function decisionAction(decision: ProposalDecisionKind): string {
  if (decision === 'accept') return 'curation.proposal.accept';
  if (decision === 'reject') return 'curation.proposal.reject';
  return 'curation.proposal.defer';
}

function decisionSummary(decision: ProposalDecisionKind, summary: string, canonApply: CanonApplyResult): string {
  if (decision === 'accept') {
    if (canonApply.applied && canonApply.changed) {
      return `Accepted and applied canon update: ${summary}`;
    }
    if (canonApply.applied) {
      return `Accepted proposal; canon already reflected: ${summary}`;
    }
    return `Accepted proposal: ${summary}`;
  }
  if (decision === 'reject') return `Rejected proposal: ${summary}`;
  return `Deferred proposal: ${summary}`;
}

function requiresCanonApply(target: ProposalTarget): boolean {
  return target.kind === 'standard' || target.kind === 'practice' || target.kind === 'routine' || target.kind === 'knowledge';
}

/** Apply ratified proposal content to file-backed canon when target.path is set. */
export function applyAcceptedProposal(proposal: CurationProposalRecord, appliedAt: string): CanonApplyResult {
  const { target } = proposal;
  if (!target.path) {
    return { applied: false, changed: false, reason: 'missing_target' };
  }

  if (!existsSync(target.path)) {
    if (target.action === 'create') {
      const created = createCanonFromProposal(proposal, appliedAt);
      return created
        ? { applied: true, changed: true, reason: 'created' }
        : { applied: false, changed: false, reason: 'missing_target' };
    }
    return { applied: false, changed: false, reason: 'missing_target' };
  }

  if (target.path.endsWith('.yaml') || target.path.endsWith('.yml')) {
    const raw = readFileSync(target.path, 'utf8');
    const doc = parse(raw) as Record<string, unknown>;
    const ratifiedEntry = {
      proposal_id: proposal.id,
      applied_at: appliedAt,
      summary: proposal.summary,
      rationale: proposal.rationale,
    };

    const ratified = Array.isArray(doc.otto_ratified) ? [...doc.otto_ratified] : [];
    let changed = false;
    if (!hasYamlRatification(ratified, proposal)) {
      ratified.push(ratifiedEntry);
      doc.otto_ratified = ratified;
      changed = true;
    }

    if (target.kind === 'practice' || target.kind === 'routine') {
      const guardrails = Array.isArray(doc.guardrails) ? [...doc.guardrails as string[]] : [];
      if (!hasRatifiedGuardrail(guardrails, proposal)) {
        guardrails.push(`[ratified:${proposal.id}] ${proposal.rationale}`);
        doc.guardrails = guardrails;
        changed = true;
      }
    }

    if (!changed) {
      return { applied: true, changed: false, reason: 'already_ratified' };
    }

    writeFileSync(target.path, stringify(doc));
    return { applied: true, changed: true, reason: 'updated' };
  }

  if (target.path.endsWith('.md')) {
    const raw = readFileSync(target.path, 'utf8');
    if (hasMarkdownRatification(raw, proposal)) {
      return { applied: true, changed: false, reason: 'already_ratified' };
    }
    const block = `\n\n<!-- otto:ratified ${proposal.id} ${appliedAt} -->\n${proposal.rationale}\n`;
    writeFileSync(target.path, `${raw.trimEnd()}${block}`);
    return { applied: true, changed: true, reason: 'updated' };
  }

  return { applied: false, changed: false, reason: 'unsupported_target' };
}

function createCanonFromProposal(proposal: CurationProposalRecord, appliedAt: string): boolean {
  const { target } = proposal;
  if (!target.path) return false;

  const ratifiedEntry = {
    proposal_id: proposal.id,
    applied_at: appliedAt,
    summary: proposal.summary,
    rationale: proposal.rationale,
  };

  if (target.kind === 'practice' || target.kind === 'routine') {
    const slug = target.id ?? practiceSlugFromPath(target.path);
    if (!slug) return false;
    const doc = {
      name: titleFromSlug(slug),
      slug,
      version: '0.1',
      status: 'draft',
      kind: target.kind,
      summary: proposal.summary,
      guardrails: [`[ratified:${proposal.id}] ${proposal.rationale}`],
      otto_ratified: [ratifiedEntry],
    };
    mkdirSync(dirname(target.path), { recursive: true });
    writeFileSync(target.path, stringify(doc));
    return true;
  }

  if (target.kind === 'standard') {
    if (!target.path.endsWith('.md')) return false;
    const slug = target.id ?? practiceSlugFromPath(target.path);
    const frontmatter = stringify({
      title: titleFromSlug(slug || 'standard'),
      slug: slug || undefined,
      status: 'draft',
      version: '0.1',
      otto_ratified: [ratifiedEntry],
    }).trimEnd();
    const body = [
      '```yaml',
      frontmatter,
      '```',
      '',
      `# ${titleFromSlug(slug || 'Standard')}`,
      '',
      proposal.summary,
      '',
      proposal.rationale,
      '',
      `<!-- otto:ratified ${proposal.id} ${appliedAt} -->`,
      '',
    ].join('\n');
    mkdirSync(dirname(target.path), { recursive: true });
    writeFileSync(target.path, body);
    return true;
  }

  return false;
}

function practiceSlugFromPath(path: string): string {
  const parts = path.split('/');
  const practiceIndex = parts.lastIndexOf('practice.yaml');
  if (practiceIndex > 0) return parts[practiceIndex - 1] ?? '';
  const base = parts.pop() ?? path;
  return base.replace(/\.ya?ml$/i, '');
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function hasYamlRatification(ratified: unknown[], proposal: CurationProposalRecord): boolean {
  const rationale = normalizeRatificationText(proposal.rationale);
  return ratified.some((entry) => {
    if (!isRecord(entry)) return false;
    if (entry.proposal_id === proposal.id) return true;
    return rationale !== '' && normalizeRatificationText(String(entry.rationale ?? '')) === rationale;
  });
}

function hasRatifiedGuardrail(guardrails: unknown[], proposal: CurationProposalRecord): boolean {
  const rationale = normalizeRatificationText(proposal.rationale);
  return guardrails.some((guardrail) => {
    if (typeof guardrail !== 'string') return false;
    if (guardrail.includes(`[ratified:${proposal.id}]`)) return true;
    const text = guardrail.replace(/^\[ratified:[^\]]+\]\s*/, '');
    return rationale !== '' && normalizeRatificationText(text) === rationale;
  });
}

function hasMarkdownRatification(raw: string, proposal: CurationProposalRecord): boolean {
  if (raw.includes(`<!-- otto:ratified ${proposal.id} `)) return true;
  const rationale = normalizeRatificationText(proposal.rationale);
  if (!rationale) return false;
  for (const match of raw.matchAll(/<!-- otto:ratified\s+[^>]+-->\r?\n([\s\S]*?)(?=\r?\n\r?\n<!-- otto:ratified\s+|\s*$)/g)) {
    if (normalizeRatificationText(match[1] ?? '') === rationale) return true;
  }
  return false;
}

function normalizeRatificationText(value: string): string {
  return value.trim().replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
}

function isProposalSource(value: unknown): value is CurationProposal['source'] {
  return value === 'user_correction' || value === 'receipt_failure' || value === 'intake'
    || value === 'run_review' || value === 'paperclip_event' || value === 'manual';
}

function isProposalKind(value: unknown): value is ProposalKind {
  return value === 'standard' || value === 'practice' || value === 'routine' || value === 'approval'
    || value === 'memory_writeback' || value === 'task' || value === 'receipt_requirement' || value === 'knowledge';
}

function isProposalStatus(value: unknown): value is CurationProposal['status'] {
  return value === 'proposed' || value === 'needs_approval' || value === 'deferred'
    || value === 'accepted' || value === 'rejected' || value === 'blocked' || value === 'applied';
}

function isEvidenceRef(value: unknown): value is ProposalEvidenceRef {
  return isRecord(value) && isString(value.kind) && isString(value.ref);
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'proposal';
}

function approvalFromProposal(
  proposal: CurationProposalRecord,
  receiptLookup: ReceiptStore,
): ApprovalRecord | null {
  if (!proposal.decision_receipt_id) return null;
  if (proposal.status !== 'applied' && proposal.status !== 'rejected' && proposal.status !== 'deferred') {
    return null;
  }
  const receipt = receiptLookup.get(proposal.decision_receipt_id);
  const status = proposal.status === 'applied'
    ? 'approved'
    : proposal.status === 'rejected'
      ? 'denied'
      : 'deferred';
  return {
    id: proposal.decision_receipt_id,
    proposal_id: proposal.id,
    requirement: requirementForProposal(proposal),
    status,
    scope: proposal.classification.scope,
    decided_at: proposal.applied_at ?? proposal.updated_at,
    receipt_id: proposal.decision_receipt_id,
    receipt_path: receipt?.path ?? join(OTTO_DIR, 'receipts', proposal.decision_receipt_id),
  };
}

function requirementForProposal(proposal: CurationProposalRecord): ApprovalRequirement {
  if (proposal.classification.scope === 'spend') return 'spend';
  if (proposal.classification.scope === 'security') return 'credential-or-security-change';
  if (proposal.classification.scope === 'external') return 'send-or-publish';
  if (proposal.target.kind === 'routine') return 'enabling-globally';
  return 'external-side-effects';
}

function timestampMs(value: string): number {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
