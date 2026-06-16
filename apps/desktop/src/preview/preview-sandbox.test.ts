import { describe, expect, test } from 'bun:test';
import {
  MALICIOUS_PREVIEW_FIXTURES,
  PREVIEW_HTML_CSP,
  PREVIEW_IFRAME_SANDBOX,
  wrapHtmlForSandboxPreview,
} from './preview-sandbox';
import { previewCopy } from '../copy/surfaces';

describe('PREVIEW_IFRAME_SANDBOX', () => {
  test('denies scripts, same-origin, navigation, and popups', () => {
    expect(PREVIEW_IFRAME_SANDBOX).toBe('');
    expect(PREVIEW_IFRAME_SANDBOX).not.toContain('allow-scripts');
    expect(PREVIEW_IFRAME_SANDBOX).not.toContain('allow-same-origin');
    expect(PREVIEW_IFRAME_SANDBOX).not.toContain('allow-popups');
    expect(PREVIEW_IFRAME_SANDBOX).not.toContain('allow-top-navigation');
  });
});

describe('wrapHtmlForSandboxPreview', () => {
  test('injects CSP meta blocking scripts and network', () => {
    const wrapped = wrapHtmlForSandboxPreview('<p>Hello</p>');
    expect(wrapped).toContain('Content-Security-Policy');
    expect(wrapped).toContain(PREVIEW_HTML_CSP);
    expect(PREVIEW_HTML_CSP).toContain("default-src 'none'");
    expect(PREVIEW_HTML_CSP).toContain("navigate-to 'none'");
  });

  test('adds sandbox diagnostics footer', () => {
    const wrapped = wrapHtmlForSandboxPreview('<p>Hello</p>');
    expect(wrapped).toContain(previewCopy.sandboxFooter);
    expect(wrapped).toContain('otto-preview-sandbox-footer');
  });

  test('adds noopener noreferrer on links', () => {
    const wrapped = wrapHtmlForSandboxPreview('<a href="https://example.com">Go</a>');
    expect(wrapped).toContain('rel="noopener noreferrer"');
    expect(wrapped).toContain('target="_blank"');
  });

  test('wraps fragment HTML in document shell', () => {
    const wrapped = wrapHtmlForSandboxPreview('<div>frag</div>');
    expect(wrapped).toContain('<!DOCTYPE html>');
    expect(wrapped).toContain('<div>frag</div>');
  });

  test('hardens malicious script fixture with CSP (scripts blocked at runtime)', () => {
    const wrapped = wrapHtmlForSandboxPreview(MALICIOUS_PREVIEW_FIXTURES.scriptTag);
    expect(wrapped).toContain('<script>');
    expect(wrapped).toContain(PREVIEW_HTML_CSP);
  });

  test('hardens onerror handler fixture', () => {
    const wrapped = wrapHtmlForSandboxPreview(MALICIOUS_PREVIEW_FIXTURES.onerrorHandler);
    expect(wrapped).toContain('onerror=');
    expect(wrapped).toContain(PREVIEW_HTML_CSP);
  });

  test('hardens window.open link fixture with noopener', () => {
    const wrapped = wrapHtmlForSandboxPreview(MALICIOUS_PREVIEW_FIXTURES.windowOpen);
    expect(wrapped).toContain('rel="noopener noreferrer"');
    expect(wrapped).toContain(PREVIEW_HTML_CSP);
  });

  test('hardens external fetch fixture', () => {
    const wrapped = wrapHtmlForSandboxPreview(MALICIOUS_PREVIEW_FIXTURES.externalFetch);
    expect(wrapped).toContain('fetch(');
    expect(PREVIEW_HTML_CSP).not.toContain('connect-src');
  });
});
