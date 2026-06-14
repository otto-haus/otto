import type { BehaviorChangelogEntry, BehaviorChangelogResult } from '@otto-haus/core';
import { defaultOttoDir } from './config-store';
import { ConstitutionStore } from './constitution-store';
import { ProposalStore } from './proposal-store';
import { ReceiptStore } from './receipt-store';

const EMPTY_MESSAGE = 'No behavior changes this week.';

export class BehaviorChangelog {
  constructor(
    private proposals = new ProposalStore(),
    private receipts = new ReceiptStore(),
    private constitution = new ConstitutionStore(),
    private windowDays = 7,
  ) {}

  list(windowDays = this.windowDays): BehaviorChangelogResult {
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const entries: BehaviorChangelogEntry[] = [];

    for (const proposal of this.proposals.list().proposals) {
      if (proposal.status !== 'applied' || !proposal.applied_at) continue;
      if (timestampMs(proposal.applied_at) < cutoff) continue;
      entries.push({
        id: `chg_prop_${proposal.id}`,
        timestamp: proposal.applied_at,
        what: proposal.summary,
        why: proposal.rationale,
        authority: proposal.created_by === 'user' ? 'human' : proposal.created_by,
        receipt_id: proposal.decision_receipt_id ?? proposal.receipt_id ?? proposal.id,
        source: 'proposal_ratified',
      });
    }

    for (const receipt of this.receipts.list().receipts) {
      if (receipt.action !== 'constitution.amend' || receipt.status !== 'success') continue;
      if (timestampMs(receipt.timestamp) < cutoff) continue;
      entries.push({
        id: `chg_const_${receipt.id}`,
        timestamp: receipt.timestamp,
        what: 'Constitution amended',
        why: receipt.summary,
        authority: 'human',
        receipt_id: receipt.id,
        source: 'constitution_amend',
      });
    }

    for (const receipt of this.receipts.list().receipts) {
      if (!receipt.action.startsWith('autonomy.') || receipt.status !== 'success') continue;
      if (timestampMs(receipt.timestamp) < cutoff) continue;
      entries.push({
        id: `chg_auto_${receipt.id}`,
        timestamp: receipt.timestamp,
        what: receipt.action.replace('autonomy.', 'Autonomy: '),
        why: receipt.summary,
        authority: 'human',
        receipt_id: receipt.id,
        source: 'autonomy_policy',
      });
    }

    entries.sort((a, b) => timestampMs(b.timestamp) - timestampMs(a.timestamp));

    return {
      dir: defaultOttoDir(),
      entries,
      window_days: windowDays,
      empty_message: EMPTY_MESSAGE,
    };
  }

  summary(): { lastThree: BehaviorChangelogEntry[]; total: number; empty_message: string } {
    const result = this.list();
    return {
      lastThree: result.entries.slice(0, 3),
      total: result.entries.length,
      empty_message: result.empty_message,
    };
  }
}

function timestampMs(value: string): number {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}
