import React from 'react';
import { EmptyState } from '../components/ui';
import { labsCopy } from '../copy/surfaces';

export const LabsBlockedShell: React.FC<{
  title: string;
  body: string;
  next?: string;
  onOpenSettings?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}> = ({ title, body, next, onOpenSettings, onAction, actionLabel }) => (
  <div className="labsBlockedShell">
    <EmptyState
      eyebrow={labsCopy.blockedEyebrow}
      title={title}
      body={body}
      next={next ?? labsCopy.blockedNext}
    />
    {(onOpenSettings || onAction) ? (
      <div className="labsBlockedShell__actions">
        {onOpenSettings ? (
          <button type="button" className="btn btn--primary" onClick={onOpenSettings}>
            {labsCopy.openSettings}
          </button>
        ) : null}
        {onAction ? (
          <button type="button" className="btn" onClick={onAction}>
            {actionLabel ?? labsCopy.startSidecar}
          </button>
        ) : null}
      </div>
    ) : null}
  </div>
);
