import { describe, expect, test } from 'bun:test';
import { previewFromCodeBlock, previewFromText } from './preview-content';

describe('previewFromText', () => {
  test('returns null for empty text', () => {
    expect(previewFromText('   ')).toBeNull();
  });

  test('detects fenced HTML artifacts', () => {
    const result = previewFromText('Intro\n```html\n<h1>Hi</h1>\n```\nTail');
    expect(result?.kind).toBe('html');
    expect(result?.body).toContain('<h1>Hi</h1>');
  });

  test('detects bare HTML documents', () => {
    const result = previewFromText('<!DOCTYPE html><html><body>ok</body></html>');
    expect(result?.kind).toBe('html');
  });

  test('falls back to markdown for ordinary replies', () => {
    const result = previewFromText('## Plan\n\n- one\n- two');
    expect(result?.kind).toBe('markdown');
    expect(result?.body).toContain('## Plan');
  });

  test('detects standalone markdown images', () => {
    const result = previewFromText('![diagram](https://example.com/chart.png)');
    expect(result?.kind).toBe('image');
    expect(result?.body).toContain('chart.png');
  });
});

describe('previewFromCodeBlock', () => {
  test('maps html lang to html preview', () => {
    const result = previewFromCodeBlock('<p>Hello</p>', 'html');
    expect(result?.kind).toBe('html');
  });

  test('wraps unknown langs as fenced markdown', () => {
    const result = previewFromCodeBlock('const x = 1;', 'typescript');
    expect(result?.kind).toBe('markdown');
    expect(result?.body).toContain('```typescript');
  });
});
