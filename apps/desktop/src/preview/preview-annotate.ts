import { previewCopy } from '../copy/surfaces';
import { hardenLinks, injectIntoDocument } from './preview-sandbox';

/** Annotate mode only — scripts required for single-element pick; no navigation or popups. */
export const PREVIEW_ANNOTATE_IFRAME_SANDBOX = 'allow-scripts' as const;

export const PREVIEW_ANNOTATE_MESSAGE_TYPE = 'otto-preview-element-pick' as const;

/** CSP for annotate wrapper — inline picker script only; still blocks network. */
export const PREVIEW_ANNOTATE_HTML_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; base-uri 'none'; form-action 'none'; navigate-to 'none';";

const ANNOTATE_PICKER_SCRIPT = `(function(){
  var selected=null;
  var style=document.createElement('style');
  style.textContent='.otto-pick-highlight{outline:2px solid #6b9fff!important;outline-offset:2px;background:rgba(107,159,255,.12)!important;cursor:pointer;} body{cursor:crosshair;}';
  (document.head||document.documentElement).appendChild(style);
  document.addEventListener('click',function(e){
    e.preventDefault(); e.stopPropagation();
    var el=e.target;
    if(!(el instanceof Element)) return;
    if(selected) selected.classList.remove('otto-pick-highlight');
    selected=el;
    el.classList.add('otto-pick-highlight');
    var rect=el.getBoundingClientRect();
    parent.postMessage({
      type:'${PREVIEW_ANNOTATE_MESSAGE_TYPE}',
      pick:{
        tag:el.tagName.toLowerCase(),
        id:el.id||null,
        classes:Array.from(el.classList).filter(function(c){return c!=='otto-pick-highlight';}),
        textSnippet:(el.textContent||'').trim().slice(0,200),
        bounds:{x:Math.round(rect.x),y:Math.round(rect.y),w:Math.round(rect.width),h:Math.round(rect.height)}
      }
    },'*');
  },true);
})();`;

const ANNOTATE_FOOTER = `<footer class="otto-preview-annotate-footer" aria-hidden="true">${previewCopy.annotateFooter}</footer>`;

const ANNOTATE_STYLES = `<style>
  html, body { margin: 0; padding: 0; }
  body { font: 13px/1.45 system-ui, sans-serif; color: #e8e8e8; background: #1a1a1a; }
  .otto-preview-annotate-footer {
    position: sticky; bottom: 0; margin-top: 1rem; padding: 6px 10px;
    border-top: 1px solid #4a6a9f; font: 11px/1.3 system-ui, sans-serif;
    color: #8ab4ff; background: #141820; text-align: center;
  }
</style>`;

/** Wrap HTML for annotate-mode iframe — injects picker script; operator-initiated only. */
export function wrapHtmlForAnnotatePreview(html: string): string {
  const hardened = hardenLinks(html.trim());
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_ANNOTATE_HTML_CSP}">`;
  const injection = `${cspMeta}\n${ANNOTATE_STYLES}`;
  const withShell = injectIntoDocument(hardened, injection);
  const scriptTag = `<script>${ANNOTATE_PICKER_SCRIPT}</script>`;
  if (/<\/body>/i.test(withShell)) {
    return withShell.replace(/<\/body>/i, `${scriptTag}\n${ANNOTATE_FOOTER}\n</body>`);
  }
  return `${withShell}${scriptTag}${ANNOTATE_FOOTER}`;
}

export function isPreviewAnnotateMessage(data: unknown): data is { type: string; pick: import('./preview-element-context').PreviewElementPick } {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  if (record.type !== PREVIEW_ANNOTATE_MESSAGE_TYPE) return false;
  const pick = record.pick;
  if (!pick || typeof pick !== 'object') return false;
  const p = pick as Record<string, unknown>;
  return typeof p.tag === 'string' && typeof p.textSnippet === 'string' && !!p.bounds;
}
