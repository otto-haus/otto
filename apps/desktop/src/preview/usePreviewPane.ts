import { useCallback, useEffect, useState } from 'react';
import type { PreviewContent } from './preview-content';
import { PREVIEW_DEFAULT_WIDTH_PX, PREVIEW_MAX_WIDTH_RATIO, PREVIEW_MIN_WIDTH_PX } from './preview-content';

const OPEN_KEY = 'otto.preview.open';
const WIDTH_KEY = 'otto.preview.width';

function readOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === '1';
  } catch {
    return false;
  }
}

function readWidth(): number {
  try {
    const raw = localStorage.getItem(WIDTH_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : PREVIEW_DEFAULT_WIDTH_PX;
  } catch {
    return PREVIEW_DEFAULT_WIDTH_PX;
  }
}

export function usePreviewPane() {
  const [open, setOpen] = useState(readOpen);
  const [width, setWidth] = useState(readWidth);
  const [content, setContent] = useState<PreviewContent | null>(null);

  useEffect(() => {
    try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* best effort */ }
  }, [open]);

  useEffect(() => {
    try { localStorage.setItem(WIDTH_KEY, String(Math.round(width))); } catch { /* best effort */ }
  }, [width]);

  const toggle = useCallback(() => setOpen((value) => !value), []);
  const close = useCallback(() => setOpen(false), []);
  const show = useCallback((next: PreviewContent) => {
    setContent(next);
    setOpen(true);
  }, []);

  const clampWidth = useCallback((next: number, containerWidth: number) => {
    const max = Math.max(PREVIEW_MIN_WIDTH_PX, Math.floor(containerWidth * PREVIEW_MAX_WIDTH_RATIO));
    return Math.min(max, Math.max(PREVIEW_MIN_WIDTH_PX, next));
  }, []);

  const resizeBy = useCallback((delta: number, containerWidth: number) => {
    setWidth((current) => clampWidth(current - delta, containerWidth));
  }, [clampWidth]);

  const setClampedWidth = useCallback((next: number, containerWidth: number) => {
    setWidth(clampWidth(next, containerWidth));
  }, [clampWidth]);

  return {
    open,
    width,
    content,
    toggle,
    close,
    show,
    setContent,
    resizeBy,
    setClampedWidth,
    clampWidth,
  };
}
