import React, { useState } from 'react';
import { chatCopy, permissionCopy } from '../../copy/surfaces';

export type PermissionRequestView = {
  requestId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  interactive: boolean;
};

export type PermissionDecision = 'allow-once' | 'allow-session' | 'deny';

const riskForTool = (toolName: string): 'low' | 'medium' | 'high' => {
  if (/(delete|destroy|send|publish|deploy|merge|push|spend|wire|credential|secret)/i.test(toolName)) return 'high';
  if (/(write|edit|install|migrate|exec|run|bash|shell)/i.test(toolName)) return 'medium';
  return 'low';
};

export const PermissionCard: React.FC<{
  request: PermissionRequestView;
  busy?: boolean;
  onDecide: (decision: PermissionDecision, denyMessage?: string) => void;
  onCorrectThis?: () => void;
}> = ({ request, busy = false, onDecide, onCorrectThis }) => {
  const [denyReason, setDenyReason] = useState('');
  const risk = riskForTool(request.toolName);
  const scopePreview = Object.keys(request.toolInput).slice(0, 4).join(', ') || 'tool input';

  return (
    <div className="permissionCard panel">
      <div className="permissionCard__eyebrow">{permissionCopy.eyebrow}</div>
      <div className="between">
        <div className="permissionCard__tool">{request.toolName}</div>
        <span className={`pill pill--${risk === 'high' ? 'warn' : 'neutral'}`}>
          {permissionCopy.riskLabel}: {risk}
        </span>
      </div>
      <p className="permissionCard__note muted">
        {permissionCopy.actionLabel}: <code>{request.toolName}</code> · scope: {scopePreview}
      </p>
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
