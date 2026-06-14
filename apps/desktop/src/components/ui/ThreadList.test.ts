import { describe, expect, test } from 'bun:test';
import { displayThreadTitle } from './ThreadList';

describe('displayThreadTitle', () => {
  test('uses a friendly fallback for empty and default chat titles', () => {
    expect(displayThreadTitle('')).toBe('New chat');
    expect(displayThreadTitle('   New Chat   ')).toBe('New chat');
  });

  test('hides raw local thread keys generated with dash or underscore separators', () => {
    expect(displayThreadTitle('local-1712345678901')).toBe('New chat');
    expect(displayThreadTitle('local_1712345678901')).toBe('New chat');
  });

  test('hides staging smoke thread identifiers', () => {
    expect(displayThreadTitle('046-thread-smoke')).toBe('Chat session');
  });
});
