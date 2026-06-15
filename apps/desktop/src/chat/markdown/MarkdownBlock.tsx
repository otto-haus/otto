import type React from 'react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import {
  accumulateMarkdownBlocks,
  blockRenderKey,
  type BlockAccumulatorSnapshot,
  type BlockKind,
  type SealedMarkdownBlock,
} from './block-accumulator';
import { redactForDisplay } from './redact-for-display';

const TAIL_DEBOUNCE_MS = 75;
const TAIL_PLAINTEXT_THRESHOLD = 16_384;

const markdownComponents: Components = {
  p: ({ children }) => <p className="md__p">{children}</p>,
  h1: ({ children }) => <h3 className="md__heading">{children}</h3>,
  h2: ({ children }) => <h4 className="md__heading">{children}</h4>,
  h3: ({ children }) => <h5 className="md__heading">{children}</h5>,
  h4: ({ children }) => <h5 className="md__heading">{children}</h5>,
  h5: ({ children }) => <h5 className="md__heading">{children}</h5>,
  h6: ({ children }) => <h5 className="md__heading">{children}</h5>,
  ul: ({ children }) => <ul className="md__list">{children}</ul>,
  ol: ({ children }) => <ol className="md__list">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="md__quote">{children}</blockquote>,
  pre: ({ children }) => <pre className="md__pre">{children}</pre>,
  table: ({ children }) => (
    <div className="md__tableWrap">
      <table className="md__table">{children}</table>
    </div>
  ),
};

type MarkdownBlockProps = {
  blockKey: string;
  redactedMarkdown: string;
};

const markdownBlockRenderCounts = new Map<string, number>();

export function __resetMarkdownBlockRenderCounts(): void {
  markdownBlockRenderCounts.clear();
}

export function __getMarkdownBlockRenderCount(blockKey: string): number {
  return markdownBlockRenderCounts.get(blockKey) ?? 0;
}

export function markdownBlockPropsAreEqual(prev: MarkdownBlockProps, next: MarkdownBlockProps): boolean {
  return prev.blockKey === next.blockKey && prev.redactedMarkdown === next.redactedMarkdown;
}

export const MarkdownBlock = memo(function MarkdownBlock({ blockKey, redactedMarkdown }: MarkdownBlockProps) {
  markdownBlockRenderCounts.set(blockKey, (__getMarkdownBlockRenderCount(blockKey)) + 1);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {redactedMarkdown}
    </ReactMarkdown>
  );
}, markdownBlockPropsAreEqual);

function useDebouncedTail(tail: string, streaming: boolean): string {
  const [debounced, setDebounced] = useState(tail);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!streaming) {
      setDebounced(tail);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(tail), TAIL_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tail, streaming]);

  return streaming ? debounced : tail;
}

const StreamingTailBlock: React.FC<{ tail: string; streaming: boolean }> = ({ tail, streaming }) => {
  const displayTail = useDebouncedTail(tail, streaming);
  if (!displayTail) return null;

  if (displayTail.length >= TAIL_PLAINTEXT_THRESHOLD) {
    return <pre className="md__pre">{displayTail}</pre>;
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {redactForDisplay(displayTail)}
    </ReactMarkdown>
  );
};

function sealedBlockProps(block: SealedMarkdownBlock): MarkdownBlockProps {
  const redactedMarkdown = redactForDisplay(block.markdown);
  const blockKey = blockRenderKey(redactedMarkdown, block.kind as BlockKind, block.ordinal);
  return { blockKey, redactedMarkdown };
}

export const StreamMarkdown: React.FC<{ text: string; streaming?: boolean }> = ({ text, streaming = false }) => {
  const snapshotRef = useRef<BlockAccumulatorSnapshot | undefined>(undefined);
  const snapshot = useMemo(() => {
    const next = accumulateMarkdownBlocks(snapshotRef.current, text, !streaming);
    snapshotRef.current = next;
    return next;
  }, [text, streaming]);

  return (
    <div className="md">
      {snapshot.sealed.map((block) => {
        const props = sealedBlockProps(block);
        return <MarkdownBlock key={props.blockKey} {...props} />;
      })}
      <StreamingTailBlock tail={snapshot.tail} streaming={streaming} />
    </div>
  );
};
