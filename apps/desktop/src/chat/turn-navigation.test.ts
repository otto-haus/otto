import { describe, expect, test } from 'bun:test';
import { jumpTurnAnchor, turnAnchorIndices } from './turn-navigation';

describe('turnAnchorIndices', () => {
  test('marks the first message of each speaker block', () => {
    const messages = [
      { who: 'user' as const },
      { who: 'otto' as const },
      { who: 'otto' as const },
      { who: 'user' as const },
      { who: 'otto' as const },
    ];
    expect(turnAnchorIndices(messages)).toEqual([0, 1, 3, 4]);
  });
});

describe('jumpTurnAnchor', () => {
  const anchors = [0, 2, 5, 8];

  test('steps to previous and next anchors', () => {
    expect(jumpTurnAnchor(anchors, 2, 'prev')).toBe(0);
    expect(jumpTurnAnchor(anchors, 2, 'next')).toBe(5);
  });

  test('returns null at the ends', () => {
    expect(jumpTurnAnchor(anchors, 0, 'prev')).toBeNull();
    expect(jumpTurnAnchor(anchors, 8, 'next')).toBeNull();
  });

  test('resolves from a mid-block index to the nearest anchor', () => {
    expect(jumpTurnAnchor(anchors, 3, 'prev')).toBe(2);
    expect(jumpTurnAnchor(anchors, 3, 'next')).toBe(5);
  });
});
