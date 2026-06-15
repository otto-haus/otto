import type React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

/** Collapse assistant bodies taller than this (presentation-only; full text stays in DOM). */
export const COLLAPSED_MESSAGE_MAX_PX = 420;

type CollapsibleMessageBodyProps = {
  children: React.ReactNode;
  collapsible: boolean;
};

export const CollapsibleMessageBody: React.FC<CollapsibleMessageBodyProps> = ({ children, collapsible }) => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    if (!collapsible) {
      setOverflows(false);
      setExpanded(false);
      return;
    }
    const el = shellRef.current;
    if (!el) return;
    const measure = () => {
      const tall = el.scrollHeight > COLLAPSED_MESSAGE_MAX_PX + 4;
      setOverflows(tall);
      if (!tall) setExpanded(false);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [collapsible, children]);

  const showCollapsed = collapsible && overflows && !expanded;

  const toggle = () => {
    const scrollEl = shellRef.current?.closest('.chat__stream') as HTMLElement | null;
    const bodyEl = shellRef.current;
    if (!scrollEl || !bodyEl) {
      setExpanded((v) => !v);
      return;
    }
    const scrollRect = scrollEl.getBoundingClientRect();
    const bodyRect = bodyEl.getBoundingClientRect();
    const offsetBefore = bodyRect.top - scrollRect.top;
    setExpanded((v) => !v);
    requestAnimationFrame(() => {
      const nextRect = bodyEl.getBoundingClientRect();
      scrollEl.scrollTop += nextRect.top - scrollRect.top - offsetBefore;
    });
  };

  return (
    <div
      ref={shellRef}
      className={`msg__bodyShell${showCollapsed ? ' msg__bodyShell--collapsed' : ''}`}
      style={showCollapsed ? { maxHeight: COLLAPSED_MESSAGE_MAX_PX } : undefined}
    >
      <div className="msg__body">{children}</div>
      {collapsible && overflows ? (
        <button type="button" className="msg__expand" onClick={toggle} aria-expanded={expanded}>
          {expanded ? 'Less' : 'More'}
        </button>
      ) : null}
    </div>
  );
};
