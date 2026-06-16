import type { WrittenReceipt } from './receipt-writer';
import { ProposalStore } from './proposal-store';
import { onBlockedReceipt, shouldEmitBlockedReceipt } from './receipt-events';

const DEDUPE_MS = 7 * 24 * 60 * 60 * 1000;

let unsubscribe: (() => void) | null = null;

export function enableReceiptFailureProposer(proposals: ProposalStore): () => void {
  if (unsubscribe) return unsubscribe;
  unsubscribe = onBlockedReceipt((receipt) => {
    proposeFromBlockedReceipt(proposals, receipt);
  });
  return () => {
    unsubscribe?.();
    unsubscribe = null;
  };
}

export function proposeFromBlockedReceipt(proposals: ProposalStore, receipt: WrittenReceipt): void {
  if (!shouldEmitBlockedReceipt(receipt)) return;
  const blockerCode = receipt.blocker?.code?.trim() || 'blocked';
  const action = receipt.action.trim();
  const dedupePrefix = `Blocked ${action} (${blockerCode})`;
  const cutoff = Date.now() - DEDUPE_MS;
  const duplicate = proposals.list().proposals.some((proposal) => {
    if (proposal.source !== 'receipt_failure') return false;
    if (timestampMs(proposal.created_at) < cutoff) return false;
    return proposal.rationale.startsWith(dedupePrefix);
  });
  if (duplicate) return;

  const summary = receipt.blocker?.message?.trim() || receipt.result.summary;
  const rationaleBody = [
    receipt.blocker?.message?.trim(),
    receipt.blocker?.next_action?.trim(),
  ].filter(Boolean).join('\n\n') || summary;
  const rationale = `${dedupePrefix}\n\n${rationaleBody}`;

  proposals.createFromSystem({
    summary: summary.length > 120 ? `${summary.slice(0, 117)}…` : summary,
    rationale,
    target: { kind: 'none' },
    source: 'receipt_failure',
    created_by: 'otto',
    evidence: [{ kind: 'receipt', ref: receipt.id, note: receipt.blocker?.message ?? receipt.result.summary }],
  });
}

function timestampMs(value: string): number {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}
