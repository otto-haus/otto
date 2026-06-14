import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { ReceiptWriteInput } from './receipt-writer';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import { KnowledgeStore } from './knowledge-store';
import { ProposalStore } from './proposal-store';

export type AiFrontierReviewRunOptions = {
  /** When true, route a behavior-policy change through Curation instead of editing routing silently. */
  routingChangeDetected?: boolean;
  routingSummary?: string;
  routingRationale?: string;
};

export type AiFrontierReviewRunResult = {
  receipt: WrittenReceipt;
  touched: string[];
  routingProposalId?: string;
};

/** Manual AI frontier review (062) — facts-only touch + knowledge update receipt. */
export class AiFrontierReviewExecutor {
  constructor(
    private knowledge = new KnowledgeStore(),
    private receipts = new ReceiptWriter(),
    private proposals = new ProposalStore(),
  ) {}

  run(opts: AiFrontierReviewRunOptions = {}): AiFrontierReviewRunResult {
    const listing = this.knowledge.listResult();
    const touched: string[] = [];
    const today = new Date().toISOString().slice(0, 10);

    if (listing.capabilityNotesPath && existsSync(listing.capabilityNotesPath)) {
      const reviewMarker = `<!-- ai-frontier-review ${today} -->`;
      const capabilityNotes = readFileSync(listing.capabilityNotesPath, 'utf8');
      if (!capabilityNotes.includes(reviewMarker)) {
        const reviewNote = `${reviewMarker}\n_Last manual review run: ${today}. Paste external benchmark notes here; routing changes go to Curation._`;
        const separator = capabilityNotes.endsWith('\n\n')
          ? ''
          : capabilityNotes.endsWith('\n')
            ? '\n'
            : '\n\n';
        writeFileSync(listing.capabilityNotesPath, `${capabilityNotes}${separator}${reviewNote}\n`);
        touched.push(listing.capabilityNotesPath);
      }
    }

    if (listing.registryPath && existsSync(listing.registryPath)) {
      const raw = parse(readFileSync(listing.registryPath, 'utf8')) as Record<string, unknown>;
      raw.last_reviewed = today;
      const models = Array.isArray(raw.models) ? raw.models : [];
      for (const entry of models) {
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
          (entry as Record<string, unknown>).last_verified = today;
        }
      }
      writeFileSync(listing.registryPath, stringify(raw));
      touched.push(listing.registryPath);
    }

    const receiptDir = join(listing.dir, '_receipts');
    const receiptPath = join(receiptDir, `knowledge-update-${today}.md`);
    if (existsSync(join(listing.dir, '_templates'))) {
      mkdirSync(receiptDir, { recursive: true });
      writeFileSync(
        receiptPath,
        `# Knowledge update receipt\n\n- date: ${today}\n- routine: ai-frontier-review\n- touched: ${touched.join(', ') || 'none'}\n- routing: unchanged (policy edits require Curation)\n`,
      );
      touched.push(receiptPath);
    }

    let routingProposalId: string | undefined;
    if (opts.routingChangeDetected) {
      const created = this.proposals.createFromSystem({
        summary:
          opts.routingSummary?.trim() ||
          'Update AI frontier model routing after manual review',
        rationale:
          opts.routingRationale?.trim() ||
          'Manual AI frontier review detected a behavior-policy change. Routing updates require Curation ratification — not silent registry edits.',
        target: {
          kind: 'knowledge',
          id: 'ai-frontier-routing',
          path: listing.registryPath ?? join(listing.dir, 'ai-frontier', 'model-registry.yaml'),
          action: 'update',
        },
        evidence: touched.map((ref) => ({ kind: 'file' as const, ref, note: 'knowledge file' })),
        source: 'run_review',
        created_by: 'otto',
      });
      routingProposalId = created.proposal.id;
    }

    const receiptInput: ReceiptWriteInput = {
      status: 'success',
      subject: { type: 'knowledge', id: 'ai-frontier' },
      action: 'knowledge.frontier_review.manual',
      input: { routine: 'ai-frontier-review', date: today, routingChangeDetected: !!opts.routingChangeDetected },
      result: {
        summary: touched.length
          ? opts.routingChangeDetected
            ? `AI frontier review touched ${touched.length} file(s); routing change proposed to Curation.`
            : `AI frontier review touched ${touched.length} file(s); routing unchanged.`
          : 'AI frontier review recorded; no knowledge files found to update.',
        data: { touched, routingProposal: !!routingProposalId, routingProposalId: routingProposalId ?? null },
      },
      evidence: touched.map((ref) => ({ kind: 'file' as const, ref, note: 'knowledge file' })),
      blocker: null,
    };

    return { receipt: this.receipts.write(receiptInput), touched, routingProposalId };
  }
}
