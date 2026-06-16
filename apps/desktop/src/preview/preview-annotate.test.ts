import { describe, expect, test } from 'bun:test';
import {
  isPreviewAnnotateMessage,
  PREVIEW_ANNOTATE_HTML_CSP,
  PREVIEW_ANNOTATE_IFRAME_SANDBOX,
  PREVIEW_ANNOTATE_MESSAGE_TYPE,
  wrapHtmlForAnnotatePreview,
} from './preview-annotate';
import { previewCopy } from '../copy/surfaces';

describe('PREVIEW_ANNOTATE_IFRAME_SANDBOX', () => {
  test('allows scripts only for picker — no navigation or popups', () => {
    expect(PREVIEW_ANNOTATE_IFRAME_SANDBOX).toBe('allow-scripts');
    expect(PREVIEW_ANNOTATE_IFRAME_SANDBOX).not.toContain('allow-same-origin');
    expect(PREVIEW_ANNOTATE_IFRAME_SANDBOX).not.toContain('allow-popups');
  });
});

describe('wrapHtmlForAnnotatePreview', () => {
  test('injects annotate CSP with inline script-src', () => {
    const wrapped = wrapHtmlForAnnotatePreview('<p>Hello</p>');
    expect(wrapped).toContain(PREVIEW_ANNOTATE_HTML_CSP);
    expect(PREVIEW_ANNOTATE_HTML_CSP).toContain("script-src 'unsafe-inline'");
    expect(PREVIEW_ANNOTATE_HTML_CSP).toContain("navigate-to 'none'");
  });

  test('injects picker script and annotate footer', () => {
    const wrapped = wrapHtmlForAnnotatePreview('<button id="x">Go</button>');
    expect(wrapped).toContain(`type:'${PREVIEW_ANNOTATE_MESSAGE_TYPE}'`);
    expect(wrapped).toContain(previewCopy.annotateFooter);
  });
});

describe('isPreviewAnnotateMessage', () => {
  test('accepts valid pick payload', () => {
    expect(isPreviewAnnotateMessage({
      type: PREVIEW_ANNOTATE_MESSAGE_TYPE,
      pick: {
        tag: 'p',
        id: null,
        classes: [],
        textSnippet: 'Hi',
        bounds: { x: 0, y: 0, w: 10, h: 10 },
      },
    })).toBe(true);
  });

  test('rejects unknown types', () => {
    expect(isPreviewAnnotateMessage({ type: 'other', pick: {} })).toBe(false);
  });
});
