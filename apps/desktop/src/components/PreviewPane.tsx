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
  defaultPreviewCorrectionDraft,
  previewArtifactHash,
  serializePreviewElementContext,
} from '../preview/preview-element-context';
import {
  canTogglePreviewFullscreen,
  isPreviewFullscreenExitKey,
  isPreviewFullscreenShortcut,
} from '../preview/preview-fullscreen';
import { PREVIEW_IFRAME_SANDBOX, wrapHtmlForSandboxPreview } from '../preview/preview-sandbox';
import { EmptyState } from './ui/EmptyState';
import { Icon } from './icons';

type PreviewPaneProps = {
  open: boolean;
  width: number;
  content: PreviewContent | null;
  onClose: () => void;
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  runtimeConnected?: boolean;
  onProposeCorrection?: (context: ProposeCorrectionContext) => void;
};

const HtmlPreview: React.FC<{
  html: string;
  annotateMode: boolean;
  onElementPick: (pick: import('../preview/preview-element-context').PreviewElementPick) => void;
}> = ({ html, annotateMode, onElementPick }) => {
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

  return (
    <iframe
      ref={frameRef}
      className="previewPane__frame"
      title={previewCopy.htmlFrameTitle}
      sandbox={annotateMode ? PREVIEW_ANNOTATE_IFRAME_SANDBOX : PREVIEW_IFRAME_SANDBOX}
      srcDoc={annotateMode ? wrapHtmlForAnnotatePreview(html) : wrapHtmlForSandboxPreview(html)}
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
  onElementPick: (pick: import('../preview/preview-element-context').PreviewElementPick) => void;
}> = ({ content, annotateMode, onElementPick }) => {
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
    return <HtmlPreview html={content.body} annotateMode={annotateMode} onElementPick={onElementPick} />;
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
  onClose,
  onResizeStart,
  runtimeConnected = false,
  onProposeCorrection,
}) => {
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
  }, [open, focusedInPane, fullscreen, canFullscreen, annotateMode, exitFullscreen]);

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
          onToggleAnnotate={() => setAnnotateMode((value) => !value)}
          onToggleFullscreen={toggleFullscreen}
          onClose={onClose}
          closeLabel={previewCopy.close}
        />
        <div className="previewPane__body">
          <PreviewBody content={content} annotateMode={annotateMode} onElementPick={handleElementPick} />
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
              onToggleAnnotate={() => setAnnotateMode((value) => !value)}
              onToggleFullscreen={toggleFullscreen}
              onClose={exitFullscreen}
              closeLabel={previewCopy.exitFullscreen}
            />
            <div className="previewFullscreen__body">
              <PreviewBody content={content} annotateMode={annotateMode} onElementPick={handleElementPick} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
