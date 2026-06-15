import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatAiFrontierReviewSmokeFailure,
  runAiFrontierReviewSmoke,
} from './ai-frontier-review-smoke';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');

describe('ai-frontier-review integration smoke', () => {
  test('runAiFrontierReviewSmoke passes against bundled knowledge + routine canon', () => {
    const result = runAiFrontierReviewSmoke({ repoRoot });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(formatAiFrontierReviewSmokeFailure(result));
    }
    expect(result.executorReceiptAction).toBe('knowledge.frontier_review.manual');
    expect(result.routineKnowledgeReceiptId).toBeTruthy();
    expect(result.routingProposalId).toBeTruthy();
    expect(result.touchedCount).toBeGreaterThan(0);
  });

  test('formatAiFrontierReviewSmokeFailure names check and next action', () => {
    const text = formatAiFrontierReviewSmokeFailure({
      ok: false,
      check: 'routine_link',
      detail: 'missing link',
      nextAction: 'Wire knowledge receipt.',
    });
    expect(text).toMatch(/FAIL \[routine_link\]/);
    expect(text).toMatch(/Wire knowledge receipt/);
  });
});
