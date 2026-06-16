import { describe, expect, test } from 'bun:test';
import { autonomyCopy, FORBIDDEN_PRODUCT_WORDS, labsCopy } from '../copy/surfaces';
import { LAB_FEATURE_META } from '../surface-tiers';

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

function assertNoForbiddenWords(label: string, strings: string[]): void {
  for (const text of strings) {
    const lower = text.toLowerCase();
    for (const word of FORBIDDEN_PRODUCT_WORDS) {
      expect(lower.includes(word)).toBe(false);
    }
  }
}

describe('forbidden product copy (#714)', () => {
  test('Labs copy avoids forbidden words', () => {
    assertNoForbiddenWords('labsCopy', collectStrings(labsCopy));
  });

  test('Autonomy copy avoids forbidden words', () => {
    assertNoForbiddenWords('autonomyCopy', collectStrings(autonomyCopy));
  });

  test('LAB_FEATURE_META blurbs avoid forbidden words', () => {
    assertNoForbiddenWords('LAB_FEATURE_META', collectStrings(LAB_FEATURE_META));
  });
});
