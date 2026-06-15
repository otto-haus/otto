import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CurationProposalRecord } from '@otto-haus/core';
import { ProposalStore } from './proposal-store';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import { PracticeStore } from './practice-store';

export type PracticeMiningObserveResult = {
  candidates: string[];
  proposals: CurationProposalRecord[];
  receipt_id: string;
  receipt: WrittenReceipt;
};

/** Observe receipts/runs and draft Practice proposals for repeated behavior (061). */
export class PracticeMiningLoop {
  constructor(
    private practices = new PracticeStore(),
    private proposals = new ProposalStore(),
    private receipts = new ReceiptWriter(),
  ) {}

  observe(receiptsDir: string, minOccurrences = 2): PracticeMiningObserveResult {
    const actionCounts = new Map<string, { count: number; paths: string[] }>();

    if (existsSync(receiptsDir)) {
      for (const file of readdirSync(receiptsDir).filter((f) => f.endsWith('.json'))) {
        const path = join(receiptsDir, file);
        try {
          const raw = JSON.parse(readFileSync(path, 'utf8')) as { action?: string };
          if (!raw.action?.trim()) continue;
          const action = raw.action.trim();
          const entry = actionCounts.get(action) ?? { count: 0, paths: [] };
          entry.count += 1;
          entry.paths.push(path);
          actionCounts.set(action, entry);
        } catch {
          // skip unreadable receipt
        }
      }
    }

    const known = new Set(this.practices.listResult().practices.map((p) => p.slug));
    // Skip actions that already have a non-terminal practice proposal in the inbox, so repeated
    // observe scans don't pile up duplicate pending rows. Rejected/applied proposals are terminal,
    // so a later observe is allowed to re-propose those (#718).
    const pendingPracticeSlugs = new Set(
      this.proposals.list().proposals
        .filter(
          (p) =>
            p.target?.kind === 'practice' &&
            p.target?.action === 'create' &&
            typeof p.target?.id === 'string' &&
            p.status !== 'rejected' &&
            p.status !== 'applied',
        )
        .map((p) => p.target.id as string),
    );
    const candidates: string[] = [];
    const proposals: CurationProposalRecord[] = [];

    for (const [action, { count, paths }] of actionCounts) {
      if (count < minOccurrences) continue;
      const slug = practiceSlugFromAction(action);
      const candidate = `practice-from:${action}`;
      if (known.has(slug) || pendingPracticeSlugs.has(slug)) continue;
      candidates.push(candidate);

      const practicePath = join(this.practices.listResult().dir, slug, 'practice.yaml');
      const created = this.proposals.createFromSystem({
        summary: `Practice candidate from repeated ${action}`,
        rationale: `Observed ${count} receipts with action "${action}" under ${receiptsDir}. Draft only — activation requires Curation ratification.`,
        target: { kind: 'practice', id: slug, path: practicePath, action: 'create' },
        evidence: paths.slice(0, 5).map((ref) => ({ kind: 'file' as const, ref, note: 'repeated receipt' })),
        source: 'run_review',
        created_by: 'otto',
      });
      proposals.push(created.proposal);
    }

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'practice', id: 'mining' },
      action: 'practice.mining.observe',
      input: { receiptsDir, minOccurrences },
      result: {
        summary: proposals.length
          ? `Observed ${proposals.length} practice candidate(s) from repeated behavior`
          : 'No new practice candidates from repeated behavior',
        data: { candidates, proposalIds: proposals.map((p) => p.id), scannedActions: actionCounts.size },
      },
      evidence: [{ kind: 'file', ref: receiptsDir, note: 'receipts dir scan (paths only)' }],
      blocker: null,
    });

    return { candidates, proposals, receipt_id: receipt.id, receipt };
  }
}

function practiceSlugFromAction(action: string): string {
  return action
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .toLowerCase();
}
