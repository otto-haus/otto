import { describe, expect, it } from 'bun:test';
import {
  findStableMarkdownBoundary,
  generateStreamingText,
  shouldPlainRenderTail,
  streamingParseWork,
  STREAMING_PLAIN_TOTAL_MAX,
  STREAMING_TAIL_MARKDOWN_MAX,
} from './markdown-streaming';

describe('markdown streaming OOM guard', () => {
  it('findStableMarkdownBoundary splits at paragraph breaks and open fences', () => {
    expect(findStableMarkdownBoundary('one line')).toBe(0);
    expect(findStableMarkdownBoundary('done\n\nlive')).toBe(6);
    expect(findStableMarkdownBoundary('```js\ncode')).toBe(0);
    expect(findStableMarkdownBoundary('```js\ncode\n```\n\nafter')).toBe(16);
    expect(findStableMarkdownBoundary('before\n```\nopen')).toBe(7);
  });

  it('ignores blank lines inside closed fenced code blocks', () => {
    const fenced = '```js\nline1\n\nline2\n```\n\nafter';
    const outsideBreak = fenced.indexOf('\n\nafter');
    expect(findStableMarkdownBoundary(fenced)).toBe(outsideBreak + 2);
    expect(findStableMarkdownBoundary('```js\nline1\n\nline2\n```')).toBe(0);
  });

  it('PRIMARY: block-level incremental keeps multi-paragraph streaming bounded', () => {
    const finalLength = 80_000;
    const tokenCount = 400;

    const naiveWork = streamingParseWork(finalLength, tokenCount, 'naive');
    const incrementalWork = streamingParseWork(finalLength, tokenCount, 'incremental');

    // Naive re-parses the full growing string each token → ~n²/2 char visits.
    expect(naiveWork).toBeGreaterThan(finalLength * (tokenCount / 2));
    // Incremental: each finalized char parsed once (≈n) + bounded tail re-parses.
    // Stays within a small constant factor of the message length, never O(n²).
    expect(incrementalWork).toBeLessThan(finalLength * 4);
    expect(incrementalWork).toBeLessThan(naiveWork / 20);

    // eslint-disable-next-line no-console
    console.log(
      `[bench multi-block] final=${finalLength} tokens=${tokenCount} ` +
        `naive=${naiveWork} incremental=${incrementalWork} ` +
        `ratio=${(naiveWork / incrementalWork).toFixed(1)}x`,
    );
  });

  it('BACKSTOP: single pathological unbroken block is size-gated to plain text', () => {
    // One giant block with NO paragraph breaks — block-level parsing alone cannot
    // help (the live block never closes), so the size guard is the hard ceiling.
    const finalLength = 200_000;
    const tokenCount = 600;
    const hugeParagraph = finalLength + 10; // no '\n\n' ever produced

    const naiveWork = streamingParseWork(finalLength, tokenCount, 'naive', hugeParagraph);
    const incrementalWork = streamingParseWork(finalLength, tokenCount, 'incremental', hugeParagraph);

    expect(naiveWork).toBeGreaterThan(finalLength * (tokenCount / 2));
    // After the plain-text threshold, per-token markdown work is ~0; total stays tiny.
    expect(incrementalWork).toBeLessThan(STREAMING_PLAIN_TOTAL_MAX * 2);
    expect(incrementalWork).toBeLessThan(naiveWork / 1000);

    // eslint-disable-next-line no-console
    console.log(
      `[bench single-block] final=${finalLength} tokens=${tokenCount} ` +
        `naive=${naiveWork} incremental=${incrementalWork} ` +
        `ratio=${(naiveWork / incrementalWork).toFixed(1)}x`,
    );
  });

  it('shouldPlainRenderTail gates oversized tails and huge unbroken blocks', () => {
    expect(shouldPlainRenderTail(100, 1000, 200)).toBe(false);
    expect(shouldPlainRenderTail(100, 99_999, STREAMING_TAIL_MARKDOWN_MAX + 1)).toBe(true);
    expect(shouldPlainRenderTail(0, STREAMING_PLAIN_TOTAL_MAX + 1, STREAMING_PLAIN_TOTAL_MAX + 1)).toBe(true);
    expect(shouldPlainRenderTail(0, 100, 100)).toBe(false);
  });

  it('generateStreamingText produces text of the requested length', () => {
    expect(generateStreamingText(5000).length).toBe(5000);
    expect(generateStreamingText(5000, 999_999).includes('\n\n')).toBe(false);
  });

  it('exports sane thresholds', () => {
    expect(STREAMING_TAIL_MARKDOWN_MAX).toBeGreaterThan(512);
    expect(STREAMING_PLAIN_TOTAL_MAX).toBeGreaterThan(STREAMING_TAIL_MARKDOWN_MAX);
  });
});
