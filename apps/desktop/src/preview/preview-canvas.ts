import { previewCopy } from '../copy/surfaces';
import { PREVIEW_CANVAS_MESSAGE_TYPE } from './preview-canvas-actions';
import { hardenLinks, injectIntoDocument } from './preview-sandbox';

/** Labs canvas only — scripts for otto-defined action bridge; no navigation or popups. */
export const PREVIEW_CANVAS_IFRAME_SANDBOX = 'allow-scripts' as const;

export const PREVIEW_CANVAS_HTML_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; base-uri 'none'; form-action 'none'; navigate-to 'none';";

const CANVAS_BRIDGE_SCRIPT = `(function(){
  var ALLOWED=${JSON.stringify(['navigate_surface', 'copy_diagnostic', 'open_receipt'])};
  var DENIED=${JSON.stringify(['shell', 'exec', 'eval', 'fetch', 'write_file', 'delete_file', 'send_message'])};
  document.addEventListener('click',function(e){
    var el=e.target;
    if(!(el instanceof Element)) return;
    var btn=el.closest('[data-otto-action]');
    if(!btn) return;
    e.preventDefault(); e.stopPropagation();
    var action=(btn.getAttribute('data-otto-action')||'').trim();
    if(!action||DENIED.indexOf(action)>=0) return;
    if(ALLOWED.indexOf(action)<0) return;
    var target=btn.getAttribute('data-otto-target');
    parent.postMessage({type:'${PREVIEW_CANVAS_MESSAGE_TYPE}',action:action,target:target},'*');
  },true);
})();`;

const CANVAS_FOOTER = `<footer class="otto-preview-canvas-footer" aria-hidden="true">${previewCopy.canvasFooter}</footer>`;

const CANVAS_STYLES = `<style>
  html, body { margin: 0; padding: 0; }
  body { font: 13px/1.45 system-ui, sans-serif; color: #e8e8e8; background: #1a1a1a; }
  .otto-preview-canvas-footer {
    position: sticky; bottom: 0; margin-top: 1rem; padding: 6px 10px;
    border-top: 1px solid #4a6a4f; font: 11px/1.3 system-ui, sans-serif;
    color: #8abf8a; background: #141814; text-align: center;
  }
  [data-otto-action] { cursor: pointer; }
</style>`;

/** Wrap HTML for Labs interactive canvas — injects action bridge; Labs-gated in PreviewPane. */
export function wrapHtmlForCanvasPreview(html: string): string {
  const hardened = hardenLinks(html.trim());
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CANVAS_HTML_CSP}">`;
  const injection = `${cspMeta}\n${CANVAS_STYLES}`;
  const withShell = injectIntoDocument(hardened, injection);
  const scriptTag = `<script>${CANVAS_BRIDGE_SCRIPT}</script>`;
  if (/<\/body>/i.test(withShell)) {
    return withShell.replace(/<\/body>/i, `${scriptTag}\n${CANVAS_FOOTER}\n</body>`);
  }
  return `${withShell}${scriptTag}${CANVAS_FOOTER}`;
}
