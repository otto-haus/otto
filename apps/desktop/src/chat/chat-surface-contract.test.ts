import { describe, expect, test } from 'bun:test';
import {
  DURABLE_PROMOTION_SURFACES,
  formatChatHandoffSummary,
  nextActionFromTodos,
} from './chat-surface-contract';

describe('chat-surface-contract', () => {
  test('lists durable promotion surfaces without chat', () => {
    expect(DURABLE_PROMOTION_SURFACES).toContain('receipts');
    expect(DURABLE_PROMOTION_SURFACES).not.toContain('chat');
  });

  test('formatChatHandoffSummary joins state, questions, and next action', () => {
    expect(
      formatChatHandoffSummary({
        stateSummary: 'Drafting charter',
        openQuestions: ['Who owns review?'],
        nextAction: 'Send for ratification',
      }),
    ).toBe('Drafting charter — Open: Who owns review? — Next: Send for ratification');
  });

  test('nextActionFromTodos prefers in_progress', () => {
    expect(
      nextActionFromTodos([
        { id: '1', content: 'Waiting', status: 'pending' },
        { id: '2', content: 'Active step', status: 'in_progress' },
      ]),
    ).toBe('Active step');
  });
});
