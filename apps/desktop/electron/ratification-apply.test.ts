import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MemoryUpdateResult } from './shared/types';
import { BehaviorChangelog } from './behavior-changelog';
import { ConstitutionStore } from './constitution-store';
import { ProposalStore } from './proposal-store';
import { ReceiptStore } from './receipt-store';
import { ReceiptWriter } from './receipt-writer';
import { BEHAVIOR_CHANGELOG_BLOCK_LABEL, RatificationApplier } from './ratification-apply';

interface RecordedCall {
  label: string;
  value: string;
}

class FakeMemoryWriter {
  calls: RecordedCall[] = [];
  constructor(private mode: 'ok' | 'error' = 'ok') {}

  async updateBlock(label: string, value: string): Promise<MemoryUpdateResult> {
    this.calls.push({ label, value });
    const apiPath = `/v1/agents/agent-test/core-memory/blocks/${encodeURIComponent(label)}`;
    if (this.mode === 'error') {
      return { agentId: 'agent-test', baseUrl: 'http://local', block: null, apiPath, error: 'Letta memory update 422' };
    }
    return {
      agentId: 'agent-test',
      baseUrl: 'http://local',
      block: { id: label, label, value, limit: null, updated_at: null, description: null },
      apiPath,
    };
  }
}

function makeHarness(tmp: string) {
  const proposalsDir = join(tmp, 'curation', 'proposals');
  const receiptsDir = join(tmp, 'receipts');
  const proposals = new ProposalStore(proposalsDir, new ReceiptWriter(receiptsDir), new ReceiptStore(receiptsDir));
  const constitution = new ConstitutionStore(
    join(tmp, 'constitution.yaml'),
    join(tmp, 'constitution.md'),
    new ReceiptWriter(receiptsDir),
  );
  const changelog = new BehaviorChangelog(proposals, new ReceiptStore(receiptsDir), constitution);
  return { proposals, changelog, receiptsDir };
}

describe('RatificationApplier (#639 + #637)', () => {
  test('ratified memory writeback PATCHes the targeted Letta block (#639)', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ratify-'));
    try {
      const { proposals, changelog, receiptsDir } = makeHarness(tmp);
      const created = proposals.createFromCorrection({
        correction: 'Remember that Sebastian is the sole merge gate for otto.',
        rationale: 'Sebastian is the sole merge/release gate; never self-certify done for consequential changes.',
        target: { kind: 'memory', id: 'human', action: 'update' },
      });
      const decided = proposals.decide(created.proposal.id, { decision: 'accept', note: 'Ratified.' });
      expect(decided.proposal.status).toBe('applied');

      const memory = new FakeMemoryWriter('ok');
      const applier = new RatificationApplier(memory, changelog, new ReceiptWriter(receiptsDir));
      const result = await applier.applyAfterRatification(decided.proposal);

      expect(result.memoryWrite?.applied).toBe(true);
      expect(result.memoryWrite?.label).toBe('human');
      expect(result.memoryWrite?.receipt.action).toBe('curation.memory.writeback.apply');
      expect(result.memoryWrite?.receipt.status).toBe('success');

      const writebackCall = memory.calls.find((c) => c.label === 'human');
      expect(writebackCall?.value).toContain('sole merge/release gate');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('ratification injects the behavior changelog into the agent context block (#637)', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ratify-'));
    try {
      const { proposals, changelog, receiptsDir } = makeHarness(tmp);
      const canonPath = join(tmp, 'practice.yaml');
      writeFileSync(canonPath, 'slug: charter\nname: Charter\nguardrails: []\n');
      const created = proposals.createFromCorrection({
        correction: 'Charter practice must require receipt linkage on every status change.',
        rationale: 'No status flip without a linked receipt.',
        target: { kind: 'practice', id: 'charter', path: canonPath, action: 'update' },
      });
      const decided = proposals.decide(created.proposal.id, { decision: 'accept', note: 'Ratified.' });
      expect(decided.proposal.status).toBe('applied');

      const memory = new FakeMemoryWriter('ok');
      const applier = new RatificationApplier(memory, changelog, new ReceiptWriter(receiptsDir));
      const result = await applier.applyAfterRatification(decided.proposal);

      expect(result.changelogInjection?.applied).toBe(true);
      expect(result.changelogInjection?.label).toBe(BEHAVIOR_CHANGELOG_BLOCK_LABEL);
      expect(result.changelogInjection?.receipt.action).toBe('curation.changelog.inject');

      const injectCall = memory.calls.find((c) => c.label === BEHAVIOR_CHANGELOG_BLOCK_LABEL);
      expect(injectCall).toBeTruthy();
      // The agent's next-turn context block now contains the ratified change.
      expect(injectCall?.value).toContain('Charter practice must require receipt linkage');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('NEGATIVE: a rejected proposal never writes to Letta', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ratify-'));
    try {
      const { proposals, changelog, receiptsDir } = makeHarness(tmp);
      const created = proposals.createFromCorrection({
        correction: 'Remember a fact that should be rejected.',
        rationale: 'Rejected memory writeback.',
        target: { kind: 'memory', id: 'human', action: 'update' },
      });
      const decided = proposals.decide(created.proposal.id, { decision: 'reject', note: 'No.' });
      expect(decided.proposal.status).toBe('rejected');

      const memory = new FakeMemoryWriter('ok');
      const applier = new RatificationApplier(memory, changelog, new ReceiptWriter(receiptsDir));
      const result = await applier.applyAfterRatification(decided.proposal);

      expect(result).toEqual({});
      expect(memory.calls).toHaveLength(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('memory writeback records an honest blocked receipt when Letta is unreachable', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ratify-'));
    try {
      const { proposals, changelog, receiptsDir } = makeHarness(tmp);
      const created = proposals.createFromCorrection({
        correction: 'Remember the disbursement double-check rule.',
        rationale: 'Always re-verify payoff wire instructions out-of-band.',
        target: { kind: 'memory', id: 'human', action: 'update' },
      });
      const decided = proposals.decide(created.proposal.id, { decision: 'accept', note: 'Ratified.' });

      const memory = new FakeMemoryWriter('error');
      const applier = new RatificationApplier(memory, changelog, new ReceiptWriter(receiptsDir));
      const result = await applier.applyAfterRatification(decided.proposal);

      expect(result.memoryWrite?.attempted).toBe(true);
      expect(result.memoryWrite?.applied).toBe(false);
      expect(result.memoryWrite?.receipt.status).toBe('blocked');
      expect(result.memoryWrite?.receipt.blocker?.recoverable).toBe(true);
      expect(result.memoryWrite?.receipt.blocker?.code).toBe('memory_writeback_letta_unreachable');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('memory writeback without a target block label is blocked, not silently dropped', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-ratify-'));
    try {
      const { proposals, changelog, receiptsDir } = makeHarness(tmp);
      const created = proposals.createFromCorrection({
        correction: 'Remember a fact with no block label.',
        rationale: 'No target block id provided.',
        target: { kind: 'memory', action: 'update' },
      });
      const decided = proposals.decide(created.proposal.id, { decision: 'accept', note: 'Ratified.' });

      const memory = new FakeMemoryWriter('ok');
      const applier = new RatificationApplier(memory, changelog, new ReceiptWriter(receiptsDir));
      const result = await applier.applyAfterRatification(decided.proposal);

      expect(result.memoryWrite?.attempted).toBe(false);
      expect(result.memoryWrite?.applied).toBe(false);
      expect(result.memoryWrite?.receipt.blocker?.code).toBe('memory_writeback_missing_label');
      // No writeback PATCH attempted for the missing-label block.
      expect(memory.calls.some((c) => c.label === 'human')).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
