import React, { useState } from 'react';
import { chatCopy, permissionCopy } from '../../copy/surfaces';

export type PermissionRequestView = {
  requestId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  interactive: boolean;
};

export type PermissionDecision = 'allow-once' | 'allow-session' | 'deny';

export const PermissionCard: React.FC<{
  request: PermissionRequestView;
  busy?: boolean;
  onDecide: (decision: PermissionDecision, denyMessage?: string) => void;
  onCorrectThis?: () => void;
}> = ({ request, busy = false, onDecide, onCorrectThis }) => {
  const [denyReason, setDenyReason] = useState('');

  return (
    <div className="permissionCard panel">
      <div className="permissionCard__eyebrow">{permissionCopy.eyebrow}</div>
      <div className="permissionCard__tool">{request.toolName}</div>
      {request.interactive ? (
        <p className="permissionCard__note muted">{permissionCopy.interactiveNote}</p>
      ) : null}
      <pre className="permissionCard__input mono faint">{JSON.stringify(request.toolInput, null, 2)}</pre>
      <label className="permissionCard__denyLabel">
        <span className="faint">{permissionCopy.denyPlaceholder}</span>
        <input
          type="text"
          value={denyReason}
          onChange={(e) => setDenyReason(e.target.value)}
          disabled={busy}
        />
      </label>
      <div className="permissionCard__actions">
        <button type="button" className="btn btn--solid-d" disabled={busy} onClick={() => onDecide('allow-once')}>
          {permissionCopy.allowOnce}
        </button>
        <button type="button" className="btn btn--ghost-d" disabled={busy} onClick={() => onDecide('allow-session')}>
          {permissionCopy.allowSession}
        </button>
        <button
          type="button"
          className="btn btn--ghost-d"
          disabled={busy}
          onClick={() => onDecide('deny', denyReason.trim() || permissionCopy.deniedByUser)}
        >
          {permissionCopy.deny}
        </button>
        {onCorrectThis ? (
          <button
            type="button"
            className="btn btn--ghost-d"
            disabled={busy}
            title={chatCopy.correctThisHint}
            onClick={onCorrectThis}
          >
            {permissionCopy.correctThis}
          </button>
        ) : null}
      </div>
    </div>
  );
};
