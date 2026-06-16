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

  useEffect(() => {
    setAnnotateMode(false);
  }, [content?.body, content?.kind, content?.sourceId]);

  useEffect(() => {
    if (!annotateMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAnnotateMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [annotateMode]);

  const canAnnotate = runtimeConnected && content?.kind === 'html' && !!onProposeCorrection;
  const annotateDisabledReason = !runtimeConnected
    ? previewCopy.annotateDisabledNotConnected
    : content?.kind !== 'html'
      ? previewCopy.annotateDisabledNotHtml
      : undefined;

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

  return (
    <aside
      className={`previewPane${annotateMode ? ' previewPane--annotate' : ''}`}
      style={{ width }}
      aria-label={previewCopy.panelLabel}
    >
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
              onClick={() => { if (canAnnotate) setAnnotateMode((value) => !value); }}
            >
              {annotateMode ? previewCopy.annotateActiveLabel : previewCopy.annotateLabel}
            </button>
          ) : null}
          <button type="button" className="previewPane__close" aria-label={previewCopy.close} onClick={onClose}>
            {Icon.x}
          </button>
        </div>
      </header>
      <div className="previewPane__body">
        {!content ? (
          <EmptyState
            eyebrow={previewCopy.emptyEyebrow}
            title={previewCopy.emptyTitle}
            body={previewCopy.emptyBody}
            next={previewCopy.emptyNext}
          />
        ) : content.kind === 'html' ? (
          <HtmlPreview html={content.body} annotateMode={annotateMode} onElementPick={handleElementPick} />
        ) : content.kind === 'image' ? (
          <ImagePreview src={content.body} title={content.title} />
        ) : (
          <div className="previewPane__markdown">
            <StreamMarkdown text={content.body} />
          </div>
        )}
      </div>
      <div
        className="previewPane__handle"
        role="separator"
        aria-orientation="vertical"
        aria-label={previewCopy.resizeHandle}
        onPointerDown={onResizeStart}
      />
    </aside>
  );
};
