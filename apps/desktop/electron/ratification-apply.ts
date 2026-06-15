import type { CurationProposalRecord } from '@otto-haus/core';
import type { MemoryUpdateResult } from './shared/types';
import { BehaviorChangelog } from './behavior-changelog';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';

/**
 * Letta core-memory write surface needed to apply a ratified change to the agent.
 * MemoryStore implements this; tests inject a fake so no network/agent is required.
 */
export interface MemoryWriter {
  updateBlock(label: string, value: string): Promise<MemoryUpdateResult>;
}

/**
 * Dedicated Letta core-memory block that carries otto's ratified behavior changelog.
 * Writing here puts ratified governance changes into the agent's persistent runtime
 * context, so the next turn actually sees them (#637).
 */
export const BEHAVIOR_CHANGELOG_BLOCK_LABEL = 'otto_behavior_changelog';

export interface RatificationMemoryWrite {
  attempted: boolean;
  applied: boolean;
  label: string | null;
  receipt: WrittenReceipt;
}

export interface RatificationChangelogInjection {
  attempted: boolean;
  applied: boolean;
  label: string;
  entryCount: number;
  receipt: WrittenReceipt;
}

export interface RatificationApplyResult {
  memoryWrite?: RatificationMemoryWrite;
  changelogInjection?: RatificationChangelogInjection;
}

/**
 * Closes the ratification → Letta legs of the north star (#639 + #637).
 *
 * `ProposalStore.decide()` stays pure file-state. This applier is the side-effecting
 * WRITE path: after a proposal is ratified (status `applied`), it (i) PATCHes the
 * targeted Letta core-memory block for `memory_writeback` proposals, and (ii) injects
 * the behavior-changelog snapshot into the agent's runtime context block.
 *
 * Every action records a receipt — a real Letta write on success, or an honest
 * `blocked` receipt with a recoverable next action when the runtime is unreachable.
 * Nothing reports success for work that did not happen.
 */
export class RatificationApplier {
  constructor(
    private memory: MemoryWriter,
    private changelog: BehaviorChangelog = new BehaviorChangelog(),
    private receipts: ReceiptWriter = new ReceiptWriter(),
  ) {}

  async applyAfterRatification(proposal: CurationProposalRecord): Promise<RatificationApplyResult> {
    if (proposal.status !== 'applied') {
      // Only ratified (accepted+applied) proposals reach the agent. Rejected/deferred
      // proposals must never write to Letta.
      return {};
    }

    const result: RatificationApplyResult = {};
    if (proposal.kind === 'memory_writeback' || proposal.target.kind === 'memory') {
      result.memoryWrite = await this.applyMemoryWriteback(proposal);
    }
    result.changelogInjection = await this.injectChangelog(proposal);
    return result;
  }

  private async applyMemoryWriteback(proposal: CurationProposalRecord): Promise<RatificationMemoryWrite> {
    const label = proposal.target.id?.trim() || null;
    const value = proposal.rationale.trim();

    if (!label) {
      const receipt = this.receipts.write({
        status: 'blocked',
        subject: { type: 'proposal', id: proposal.id },
        action: 'curation.memory.writeback.apply',
        input: { proposalId: proposal.id, label: null },
        result: {
          summary: `Ratified memory writeback has no target block label: ${proposal.summary}`,
          data: { proposalId: proposal.id, applied: false },
        },
        evidence: [{ kind: 'message', ref: 'user.correction', note: value.slice(0, 200) }],
        blocker: {
          code: 'memory_writeback_missing_label',
          message: 'Memory writeback proposal must name the Letta core-memory block (target.id) before it can be applied.',
          recoverable: true,
          next_action: 'Set the target memory block label on the proposal, then ratify again.',
        },
      });
      return { attempted: false, applied: false, label: null, receipt };
    }

    const update = await this.memory.updateBlock(label, value);
    if (update.block) {
      const receipt = this.receipts.write({
        status: 'success',
        subject: { type: 'proposal', id: proposal.id },
        action: 'curation.memory.writeback.apply',
        input: { proposalId: proposal.id, label, agentId: update.agentId, apiPath: update.apiPath },
        result: {
          summary: `Ratified memory writeback applied to Letta block "${label}": ${proposal.summary}`,
          data: {
            proposalId: proposal.id,
            applied: true,
            label,
            agentId: update.agentId,
            apiPath: update.apiPath,
          },
        },
        evidence: [
          { kind: 'message', ref: 'user.correction', note: value.slice(0, 200) },
          { kind: 'log', ref: update.apiPath, note: 'Letta core-memory PATCH' },
        ],
        blocker: null,
      });
      return { attempted: true, applied: true, label, receipt };
    }

    const receipt = this.receipts.write({
      status: 'blocked',
      subject: { type: 'proposal', id: proposal.id },
      action: 'curation.memory.writeback.apply',
      input: { proposalId: proposal.id, label, apiPath: update.apiPath },
      result: {
        summary: `Ratified memory writeback could not reach Letta block "${label}": ${proposal.summary}`,
        data: { proposalId: proposal.id, applied: false, label, error: update.error ?? null },
      },
      evidence: [{ kind: 'log', ref: update.apiPath, note: 'Letta core-memory PATCH target' }],
      blocker: {
        code: 'memory_writeback_letta_unreachable',
        message: update.error ?? 'Letta core-memory update did not return a block.',
        recoverable: true,
        next_action: 'Connect the Letta runtime in Settings, then re-apply this ratified proposal.',
      },
    });
    return { attempted: true, applied: false, label, receipt };
  }

  private async injectChangelog(proposal: CurationProposalRecord): Promise<RatificationChangelogInjection> {
    const snapshot = this.changelog.list();
    const value = renderChangelogBlock(snapshot.entries, snapshot.empty_message);
    const update = await this.memory.updateBlock(BEHAVIOR_CHANGELOG_BLOCK_LABEL, value);

    if (update.block) {
      const receipt = this.receipts.write({
        status: 'success',
        subject: { type: 'proposal', id: proposal.id },
        action: 'curation.changelog.inject',
        input: { proposalId: proposal.id, label: BEHAVIOR_CHANGELOG_BLOCK_LABEL, apiPath: update.apiPath },
        result: {
          summary: `Behavior changelog injected into agent context (${snapshot.entries.length} ratified change(s))`,
          data: {
            proposalId: proposal.id,
            applied: true,
            label: BEHAVIOR_CHANGELOG_BLOCK_LABEL,
            entryCount: snapshot.entries.length,
            agentId: update.agentId,
          },
        },
        evidence: [{ kind: 'log', ref: update.apiPath, note: 'Letta core-memory PATCH (changelog block)' }],
        blocker: null,
      });
      return {
        attempted: true,
        applied: true,
        label: BEHAVIOR_CHANGELOG_BLOCK_LABEL,
        entryCount: snapshot.entries.length,
        receipt,
      };
    }

    const receipt = this.receipts.write({
      status: 'blocked',
      subject: { type: 'proposal', id: proposal.id },
      action: 'curation.changelog.inject',
      input: { proposalId: proposal.id, label: BEHAVIOR_CHANGELOG_BLOCK_LABEL, apiPath: update.apiPath },
      result: {
        summary: 'Behavior changelog could not be injected — Letta runtime context block unreachable',
        data: {
          proposalId: proposal.id,
          applied: false,
          label: BEHAVIOR_CHANGELOG_BLOCK_LABEL,
          entryCount: snapshot.entries.length,
          error: update.error ?? null,
        },
      },
      evidence: [{ kind: 'log', ref: update.apiPath, note: 'Letta core-memory PATCH target (changelog block)' }],
      blocker: {
        code: 'changelog_inject_letta_unreachable',
        message: update.error ?? `Letta core-memory block "${BEHAVIOR_CHANGELOG_BLOCK_LABEL}" did not accept the changelog write.`,
        recoverable: true,
        next_action: `Create or connect the "${BEHAVIOR_CHANGELOG_BLOCK_LABEL}" Letta memory block, then ratify again.`,
      },
    });
    return {
      attempted: true,
      applied: false,
      label: BEHAVIOR_CHANGELOG_BLOCK_LABEL,
      entryCount: snapshot.entries.length,
      receipt,
    };
  }
}

/** Render the ratified behavior changelog as a compact, agent-readable memory block. */
export function renderChangelogBlock(
  entries: Array<{ timestamp: string; what: string; why: string; authority: string; receipt_id: string }>,
  emptyMessage: string,
  limit = 10,
): string {
  const header = 'otto behavior changelog — ratified governance changes the agent must honor.';
  if (!entries.length) {
    return `${header}\n${emptyMessage}`;
  }
  const lines = entries.slice(0, limit).map((entry) => {
    const day = entry.timestamp.slice(0, 10);
    return `- [${day} · ${entry.authority}] ${entry.what} — ${entry.why} (receipt ${entry.receipt_id})`;
  });
  return [header, `updated: ${new Date().toISOString()}`, ...lines].join('\n');
}
