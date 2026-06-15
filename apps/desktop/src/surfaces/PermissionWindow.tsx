import React, { useEffect, useState } from 'react';
import type { PermissionLogEntry, PermissionState } from '../../electron/shared/types';
import { permissionCopy } from '../copy/surfaces';
import { ottoApi } from '../runtime';
import { EmptyState, PermissionCard, type PermissionDecision, type PermissionRequestView } from '../components/ui';

const statusLabel = (entry: PermissionLogEntry): string => {
  if (entry.status === 'pending') return 'pending';
  if (entry.status === 'allow-once') return `allowed · ${permissionCopy.scopeOnce}`;
  if (entry.status === 'allow-session') return `allowed · ${permissionCopy.scopeSession}`;
  if (entry.status === 'timeout') return 'timed out';
  return 'denied';
};

const RecentRow: React.FC<{ entry: PermissionLogEntry }> = ({ entry }) => (
  <div className="contextRecent">
    <div className="between">
      <span className="contextRecent__tool">{entry.toolName}</span>
      <span className={`pill pill--${entry.risk === 'high' ? 'warn' : 'neutral'}`}>{entry.risk} risk</span>
    </div>
    <div className="contextRecent__meta faint">
      <span>{statusLabel(entry)}</span>
      {entry.receiptId ? <span> · receipt {entry.receiptId}</span> : null}
    </div>
    {entry.message ? <p className="contextRecent__msg muted">{entry.message}</p> : null}
  </div>
);

export const PermissionWindow: React.FC<{
  pending: PermissionRequestView | null;
  pendingCount?: number;
  busy?: boolean;
  onDecide: (decision: PermissionDecision, denyMessage?: string) => void;
  onCorrectThis?: () => void;
}> = ({ pending, pendingCount = pending ? 1 : 0, busy = false, onDecide, onCorrectThis }) => {
  const api = ottoApi();
  const [state, setState] = useState<PermissionState | null>(null);

  useEffect(() => {
    if (!api?.permission?.state) return;
    let cancelled = false;
    const load = () => {
      void api.permission.state()
        .then((next) => { if (!cancelled) setState(next); })
        .catch(() => { if (!cancelled) setState(null); });
    };
    load();
    const timer = window.setInterval(load, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [api, pending, busy]);

  if (!api) {
    return (
      <EmptyState
        eyebrow={permissionCopy.eyebrow}
        title={permissionCopy.windowTitle}
        body="Permission state is available in the desktop app only."
      />
    );
  }

  return (
    <div className="contextPanel">
      <p className="contextPanel__lede muted">{permissionCopy.windowLede}</p>
      <div className="contextPanel__grid">
        <div className="contextStat">
          <span className="contextStat__label">{permissionCopy.modeLabel}</span>
          <span className="contextStat__value">{state?.mode ?? 'default'}</span>
        </div>
        <div className="contextStat">
          <span className="contextStat__label">{permissionCopy.routeLabel}</span>
          <span className="contextStat__value">{state?.route ?? '…'}</span>
        </div>
      </div>

      {pending ? (
        <div className="contextPanel__section">
          <div className="eyebrow">
            {permissionCopy.pendingTitle}
            {pendingCount > 1 ? (
              <span className="faint">{` · ${pendingCount} queued`}</span>
            ) : null}
          </div>
          <PermissionCard
            request={pending}
            busy={busy}
            onDecide={onDecide}
            onCorrectThis={onCorrectThis}
          />
        </div>
      ) : null}

      <div className="contextPanel__section">
        <div className="eyebrow">{permissionCopy.sessionAllowedTitle}</div>
        {state?.sessionAllowed?.length ? (
          <div className="contextPills">
            {state.sessionAllowed.map((tool) => (
              <span className="pill pill--ok" key={tool}>{tool}</span>
            ))}
          </div>
        ) : (
          <p className="muted">{permissionCopy.sessionAllowedEmpty}</p>
        )}
      </div>

      <div className="contextPanel__section">
        <div className="eyebrow">{permissionCopy.recentTitle}</div>
        {state?.recent?.length ? (
          <div className="contextRecentList">
            {state.recent.map((entry) => (
              <RecentRow key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="muted">{permissionCopy.recentEmpty}</p>
        )}
      </div>
    </div>
  );
};
