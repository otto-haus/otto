export type PreviewKind = 'markdown' | 'html' | 'image';

export type PreviewContent = {
  title: string;
  kind: PreviewKind;
  body: string;
  sourceId?: string;
  /** e.g. generated · not ratified (#511) */
  badge?: string;
};

const HTML_FENCE = /```(?:html|htm)\s*\n([\s\S]*?)```/i;
const IMAGE_URL = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i;
const ARTIFACT_PATH = /\/\.otto\/artifacts\//;

function generatedArtifactBadge(src: string): string | undefined {
  if (src.startsWith('file://') && ARTIFACT_PATH.test(decodeURIComponent(src))) {
    return 'generated · not ratified';
  }
  if (ARTIFACT_PATH.test(src)) return 'generated · not ratified';
  return undefined;
}

function isHtmlDocument(text: string): boolean {
  const trimmed = text.trim();
  return /^<!DOCTYPE html\b/i.test(trimmed) || /^<html[\s>]/i.test(trimmed);
}

function isImageSrc(src: string): boolean {
  const value = src.trim();
  return value.startsWith('data:image/') || IMAGE_URL.test(value);
}

/** Prefer fenced HTML, then bare HTML documents, then lone markdown images, else markdown. */
export function previewFromText(text: string, options?: { title?: string; sourceId?: string }): PreviewContent | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const htmlFence = trimmed.match(HTML_FENCE);
  if (htmlFence?.[1]) {
    return {
      title: options?.title ?? 'HTML artifact',
      kind: 'html',
      body: htmlFence[1].trim(),
      sourceId: options?.sourceId,
    };
  }

  if (isHtmlDocument(trimmed)) {
    return {
      title: options?.title ?? 'HTML artifact',
      kind: 'html',
      body: trimmed,
      sourceId: options?.sourceId,
    };
  }

  const imageMatch = trimmed.match(/^!\[[^\]]*]\(([^)]+)\)$/);
  if (imageMatch && isImageSrc(imageMatch[1])) {
    const src = imageMatch[1].trim();
    return {
      title: options?.title ?? 'Image',
      kind: 'image',
      body: src,
      sourceId: options?.sourceId,
      badge: generatedArtifactBadge(src),
    };
  }

  return {
    title: options?.title ?? 'Preview',
    kind: 'markdown',
    body: text,
    sourceId: options?.sourceId,
  };
}

export function previewFromCodeBlock(code: string, lang: string | undefined, options?: { title?: string; sourceId?: string }): PreviewContent | null {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const normalizedLang = (lang ?? '').toLowerCase();

  if (normalizedLang === 'html' || normalizedLang === 'htm' || isHtmlDocument(trimmed)) {
    return {
      title: options?.title ?? 'HTML artifact',
      kind: 'html',
      body: trimmed,
      sourceId: options?.sourceId,
    };
  }

  if (normalizedLang === 'markdown' || normalizedLang === 'md') {
    return previewFromText(trimmed, options);
  }

  return {
    title: options?.title ?? (normalizedLang ? `${normalizedLang} snippet` : 'Snippet'),
    kind: 'markdown',
    body: `\`\`\`${normalizedLang}\n${trimmed}\n\`\`\``,
    sourceId: options?.sourceId,
  };
}

export const PREVIEW_MIN_WIDTH_PX = 280;
export const PREVIEW_MAX_WIDTH_RATIO = 0.62;
export const PREVIEW_DEFAULT_WIDTH_PX = 420;
