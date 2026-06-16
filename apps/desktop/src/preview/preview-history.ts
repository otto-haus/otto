import type { PreviewContent, PreviewKind } from './preview-content';

export const PREVIEW_HISTORY_MAX_DEPTH = 20;

export type PreviewHistoryEntry = {
  key: string;
  content: PreviewContent;
};

export type PreviewHistoryState = {
  entries: PreviewHistoryEntry[];
  index: number;
};

export function createPreviewHistoryState(): PreviewHistoryState {
  return { entries: [], index: -1 };
}

export function previewArtifactKey(input: {
  sourceId?: string;
  blockIndex?: number;
  kind: PreviewKind;
  body: string;
}): string {
  if (input.sourceId) {
    return `${input.sourceId}:${input.blockIndex ?? 0}`;
  }
  return `${input.kind}:${input.body.length}:${hashPreviewBody(input.body)}`;
}

function hashPreviewBody(body: string): string {
  let hash = 0;
  for (let i = 0; i < body.length; i += 1) {
    hash = ((hash << 5) - hash + body.charCodeAt(i)) | 0;
  }
  return String(hash >>> 0);
}

const MARKDOWN_HEADING = /^#\s+(.+)$/;
const HTML_H1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
const HTML_TITLE = /<title[^>]*>([\s\S]*?)<\/title>/i;

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim();
}

/** Prefer first heading in body; fall back to kind-specific label. */
export function derivePreviewTitle(content: PreviewContent, options?: { turnNumber?: number }): string {
  const body = content.body.trim();

  if (content.kind === 'markdown') {
    for (const line of body.split('\n')) {
      const match = line.trim().match(MARKDOWN_HEADING);
      if (match?.[1]) return match[1].trim();
    }
  }

  if (content.kind === 'html') {
    for (const line of body.split('\n')) {
      const match = line.trim().match(MARKDOWN_HEADING);
      if (match?.[1]) return match[1].trim();
    }
    const h1 = body.match(HTML_H1)?.[1];
    if (h1) return stripHtmlTags(h1);
    const title = body.match(HTML_TITLE)?.[1];
    if (title) return stripHtmlTags(title);
    if (options?.turnNumber) return `HTML artifact · turn ${options.turnNumber}`;
    return 'HTML artifact';
  }

  if (content.title.trim()) return content.title.trim();
  return content.kind === 'image' ? 'Image' : 'Preview';
}

export function withDerivedPreviewTitle(
  content: PreviewContent,
  options?: { turnNumber?: number },
): PreviewContent {
  return { ...content, title: derivePreviewTitle(content, options) };
}

export function canGoPreviewHistoryBack(state: PreviewHistoryState): boolean {
  return state.index > 0;
}

export function canGoPreviewHistoryForward(state: PreviewHistoryState): boolean {
  return state.index >= 0 && state.index < state.entries.length - 1;
}

export function currentPreviewHistoryContent(state: PreviewHistoryState): PreviewContent | null {
  if (state.index < 0) return null;
  return state.entries[state.index]?.content ?? null;
}

export function pushPreviewHistory(state: PreviewHistoryState, content: PreviewContent): PreviewHistoryState {
  const key = previewArtifactKey({
    sourceId: content.sourceId,
    blockIndex: content.blockIndex,
    kind: content.kind,
    body: content.body,
  });
  if (state.index >= 0 && state.entries[state.index]?.key === key) {
    return state;
  }

  const nextEntries = state.entries.slice(0, state.index + 1);
  nextEntries.push({ key, content });
  while (nextEntries.length > PREVIEW_HISTORY_MAX_DEPTH) {
    nextEntries.shift();
  }

  return {
    entries: nextEntries,
    index: nextEntries.length - 1,
  };
}

export function goPreviewHistoryBack(state: PreviewHistoryState): PreviewHistoryState | null {
  if (!canGoPreviewHistoryBack(state)) return null;
  return { ...state, index: state.index - 1 };
}

export function goPreviewHistoryForward(state: PreviewHistoryState): PreviewHistoryState | null {
  if (!canGoPreviewHistoryForward(state)) return null;
  return { ...state, index: state.index + 1 };
}

export function isPreviewHistoryBackShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
): boolean {
  return (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key === '[';
}

export function isPreviewHistoryForwardShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
): boolean {
  return (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key === ']';
}
