import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  PaperclipCompletionEvent,
  PaperclipReviewSignal,
  PaperclipTaskMapping,
} from '@otto-haus/core';
import { OTTO_DIR } from './config-store';
import { ProposalStore } from './proposal-store';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import { TicketStore } from './ticket-store';

export const PAPERCLIP_DIR = join(OTTO_DIR, 'paperclip');
export const PAPERCLIP_MAPPINGS_PATH = join(PAPERCLIP_DIR, 'mappings.json');

export interface PaperclipCompletionResult {
  signal: PaperclipReviewSignal;
  receipt: WrittenReceipt;
  ticket_status: string;
}

export class PaperclipStatusStore {
  constructor(
    private mappingsPath = PAPERCLIP_MAPPINGS_PATH,
    private tickets = new TicketStore(),
    private proposals = new ProposalStore(),
    private receipts = new ReceiptWriter(),
  ) {}

  listMappings(): PaperclipTaskMapping[] {
    return readMappings(this.mappingsPath);
  }

  saveMapping(input: Omit<PaperclipTaskMapping, 'created_at'> & { created_at?: string }): PaperclipTaskMapping {
    mkdirSync(dirname(this.mappingsPath), { recursive: true });
    const mappings = readMappings(this.mappingsPath);
    const created_at = input.created_at ?? new Date().toISOString();
    const next: PaperclipTaskMapping = {
      otto_ticket_id: input.otto_ticket_id.trim(),
      paperclip_task_id: input.paperclip_task_id.trim(),
      paperclip_url: input.paperclip_url?.trim() || undefined,
      created_at,
    };
    const withoutDupes = mappings.filter(
      (entry) =>
        entry.paperclip_task_id !== next.paperclip_task_id
        && entry.otto_ticket_id !== next.otto_ticket_id,
    );
    writeFileSync(
      this.mappingsPath,
      `${JSON.stringify([...withoutDupes, next], null, 2)}\n`,
      'utf8',
    );
    return next;
  }

  mappingForPaperclipTask(paperclipTaskId: string): PaperclipTaskMapping | null {
    return (
      this.listMappings().find((entry) => entry.paperclip_task_id === paperclipTaskId.trim()) ?? null
    );
  }

  /** Paperclip complete → review signal + receipt + curation proposal; never merged (075). */
  ingestCompletion(event: PaperclipCompletionEvent): PaperclipCompletionResult {
    const mapping = this.mappingForPaperclipTask(event.paperclip_task_id);
    if (!mapping) {
      throw new Error(`No otto ticket mapping for Paperclip task ${event.paperclip_task_id}`);
    }

    const ticketBefore = this.tickets.get(mapping.otto_ticket_id);
    if (!ticketBefore) {
      throw new Error(`Mapped otto ticket not found: ${mapping.otto_ticket_id}`);
    }

    const completedAt = event.completed_at.trim();
    const paperclipUrl = event.paperclip_url?.trim() || mapping.paperclip_url;
    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'task', id: mapping.otto_ticket_id },
      action: 'paperclip.completion.review_requested',
      input: {
        paperclip_task_id: event.paperclip_task_id,
        completed_at: completedAt,
        run_id: event.run_id ?? null,
        paperclip_url: paperclipUrl ?? null,
      },
      result: {
        summary: 'Paperclip reports complete — verify AC before merged.',
        data: {
          otto_ticket_id: mapping.otto_ticket_id,
          review_requested: true,
          auto_done: false,
        },
      },
      evidence: paperclipUrl
        ? [{ kind: 'url', ref: paperclipUrl, note: 'Paperclip task' }]
        : [{ kind: 'other', ref: event.paperclip_task_id, note: 'Paperclip task id' }],
      blocker: null,
    });

    const proposal = this.proposals.createFromSystem({
      summary: 'Paperclip reports complete — verify AC',
      rationale:
        'Paperclip marked the linked task complete. Otto records review requested only; reviewer +1 and AC proof still required before merged.',
      target: { kind: 'none' },
      source: 'paperclip_event',
      created_by: 'adapter',
      evidence: [
        { kind: 'receipt', ref: receipt.id, note: 'Paperclip completion import' },
        ...(paperclipUrl ? [{ kind: 'url' as const, ref: paperclipUrl, note: 'Paperclip task' }] : []),
      ],
    });

    const ticket = this.tickets.recordPaperclipReviewRequested(mapping.otto_ticket_id, {
      paperclip_task_id: event.paperclip_task_id,
      paperclip_url: paperclipUrl,
      review_requested_at: completedAt,
      review_signal_receipt_id: receipt.id,
    });

    const signal: PaperclipReviewSignal = {
      otto_ticket_id: mapping.otto_ticket_id,
      paperclip_task_id: event.paperclip_task_id,
      review_requested_at: completedAt,
      receipt_id: receipt.id,
      proposal_id: proposal.proposal.id,
      ticket_status: ticket.status,
      status_advanced: ticket.status === 'review' && ticketBefore.status !== 'review',
    };

    return { signal, receipt, ticket_status: ticket.status };
  }
}

function readMappings(path: string): PaperclipTaskMapping[] {
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeMapping(entry))
      .filter((entry): entry is PaperclipTaskMapping => !!entry);
  } catch {
    return [];
  }
}

function normalizeMapping(value: unknown): PaperclipTaskMapping | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const otto_ticket_id = typeof raw.otto_ticket_id === 'string' ? raw.otto_ticket_id.trim() : '';
  const paperclip_task_id = typeof raw.paperclip_task_id === 'string' ? raw.paperclip_task_id.trim() : '';
  const created_at = typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString();
  if (!otto_ticket_id || !paperclip_task_id) return null;
  const paperclip_url = typeof raw.paperclip_url === 'string' && raw.paperclip_url.trim()
    ? raw.paperclip_url.trim()
    : undefined;
  return { otto_ticket_id, paperclip_task_id, paperclip_url, created_at };
}
