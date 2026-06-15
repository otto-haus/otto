import { describe, expect, test } from 'bun:test';
import {
  CHAT_EPHEMERAL_KINDS,
  CHAT_NON_CANONICAL_DISCLAIMER,
  formatHandoffFooter,
  PROMOTION_TARGETS,
} from './chat-surface-contract';

describe('chat-surface-contract', () => {
  test('lists all six promotion targets with honest wired flags', () => {
    expect(PROMOTION_TARGETS.map((t) => t.id)).toEqual([
      'issues',
      'charters',
      'standards',
      'practices',
      'routines',
      'receipts',
    ]);
    expect(PROMOTION_TARGETS.filter((t) => t.wired).map((t) => t.id)).toEqual([
      'standards',
      'practices',
      'routines',
      'receipts',
    ]);
    expect(CHAT_EPHEMERAL_KINDS).toContain('transcript');
  });

  test('handoff footer includes disclaimer and section order', () => {
    const footer = formatHandoffFooter();
    expect(footer).toContain(CHAT_NON_CANONICAL_DISCLAIMER);
    const state = footer.indexOf('## State');
    const questions = footer.indexOf('## Open questions');
    const next = footer.indexOf('## Next action');
    expect(state).toBeLessThan(questions);
    expect(questions).toBeLessThan(next);
  });
});
