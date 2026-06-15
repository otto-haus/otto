import React, { useEffect, useId, useRef } from 'react';

/** Non-blocking side panel — chat composer stays interactive (#316). */
export const ContextDrawer: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}> = ({ open, title, onClose, children, labelledBy }) => {
  const autoId = useId();
  const titleId = labelledBy ?? `${autoId}-title`;
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      className="contextDrawer"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="contextDrawer__head">
        <h2 className="contextDrawer__title" id={titleId}>{title}</h2>
        <button type="button" className="contextDrawer__close" aria-label="Close panel" onClick={onClose}>×</button>
      </div>
      <div className="contextDrawer__body">{children}</div>
    </aside>
  );
};
