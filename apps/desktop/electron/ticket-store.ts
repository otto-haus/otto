import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { TicketCompileInput, TicketListResult, TicketRecord, TicketStatus } from '@otto-haus/core';
import type { TicketReviewRecord } from './shared/types';
import { OTTO_DIR } from './config-store';
import { CheckRunner } from './check-runner';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';

export const TICKETS_DIR = join(OTTO_DIR, 'tickets');

export interface TicketCompileResult {
  ticket: TicketRecord;
  receipt: WrittenReceipt;
}

export class TicketStore {
  constructor(
    private dir = TICKETS_DIR,
    private receipts = new ReceiptWriter(),
    private checks = new CheckRunner(),
  ) {}

  list(): TicketListResult {
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this.dir)) return { dir: this.dir, tickets: [], skipped: 0, storage: 'files' };

    let skipped = 0;
    const tickets: TicketRecord[] = [];
    for (const entry of readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const ticketPath = join(this.dir, entry.name, 'ticket.yaml');
      const ticket = this.readTicket(ticketPath, join(this.dir, entry.name));
      if (ticket) tickets.push(ticket);
      else skipped += 1;
    }

    tickets.sort((a, b) => timestampMs(b.updated_at) - timestampMs(a.updated_at));
    return { dir: this.dir, tickets, skipped, storage: 'files' };
  }

  get(ticketId: string): TicketRecord | null {
    return this.list().tickets.find((ticket) => ticket.ticket_id === ticketId) ?? null;
  }

  updateStatus(
    ticketId: string,
    patch: Partial<Pick<TicketRecord, 'status' | 'owner' | 'model'>> & { review?: TicketReviewRecord },
  ): TicketRecord {
    const existing = this.get(ticketId);
    if (!existing) throw new Error(`Ticket not found: ${ticketId}`);
    const raw = parse(readFileSync(existing.ticketPath, 'utf8')) as Record<string, unknown>;
    const nextStatus = patch.status ?? status(raw.status);
    const review = patch.review ?? readReview(raw.review);

    if (nextStatus === 'review' && existing.status !== 'active' && existing.status !== 'blocked') {
      throw new Error(`Cannot move ticket to review from status "${existing.status}". Start implementation (active) first.`);
    }
    if (nextStatus === 'merged') {
      if (existing.status !== 'review' && existing.status !== 'merged') {
        throw new Error(`Cannot mark ticket merged from status "${existing.status}". Move to review and obtain reviewer +1 first.`);
      }
      const verdict = review?.verdict;
      const evidence = review?.evidence ?? [];
      if (verdict !== '+1') {
        throw new Error('Cannot mark ticket merged without reviewer_verdict: +1.');
      }
      if (!evidence.length) {
        throw new Error('Cannot mark ticket merged without evidence refs mapped to acceptance criteria.');
      }
      const checkResults = this.checks.evaluateDoneClaim({
        acceptance_criteria: existing.acceptance_criteria,
        review,
        evidence,
      });
      const blocked = checkResults.find((r) => r.blocked && !r.passed);
      if (blocked) {
        throw new Error(`${blocked.message}${blocked.receipt_id ? ` (receipt: ${blocked.receipt_id})` : ''}`);
      }
    }

    const next: Record<string, unknown> = {
      ...raw,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };
    if (patch.owner !== undefined) next.owner = patch.owner;
    if (patch.model !== undefined) next.model = patch.model;
    if (patch.review) next.review = patch.review;
    writeFileSync(existing.ticketPath, stringify(next), 'utf8');
    const updated = this.readTicket(existing.ticketPath, existing.root);
    if (!updated) throw new Error(`Failed to update ticket: ${ticketId}`);
    return updated;
  }

  compile(input: TicketCompileInput): TicketCompileResult {
    mkdirSync(this.dir, { recursive: true });
    const slug = slugify(input.slug);
    const ticketId = `ticket_${slug}`;
    const root = join(this.dir, slug);
    mkdirSync(root, { recursive: true });

    const now = new Date().toISOString();
    const acceptance = (input.acceptance_criteria ?? [{ id: 'AC1', text: input.objective.trim() }]).map((ac) => ({
      id: ac.id,
      text: ac.text,
      proof: ac.proof ?? `receipts/${now.slice(0, 10)}/${slug}.md`,
    }));

    const body = {
      ticket_id: ticketId,
      status: 'proposed' as TicketStatus,
      charter: input.charter ?? null,
      owner: null,
      model: null,
      worktree: `.letta/worktrees/${slug}`,
      branch: `feat/${slug}`,
      objective: input.objective.trim(),
      why: input.why?.trim() ?? '',
      owned_paths: input.owned_paths ?? ['**'],
      shared_paths: input.shared_paths ?? ['packages/core/**'],
      non_goals: ['Unrelated refactors', 'Naming changes unless requested'],
      acceptance_criteria: acceptance,
      checks: input.checks ?? ['bun test', 'bun run typecheck'],
      stop_conditions: ['Missing approval for shared contract change', 'Protected main merge without review'],
      requires_approval_for: ['shared_contract_change', 'protected_main_merge', 'external_side_effect'],
      receipt_path: `receipts/${now.slice(0, 10)}/${slug}.md`,
      integration_notes: 'Worker returns receipt + PR link; Main Otto integrates after review proof.',
      updated_at: now,
    };

    const ticketPath = join(root, 'ticket.yaml');
    writeFileSync(ticketPath, stringify(body), 'utf8');

    const packetPath = join(root, 'worker-packet.md');
    writeFileSync(
      packetPath,
      renderWorkerPacket(body),
      'utf8',
    );

    const ticket = this.readTicket(ticketPath, root);
    if (!ticket) throw new Error('Failed to compile ticket');

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'task', id: ticketId },
      action: 'ticket.compile',
      input: { slug, objective: input.objective },
      result: { summary: `Compiled ticket ${ticketId}`, data: { ticketPath, packetPath } },
      evidence: [{ kind: 'file', ref: ticketPath, note: 'ticket.yaml' }],
      blocker: null,
    });

    return { ticket, receipt };
  }

  private readTicket(ticketPath: string, root: string): TicketRecord | null {
    if (!existsSync(ticketPath)) return null;
    try {
      const raw = parse(readFileSync(ticketPath, 'utf8')) as Record<string, unknown>;
      const packetPath = join(root, 'worker-packet.md');
      return {
        schema: 'otto.ticket.v1',
        ticket_id: String(raw.ticket_id ?? ''),
        status: status(raw.status),
        charter: optionalString(raw.charter),
        owner: optionalString(raw.owner),
        model: optionalString(raw.model),
        worktree: optionalString(raw.worktree),
        branch: optionalString(raw.branch),
        objective: String(raw.objective ?? ''),
        why: optionalString(raw.why),
        owned_paths: stringArray(raw.owned_paths),
        shared_paths: stringArray(raw.shared_paths),
        non_goals: stringArray(raw.non_goals),
        acceptance_criteria: acceptanceCriteria(raw.acceptance_criteria),
        checks: stringArray(raw.checks),
        stop_conditions: stringArray(raw.stop_conditions),
        requires_approval_for: stringArray(raw.requires_approval_for),
        receipt_path: optionalString(raw.receipt_path),
        integration_notes: optionalString(raw.integration_notes),
        root,
        ticketPath,
        packetPath: existsSync(packetPath) ? packetPath : undefined,
        updated_at: String(raw.updated_at ?? new Date().toISOString()),
      };
    } catch {
      return null;
    }
  }
}

function renderWorkerPacket(body: Record<string, unknown>): string {
  const ac = acceptanceCriteria(body.acceptance_criteria)
    .map((item) => `- **${item.id}**: ${item.text} (proof: ${item.proof ?? 'receipt'})`)
    .join('\n');
  return `# Worker packet — ${body.ticket_id}

## Objective
${body.objective}

## Why
${body.why || 'See charter / parent bet.'}

## Owned paths
${stringArray(body.owned_paths).map((p) => `- ${p}`).join('\n')}

## Shared paths
${stringArray(body.shared_paths).map((p) => `- ${p}`).join('\n')}

## Non-goals
${stringArray(body.non_goals).map((p) => `- ${p}`).join('\n')}

## Acceptance criteria
${ac}

## Checks
${stringArray(body.checks).map((p) => `- \`${p}\``).join('\n')}

## Stop conditions
${stringArray(body.stop_conditions).map((p) => `- ${p}`).join('\n')}

## Worktree / branch
- worktree: \`${body.worktree}\`
- branch: \`${body.branch}\`

## Receipt
Write proof to \`${body.receipt_path}\` before claiming done.
`;
}

function readReview(value: unknown): TicketReviewRecord | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const verdict = raw.verdict === '+1' || raw.verdict === '-1' || raw.verdict === 'blocked' ? raw.verdict : undefined;
  const evidence = stringArray(raw.evidence);
  const reviewed_at = optionalString(raw.reviewed_at);
  const blocker = optionalString(raw.blocker);
  if (!verdict && !evidence.length && !reviewed_at) return undefined;
  return { verdict, evidence, reviewed_at, blocker };
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `slice-${randomUUID().slice(0, 6)}`;
}

function status(value: unknown): TicketStatus {
  if (value === 'active' || value === 'blocked' || value === 'review' || value === 'merged' || value === 'cancelled') return value;
  return 'proposed';
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function acceptanceCriteria(value: unknown): Array<{ id: string; text: string; proof?: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as Record<string, unknown>;
      const id = typeof raw.id === 'string' ? raw.id : '';
      const text = typeof raw.text === 'string' ? raw.text : '';
      if (!id || !text) return null;
      const proof = optionalString(raw.proof);
      return proof ? { id, text, proof } : { id, text };
    })
    .filter((item): item is { id: string; text: string; proof?: string } => item !== null);
}

function timestampMs(value: string): number {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}
