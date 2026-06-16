import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StreamMarkdown } from '../chat/markdown/MarkdownBlock';
import type { ProposeCorrectionContext } from '../chat/ProposeCorrectionModal';
import { previewCopy } from '../copy/surfaces';
import type { PreviewContent } from '../preview/preview-content';
import {
  isPreviewAnnotateMessage,
  PREVIEW_ANNOTATE_IFRAME_SANDBOX,
  wrapHtmlForAnnotatePreview,
} from '../preview/preview-annotate';
import {
  isPreviewCanvasActionMessage,
  type PreviewCanvasActionId,
  validatePreviewCanvasAction,
} from '../preview/preview-canvas-actions';
import {
  PREVIEW_CANVAS_IFRAME_SANDBOX,
  wrapHtmlForCanvasPreview,
} from '../preview/preview-canvas';
import {
  defaultPreviewCorrectionDraft,
  previewArtifactHash,
  serializePreviewElementContext,
} from '../preview/preview-element-context';
import {
  canTogglePreviewFullscreen,
  isPreviewFullscreenExitKey,
  isPreviewFullscreenShortcut,
} from '../preview/preview-fullscreen';
import {
  isPreviewHistoryBackShortcut,
  isPreviewHistoryForwardShortcut,
} from '../preview/preview-history';
import { PREVIEW_IFRAME_SANDBOX, wrapHtmlForSandboxPreview } from '../preview/preview-sandbox';
import { useLabs } from '../labs/labs-context';
import { EmptyState } from './ui/EmptyState';
import { Icon } from './icons';

type PreviewPaneProps = {
  open: boolean;
  width: number;
  content: PreviewContent | null;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onClose: () => void;
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  runtimeConnected?: boolean;
  onProposeCorrection?: (context: ProposeCorrectionContext) => void;
  onCanvasAction?: (action: PreviewCanvasActionId, target: string | null) => void;
};

const HtmlPreview: React.FC<{
  html: string;
  annotateMode: boolean;
  canvasMode: boolean;
  onElementPick: (pick: import('../preview/preview-element-context').PreviewElementPick) => void;
  onCanvasAction?: (action: import('../preview/preview-canvas-actions').PreviewCanvasActionId, target: string | null) => void;
}> = ({ html, annotateMode, canvasMode, onElementPick, onCanvasAction }) => {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!annotateMode) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isPreviewAnnotateMessage(event.data)) return;
      onElementPick(event.data.pick);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [annotateMode, onElementPick]);

  useEffect(() => {
    if (!canvasMode || annotateMode) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isPreviewCanvasActionMessage(event.data)) return;
      const validated = validatePreviewCanvasAction(event.data);
      if (!validated.ok) return;
      onCanvasAction?.(validated.action, validated.target);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [canvasMode, annotateMode, onCanvasAction]);

  const sandbox = annotateMode
    ? PREVIEW_ANNOTATE_IFRAME_SANDBOX
    : canvasMode
      ? PREVIEW_CANVAS_IFRAME_SANDBOX
      : PREVIEW_IFRAME_SANDBOX;
  const srcDoc = annotateMode
    ? wrapHtmlForAnnotatePreview(html)
    : canvasMode
      ? wrapHtmlForCanvasPreview(html)
      : wrapHtmlForSandboxPreview(html);

  return (
    <iframe
      ref={frameRef}
      className="previewPane__frame"
      title={previewCopy.htmlFrameTitle}
      sandbox={sandbox}
      srcDoc={srcDoc}
      referrerPolicy="no-referrer"
    />
  );
};

const ImagePreview: React.FC<{ src: string; title: string }> = ({ src, title }) => (
  <div className="previewPane__imageWrap">
    <img className="previewPane__image" src={src} alt={title} />
  </div>
);

const PreviewBody: React.FC<{
  content: PreviewContent | null;
  annotateMode: boolean;
  canvasMode: boolean;
  onElementPick: (pick: import('../preview/preview-element-context').PreviewElementPick) => void;
  onCanvasAction?: (action: import('../preview/preview-canvas-actions').PreviewCanvasActionId, target: string | null) => void;
}> = ({ content, annotateMode, canvasMode, onElementPick, onCanvasAction }) => {
  if (!content) {
    return (
      <EmptyState
        eyebrow={previewCopy.emptyEyebrow}
        title={previewCopy.emptyTitle}
        body={previewCopy.emptyBody}
        next={previewCopy.emptyNext}
      />
    );
  }
  if (content.kind === 'html') {
    return (
      <HtmlPreview
        html={content.body}
        annotateMode={annotateMode}
        canvasMode={canvasMode}
        onElementPick={onElementPick}
        onCanvasAction={onCanvasAction}
      />
    );
  }
  if (content.kind === 'image') {
    return <ImagePreview src={content.body} title={content.title} />;
  }
  return (
    <div className="previewPane__markdown">
      <StreamMarkdown text={content.body} />
    </div>
  );
};

const PreviewHeader: React.FC<{
  content: PreviewContent | null;
  annotateMode: boolean;
  canAnnotate: boolean;
  annotateDisabledReason: string | undefined;
  fullscreen: boolean;
  canFullscreen: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onToggleAnnotate: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
  closeLabel: string;
}> = ({
  content,
  annotateMode,
  canAnnotate,
  annotateDisabledReason,
  fullscreen,
  canFullscreen,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onToggleAnnotate,
  onToggleFullscreen,
  onClose,
  closeLabel,
}) => (
  <header className="previewPane__head">
    <div className="previewPane__titleBlock">
      <div className="eyebrow">{previewCopy.eyebrow}</div>
      <div className="previewPane__title">{content?.title ?? previewCopy.emptyTitle}</div>
    </div>
    <div className="previewPane__actions">
      <div className="previewPane__nav">
        <button
          type="button"
          className="previewPane__iconBtn"
          aria-label={previewCopy.historyBack}
          title={previewCopy.historyBackHint}
          disabled={!canGoBack}
          onClick={onBack}
        >
          {Icon.chevronLeft}
        </button>
        <button
          type="button"
          className="previewPane__iconBtn"
          aria-label={previewCopy.historyForward}
          title={previewCopy.historyForwardHint}
          disabled={!canGoForward}
          onClick={onForward}
        >
          {Icon.chevronRight}
        </button>
      </div>
      {content ? <span className="pill">{content.kind}</span> : null}
      {content?.kind === 'html' ? (
        <button
          type="button"
          className={`btn btn--ghost-d previewPane__annotate${annotateMode ? ' is-active' : ''}`}
          disabled={!canAnnotate}
          title={annotateMode ? previewCopy.annotateActiveHint : (canAnnotate ? previewCopy.annotateHint : annotateDisabledReason)}
          aria-pressed={annotateMode}
          onClick={() => { if (canAnnotate) onToggleAnnotate(); }}
        >
          {annotateMode ? previewCopy.annotateActiveLabel : previewCopy.annotateLabel}
        </button>
      ) : null}
      {canFullscreen ? (
        <button
          type="button"
          className="previewPane__iconBtn"
          aria-label={fullscreen ? previewCopy.exitFullscreen : previewCopy.enterFullscreen}
          title={fullscreen ? previewCopy.exitFullscreenHint : previewCopy.enterFullscreenHint}
          onClick={onToggleFullscreen}
        >
          {fullscreen ? Icon.compress : Icon.expand}
        </button>
      ) : null}
      <button type="button" className="previewPane__close" aria-label={closeLabel} onClick={onClose}>
        {Icon.x}
      </button>
    </div>
  </header>
);

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  open,
  width,
  content,
  canGoBack = false,
  canGoForward = false,
  onBack,
  onForward,
  onClose,
  onResizeStart,
  runtimeConnected = false,
  onProposeCorrection,
  onCanvasAction,
}) => {
  const { isFeatureEnabled } = useLabs();
  const canvasMode = isFeatureEnabled('preview_canvas');
  const [annotateMode, setAnnotateMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [focusedInPane, setFocusedInPane] = useState(false);
  const paneRef = useRef<HTMLElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const canAnnotate = runtimeConnected && content?.kind === 'html' && !!onProposeCorrection;
  const canFullscreen = canTogglePreviewFullscreen(open, content != null);
  const annotateDisabledReason = !runtimeConnected
    ? previewCopy.annotateDisabledNotConnected
    : content?.kind !== 'html'
      ? previewCopy.annotateDisabledNotHtml
      : undefined;

  const exitFullscreen = useCallback(() => setFullscreen(false), []);
  const toggleFullscreen = useCallback(() => {
    if (!canFullscreen) return;
    setFullscreen((value) => !value);
  }, [canFullscreen]);

  useEffect(() => {
    setAnnotateMode(false);
  }, [content?.body, content?.kind, content?.sourceId]);

  useEffect(() => {
    if (!open || !content) setFullscreen(false);
  }, [open, content]);

  useEffect(() => {
    if (!fullscreen) return;
    restoreFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    fullscreenRef.current?.focus();
    return () => restoreFocusRef.current?.focus?.();
  }, [fullscreen]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isPreviewHistoryBackShortcut(event) && (focusedInPane || fullscreen) && canGoBack) {
        event.preventDefault();
        onBack?.();
        return;
      }
      if (isPreviewHistoryForwardShortcut(event) && (focusedInPane || fullscreen) && canGoForward) {
        event.preventDefault();
        onForward?.();
        return;
      }
      if (isPreviewFullscreenShortcut(event) && (focusedInPane || fullscreen)) {
        if (!canFullscreen) return;
        event.preventDefault();
        setFullscreen((value) => !value);
        return;
      }
      if (fullscreen && isPreviewFullscreenExitKey(event.key)) {
        event.preventDefault();
        exitFullscreen();
        return;
      }
      if (annotateMode && isPreviewFullscreenExitKey(event.key)) {
        event.preventDefault();
        setAnnotateMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, focusedInPane, fullscreen, canFullscreen, canGoBack, canGoForward, onBack, onForward, annotateMode, exitFullscreen]);

  const handleElementPick = useCallback((pick: import('../preview/preview-element-context').PreviewElementPick) => {
    if (!content || !onProposeCorrection) return;
    const sourceMessageId = content.sourceId ?? 'preview-unknown';
    const artifactHash = previewArtifactHash(content.body);
    const messageText = serializePreviewElementContext({ sourceMessageId, artifactHash, pick });
    onProposeCorrection({
      messageId: sourceMessageId,
      messageText,
      who: 'otto',
      correctionDraft: defaultPreviewCorrectionDraft(pick),
    });
    setAnnotateMode(false);
  }, [content, onProposeCorrection]);

  const handleCanvasAction = useCallback(
    (action: PreviewCanvasActionId, target: string | null) => {
      onCanvasAction?.(action, target);
    },
    [onCanvasAction],
  );

  if (!open) return null;

  const shellClassName = `previewPane${annotateMode ? ' previewPane--annotate' : ''}`;

  return (
    <>
      <aside
        ref={paneRef}
        className={shellClassName}
        style={{ width }}
        aria-label={previewCopy.panelLabel}
        onFocusCapture={() => setFocusedInPane(true)}
        onBlurCapture={(event) => {
          if (paneRef.current?.contains(event.relatedTarget as Node | null)) return;
          setFocusedInPane(false);
        }}
      >
        <PreviewHeader
          content={content}
          annotateMode={annotateMode}
          canAnnotate={canAnnotate}
          annotateDisabledReason={annotateDisabledReason}
          fullscreen={false}
          canFullscreen={canFullscreen}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={() => onBack?.()}
          onForward={() => onForward?.()}
          onToggleAnnotate={() => setAnnotateMode((value) => !value)}
          onToggleFullscreen={toggleFullscreen}
          onClose={onClose}
          closeLabel={previewCopy.close}
        />
        <div className="previewPane__body">
          <PreviewBody
            content={content}
            annotateMode={annotateMode}
            canvasMode={canvasMode}
            onElementPick={handleElementPick}
            onCanvasAction={handleCanvasAction}
          />
        </div>
        <div
          className="previewPane__handle"
          role="separator"
          aria-orientation="vertical"
          aria-label={previewCopy.resizeHandle}
          onPointerDown={onResizeStart}
        />
      </aside>
      {fullscreen && content ? (
        <div className="previewFullscreen" role="presentation">
          <div
            ref={fullscreenRef}
            tabIndex={-1}
            className={`previewFullscreen__dialog ${shellClassName}`}
            role="dialog"
            aria-modal="true"
            aria-label={previewCopy.fullscreenLabel}
            onFocusCapture={() => setFocusedInPane(true)}
            onBlurCapture={(event) => {
              if (fullscreenRef.current?.contains(event.relatedTarget as Node | null)) return;
              setFocusedInPane(false);
            }}
          >
            <PreviewHeader
              content={content}
              annotateMode={annotateMode}
              canAnnotate={canAnnotate}
              annotateDisabledReason={annotateDisabledReason}
              fullscreen
              canFullscreen={canFullscreen}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onBack={() => onBack?.()}
              onForward={() => onForward?.()}
              onToggleAnnotate={() => setAnnotateMode((value) => !value)}
              onToggleFullscreen={toggleFullscreen}
              onClose={exitFullscreen}
              closeLabel={previewCopy.exitFullscreen}
            />
            <div className="previewFullscreen__body">
              <PreviewBody
            content={content}
            annotateMode={annotateMode}
            canvasMode={canvasMode}
            onElementPick={handleElementPick}
            onCanvasAction={handleCanvasAction}
          />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
