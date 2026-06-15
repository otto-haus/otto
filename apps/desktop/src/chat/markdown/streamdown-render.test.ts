import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StreamMarkdown } from './MarkdownBlock';
import {
  appendChunks,
  buildHugeStreamChunks,
  GFM_TABLE_STREAM,
  OPEN_FENCE_CHUNKS,
  SECRET_REDACTION_SAMPLE,
} from './fixtures';

describe('Streamdown render path', () => {
  test('redacts secrets in rendered HTML output', () => {
    const html = renderToStaticMarkup(createElement(StreamMarkdown, { text: SECRET_REDACTION_SAMPLE }));
    expect(html).toContain('[redacted: secret]');
    expect(html).not.toContain('sk-live-');
    expect(html).not.toContain('Bearer eyJ');
  });

  test('renders GFM table fixture', () => {
    const html = renderToStaticMarkup(createElement(StreamMarkdown, { text: GFM_TABLE_STREAM }));
    expect(html).toContain('md__table');
    expect(html).toContain('Pass condition');
    expect(html).toContain('Done.');
  });

  test('keeps open code fence in streaming tail without crashing', () => {
    const partial = appendChunks(OPEN_FENCE_CHUNKS.slice(0, 4));
    const html = renderToStaticMarkup(createElement(StreamMarkdown, { text: partial, streaming: true }));
    expect(html).toContain('Intro paragraph.');
    expect(html).toMatch(/const x = 1/);
    expect(html).not.toContain('sk-live-');
  });

  test('renders huge streamed fixture without timeout', () => {
    const text = appendChunks(buildHugeStreamChunks(500, 16));
    const started = performance.now();
    const html = renderToStaticMarkup(createElement(StreamMarkdown, { text, streaming: false }));
    const elapsed = performance.now() - started;
    expect(html).toContain('class="md"');
    expect(elapsed).toBeLessThan(5_000);
  });
});
