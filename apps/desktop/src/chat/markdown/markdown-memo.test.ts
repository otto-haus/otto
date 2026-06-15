import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  __getMarkdownBlockRenderCount,
  __resetMarkdownBlockRenderCounts,
  markdownBlockPropsAreEqual,
  StreamMarkdown,
} from './MarkdownBlock';
import { accumulateMarkdownBlocks, blockRenderKey } from './block-accumulator';
import { redactForDisplay } from './redact-for-display';
import { appendChunks, buildHugeStreamChunks } from './fixtures';

describe('MarkdownBlock memoization', () => {
  test('sealed block keys stay stable across chunk appends (anti-OOM regression)', () => {
    let state = accumulateMarkdownBlocks(undefined, '', false);
    let text = '';
    const titleKeys: string[] = [];
    const paragraphKeys: string[] = [];
    const chunks = ['# Title', '\n\n', 'Stable paragraph.', '\n\n', 'Growing tail'];

    for (const chunk of chunks) {
      text += chunk;
      state = accumulateMarkdownBlocks(state, text, false);
      if (state.sealed[0]) {
        const redacted = redactForDisplay(state.sealed[0].markdown);
        titleKeys.push(blockRenderKey(redacted, state.sealed[0].kind, state.sealed[0].ordinal));
      }
      if (state.sealed[1]) {
        const redacted = redactForDisplay(state.sealed[1].markdown);
        paragraphKeys.push(blockRenderKey(redacted, state.sealed[1].kind, state.sealed[1].ordinal));
      }
    }

    expect(titleKeys.length).toBeGreaterThan(0);
    expect(paragraphKeys.length).toBeGreaterThan(0);
    expect(titleKeys.every((key) => key === titleKeys[0])).toBe(true);
    expect(paragraphKeys.every((key) => key === paragraphKeys[0])).toBe(true);
  });

  test('memo comparator treats unchanged sealed blocks as equal', () => {
    const redacted = redactForDisplay('Hello');
    const blockKey = blockRenderKey(redacted, 'prose', 0);
    const props = { blockKey, redactedMarkdown: redacted };
    expect(markdownBlockPropsAreEqual(props, props)).toBe(true);
    expect(markdownBlockPropsAreEqual(props, { ...props })).toBe(true);
    expect(
      markdownBlockPropsAreEqual(props, {
        blockKey: blockRenderKey(redactForDisplay('Changed'), 'prose', 0),
        redactedMarkdown: redactForDisplay('Changed'),
      }),
    ).toBe(false);
  });

  test('StreamMarkdown issues one render per sealed block in a single pass', () => {
    __resetMarkdownBlockRenderCounts();
    const text = '# Title\n\nStable paragraph.\n\nTail chunk';
    renderToStaticMarkup(createElement(StreamMarkdown, { text, streaming: true }));

    const titleKey = blockRenderKey(redactForDisplay('# Title'), 'prose', 0);
    const paragraphKey = blockRenderKey(redactForDisplay('Stable paragraph.'), 'prose', 1);
    expect(__getMarkdownBlockRenderCount(titleKey)).toBe(1);
    expect(__getMarkdownBlockRenderCount(paragraphKey)).toBe(1);
  });

  test('renders huge streamed fixture through memoized blocks', () => {
    __resetMarkdownBlockRenderCounts();
    const text = appendChunks(buildHugeStreamChunks(500, 16));
    const started = performance.now();
    const html = renderToStaticMarkup(createElement(StreamMarkdown, { text, streaming: false }));
    const elapsed = performance.now() - started;

    expect(html).toContain('class="md"');
    expect(elapsed).toBeLessThan(5_000);
  });
});
