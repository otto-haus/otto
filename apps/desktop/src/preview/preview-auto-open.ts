import type { PreviewContent } from './preview-content';
import { previewFromText } from './preview-content';

export type PreviewAutoOpenMode = 'off' | 'on-new-artifact' | 'always-on-pane';

export const PREVIEW_AUTO_OPEN_KEY = 'otto.preview.autoOpen.v1';

const HTML_FENCE = /```(?:html|htm)\s*\n([\s\S]*?)```/i;
const MARKDOWN_FENCE = /```(?:markdown|md)\s*\n([\s\S]*?)```/i;

function isHtmlDocument(text: string): boolean {
  const trimmed = text.trim();
  return /^<!DOCTYPE html\b/i.test(trimmed) || /^<html[\s>]/i.test(trimmed);
}

function isImageOnlyMessage(text: string): boolean {
  const trimmed = text.trim();
  const imageMatch = trimmed.match(/^!\[[^\]]*]\(([^)]+)\)$/);
  if (!imageMatch) return false;
  const src = imageMatch[1].trim();
  return src.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(src);
}

/** Standalone markdown doc: fenced markdown block or document starting with an H1. */
function isStandaloneMarkdownDoc(text: string): boolean {
  const trimmed = text.trim();
  if (MARKDOWN_FENCE.test(trimmed)) return true;
  const firstLine = trimmed.split('\n').find((line) => line.trim())?.trim() ?? '';
  return /^#\s+\S/.test(firstLine) && !/^##/.test(firstLine);
}

/** Shared artifact detector for auto-open (#652) — stricter than previewFromText markdown fallback. */
export function isAutoOpenArtifact(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (HTML_FENCE.test(trimmed)) return true;
  if (isHtmlDocument(trimmed)) return true;
  if (isImageOnlyMessage(trimmed)) return true;
  if (isStandaloneMarkdownDoc(trimmed)) return true;
  return false;
}

export function readPreviewAutoOpenMode(): PreviewAutoOpenMode {
  try {
    const raw = localStorage.getItem(PREVIEW_AUTO_OPEN_KEY);
    if (raw === 'on-new-artifact' || raw === 'always-on-pane') return raw;
  } catch { /* best effort */ }
  return 'off';
}

export function writePreviewAutoOpenMode(mode: PreviewAutoOpenMode): void {
  try {
    if (mode === 'off') localStorage.removeItem(PREVIEW_AUTO_OPEN_KEY);
    else localStorage.setItem(PREVIEW_AUTO_OPEN_KEY, mode);
    window.dispatchEvent(new CustomEvent('otto-preview-auto-open-changed', { detail: { mode } }));
  } catch { /* best effort */ }
}

export type PreviewAutoOpenDecision =
  | { action: 'skip'; reason: 'mode-off' | 'not-artifact' | 'pane-open' }
  | { action: 'open'; content: PreviewContent }
  | { action: 'toast-disconnected' };

export function resolvePreviewAutoOpen(input: {
  mode: PreviewAutoOpenMode;
  text: string;
  paneOpen: boolean;
  runtimeConnected: boolean;
  title: string;
  sourceId?: string;
}): PreviewAutoOpenDecision {
  if (input.mode === 'off') return { action: 'skip', reason: 'mode-off' };
  if (!isAutoOpenArtifact(input.text)) return { action: 'skip', reason: 'not-artifact' };
  if (!input.runtimeConnected) return { action: 'toast-disconnected' };
  if (input.mode === 'on-new-artifact' && input.paneOpen) {
    return { action: 'skip', reason: 'pane-open' };
  }

  const content = previewFromText(input.text, { title: input.title, sourceId: input.sourceId });
  if (!content) return { action: 'skip', reason: 'not-artifact' };
  return { action: 'open', content };
}
