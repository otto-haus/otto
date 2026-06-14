import React, { useEffect, useId } from 'react';

export const Modal: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}> = ({ open, title, onClose, children, labelledBy }) => {
  const autoId = useId();
  const titleId = labelledBy ?? `${autoId}-title`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__head">
          <h2 className="modal__title" id={titleId}>{title}</h2>
          <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};
