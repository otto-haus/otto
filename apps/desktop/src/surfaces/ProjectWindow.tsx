import React, { useEffect, useState } from 'react';
import type { WorkspaceContext } from '../../electron/shared/types';
import { projectCopy } from '../copy/surfaces';
import { ottoApi } from '../runtime';
import { EmptyState } from '../components/ui';

const PathRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="contextRow">
    <div className="contextRow__label">{label}</div>
    <code className="contextRow__value mono">{value}</code>
  </div>
);

export const ProjectWindow: React.FC = () => {
  const api = ottoApi();
  const [ctx, setCtx] = useState<WorkspaceContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api?.workspace?.context) return;
    let cancelled = false;
    const load = () => {
      void api.workspace.context()
        .then((next) => { if (!cancelled) setCtx(next); })
        .catch((e) => { if (!cancelled) setError(String(e)); });
    };
    load();
    const timer = window.setInterval(load, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [api]);

  if (!api) {
    return (
      <EmptyState
        eyebrow={projectCopy.eyebrow}
        title={projectCopy.windowTitle}
        body={projectCopy.unavailable}
      />
    );
  }

  if (error) {
    return (
      <EmptyState eyebrow={projectCopy.eyebrow} title={projectCopy.windowTitle} body={error} />
    );
  }

  if (!ctx) {
    return (
      <EmptyState eyebrow={projectCopy.eyebrow} title={projectCopy.loading} body={projectCopy.windowLede} />
    );
  }

  return (
    <div className="contextPanel">
      <p className="contextPanel__lede muted">{projectCopy.windowLede}</p>
      <PathRow label={projectCopy.projectRoot} value={ctx.projectRoot} />
      <PathRow label={projectCopy.ottoHome} value={ctx.ottoHome} />
      <PathRow label={projectCopy.profileHome} value={ctx.profileHome} />
      <PathRow label={projectCopy.lettaState} value={ctx.lettaStateDir} />
      <div className="contextPanel__section">
        <div className="eyebrow">{projectCopy.sessionTitle}</div>
        {ctx.activeThread ? (
          <>
            <PathRow label={projectCopy.threadLabel} value={`${ctx.activeThread.title} (${ctx.activeThread.id})`} />
            {ctx.activeThread.agentId ? (
              <PathRow label={projectCopy.agentLabel} value={ctx.activeThread.agentId} />
            ) : null}
            {ctx.activeThread.conversationId ? (
              <PathRow label={projectCopy.conversationLabel} value={ctx.activeThread.conversationId} />
            ) : null}
          </>
        ) : (
          <p className="muted">No active thread.</p>
        )}
        {ctx.runtime ? (
          <PathRow
            label={projectCopy.transportLabel}
            value={`${ctx.runtime.effectiveTransport ?? 'unknown'}${ctx.runtime.ready ? '' : ' · not ready'}`}
          />
        ) : null}
      </div>
      <div className="contextPanel__section contextPanel__section--warn">
        <div className="eyebrow">{projectCopy.switchTitle}</div>
        <p className="contextPanel__note">{projectCopy.switchBlocked}</p>
        <p className="muted">{ctx.projectSwitch.reason}</p>
      </div>
    </div>
  );
};
