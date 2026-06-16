import type React from 'react';
import { StreamMarkdown } from '../chat/markdown/MarkdownBlock';
import { previewCopy } from '../copy/surfaces';
import type { PreviewContent } from '../preview/preview-content';
import { PREVIEW_IFRAME_SANDBOX, wrapHtmlForSandboxPreview } from '../preview/preview-sandbox';
import { EmptyState } from './ui/EmptyState';
import { Icon } from './icons';

type PreviewPaneProps = {
  open: boolean;
  width: number;
  content: PreviewContent | null;
  onClose: () => void;
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void;
};

const HtmlPreview: React.FC<{ html: string }> = ({ html }) => (
  <iframe
    className="previewPane__frame"
    title={previewCopy.htmlFrameTitle}
    sandbox={PREVIEW_IFRAME_SANDBOX}
    srcDoc={wrapHtmlForSandboxPreview(html)}
    referrerPolicy="no-referrer"
  />
);

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
}) => {
  if (!open) return null;

  return (
    <aside
      className="previewPane"
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
          <HtmlPreview html={content.body} />
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
