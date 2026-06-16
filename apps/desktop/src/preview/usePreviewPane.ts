import { useCallback, useEffect, useRef, useState } from 'react';
import type { PreviewContent } from './preview-content';
import { PREVIEW_DEFAULT_WIDTH_PX, PREVIEW_MAX_WIDTH_RATIO, PREVIEW_MIN_WIDTH_PX } from './preview-content';
import {
  canGoPreviewHistoryBack,
  canGoPreviewHistoryForward,
  createPreviewHistoryState,
  currentPreviewHistoryContent,
  goPreviewHistoryBack,
  goPreviewHistoryForward,
  pushPreviewHistory,
  type PreviewHistoryState,
  withDerivedPreviewTitle,
} from './preview-history';

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

function threadHistoryKey(threadId: string | null | undefined): string {
  return threadId ?? '';
}

export function usePreviewPane(activeThreadId?: string | null) {
  const [open, setOpen] = useState(readOpen);
  const [width, setWidth] = useState(readWidth);
  const [historyState, setHistoryState] = useState<PreviewHistoryState>(createPreviewHistoryState);
  const historyByThreadRef = useRef<Map<string, PreviewHistoryState>>(new Map());
  const activeThreadRef = useRef(activeThreadId);
  const historyStateRef = useRef(historyState);
  historyStateRef.current = historyState;
  const content = currentPreviewHistoryContent(historyState);

  const persistHistory = useCallback((threadId: string | null | undefined, next: PreviewHistoryState) => {
    const key = threadHistoryKey(threadId);
    historyByThreadRef.current.set(key, next);
    setHistoryState(next);
  }, []);

  useEffect(() => {
    if (activeThreadRef.current === activeThreadId) return;
    const previousThreadId = activeThreadRef.current;
    if (previousThreadId !== undefined) {
      historyByThreadRef.current.set(threadHistoryKey(previousThreadId), historyStateRef.current);
    }
    activeThreadRef.current = activeThreadId;
    const restored = historyByThreadRef.current.get(threadHistoryKey(activeThreadId)) ?? createPreviewHistoryState();
    setHistoryState(restored);
  }, [activeThreadId]);

  useEffect(() => {
    try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* best effort */ }
  }, [open]);

  useEffect(() => {
    try { localStorage.setItem(WIDTH_KEY, String(Math.round(width))); } catch { /* best effort */ }
  }, [width]);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  const close = useCallback(() => {
    persistHistory(activeThreadRef.current, createPreviewHistoryState());
    setOpen(false);
  }, [persistHistory]);

  const show = useCallback((next: PreviewContent, options?: { turnNumber?: number }) => {
    const titled = withDerivedPreviewTitle(next, options);
    setHistoryState((current) => {
      const pushed = pushPreviewHistory(current, titled);
      persistHistory(activeThreadRef.current, pushed);
      return pushed;
    });
    setOpen(true);
  }, [persistHistory]);

  const back = useCallback(() => {
    setHistoryState((current) => {
      const next = goPreviewHistoryBack(current);
      if (!next) return current;
      persistHistory(activeThreadRef.current, next);
      return next;
    });
  }, [persistHistory]);

  const forward = useCallback(() => {
    setHistoryState((current) => {
      const next = goPreviewHistoryForward(current);
      if (!next) return current;
      persistHistory(activeThreadRef.current, next);
      return next;
    });
  }, [persistHistory]);

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
    canGoBack: canGoPreviewHistoryBack(historyState),
    canGoForward: canGoPreviewHistoryForward(historyState),
    toggle,
    close,
    show,
    back,
    forward,
    setContent: show,
    resizeBy,
    setClampedWidth,
    clampWidth,
  };
}
