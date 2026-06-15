import React, { useCallback, useEffect, useState } from 'react';
import { InlineEmpty } from '../components/ui';
import { Icon } from '../components/icons';
import { paperclipIntakeCopy } from '../copy/surfaces';
import { ottoApi } from '../runtime';
import type {
  PaperclipArtifactRow,
  PaperclipIntakeSnapshot,
  PaperclipTaskRow,
} from '../../electron/shared/types';

export const PaperclipIntakePanel: React.FC = () => {
  const api = ottoApi();
  const [snapshot, setSnapshot] = useState<PaperclipIntakeSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  const reload = useCallback(async () => {
    if (!api?.paperclip) return;
    const next = await api.paperclip.snapshot();
    setSnapshot(next);
  }, [api]);

  useEffect(() => {
    if (!api?.paperclip) return;
    reload().catch(() => setSnapshot(null));
  }, [api, reload]);

  if (!api?.paperclip) return null;

  const connect = async (approved = false) => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.paperclip!.connect({ approved });
      setSnapshot(result.snapshot);
      if (result.needsApproval) {
        setNeedsApproval(true);
        setMessage(result.message ?? paperclipIntakeCopy.approvalRequired);
        return;
      }
      setNeedsApproval(false);
      setMessage(`Connected · receipt ${result.receipt.id}`);
    } catch (error) {
      setMessage(String(error));
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.paperclip!.sync();
      setSnapshot(result.snapshot);
      if (result.receipt) {
        setMessage(result.ok ? result.receipt.result.summary : result.error ?? result.receipt.result.summary);
      } else if (result.error) {
        setMessage(result.error);
      }
    } catch (error) {
      setMessage(String(error));
    } finally {
      setBusy(false);
    }
  };

  const snap = snapshot;
  const connection = snap?.connection ?? 'not_connected';

  return (
    <div className="panel paperclipIntakePanel">
      <div className="between">
        <div>
          <div className="eyebrow">{paperclipIntakeCopy.eyebrow}</div>
          <div className="h-sec" style={{ marginTop: 6 }}>{paperclipIntakeCopy.title}</div>
          <p className="muted" style={{ marginTop: 8 }}>{paperclipIntakeCopy.lede}</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {connection === 'not_connected' ? (
            needsApproval ? (
              <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void connect(true)}>
                {paperclipIntakeCopy.confirmConnect}
              </button>
            ) : (
              <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void connect(false)}>
                {paperclipIntakeCopy.connect}
              </button>
            )
          ) : (
            <button type="button" className="btn" disabled={busy} onClick={() => void sync()}>
              {paperclipIntakeCopy.sync}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="notice" style={{ marginTop: 12 }}>
          <span className={`dot ${connection === 'sync_error' ? 'dot--warn' : 'dot--ok'}`} /> {message}
        </div>
      )}

      {snap?.lastSyncAt && !snap.lastSyncError && (
        <p className="muted" style={{ marginTop: 10 }}>{paperclipIntakeCopy.lastSync(snap.lastSyncAt)}</p>
      )}
      {connection === 'connected' && !snap?.lastSyncAt && (
        <p className="muted" style={{ marginTop: 10 }}>{paperclipIntakeCopy.noSyncYet}</p>
      )}

      {connection === 'not_connected' && (
        <InlineEmpty
          title={paperclipIntakeCopy.notConnectedTitle}
          body={paperclipIntakeCopy.notConnectedBody}
        />
      )}

      {connection === 'sync_error' && snap?.lastSyncError && (
        <InlineEmpty title={paperclipIntakeCopy.syncErrorTitle} body={snap.lastSyncError} />
      )}

      {connection === 'connected' && snap && !snap.lastSyncError
        && !snap.activeTasks.length
        && !snap.blockedTasks.length
        && !snap.recentArtifacts.length && (
        <InlineEmpty
          title={paperclipIntakeCopy.emptySyncTitle}
          body={paperclipIntakeCopy.emptySyncBody}
        />
      )}

      {!!snap?.activeTasks.length && (
        <TaskSection eyebrow={paperclipIntakeCopy.activeEyebrow} tasks={snap.activeTasks} />
      )}
      {!!snap?.blockedTasks.length && (
        <TaskSection eyebrow={paperclipIntakeCopy.blockedEyebrow} tasks={snap.blockedTasks} />
      )}
      {!!snap?.recentArtifacts.length && (
        <ArtifactSection artifacts={snap.recentArtifacts} />
      )}

      <div className="eyebrow" style={{ marginTop: 16 }}>{paperclipIntakeCopy.storageLabel}</div>
      <span className="filechip" style={{ marginTop: 8 }}>{Icon.file} {snap?.dir ?? '~/.otto/adapters/paperclip'}</span>
    </div>
  );
};

function TaskSection({ eyebrow, tasks }: { eyebrow: string; tasks: PaperclipTaskRow[] }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="eyebrow">{eyebrow}</div>
      <div className="receiptEvidence" style={{ marginTop: 10 }}>
        {tasks.map((task) => (
          <div className="zone receiptEvidenceRow" key={task.id}>
            <span className="zone__tag">{task.status}</span>
            <div>
              <div>{task.title}</div>
              <a className="muted" href={task.url} target="_blank" rel="noreferrer">
                {paperclipIntakeCopy.openInPaperclip}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactSection({ artifacts }: { artifacts: PaperclipArtifactRow[] }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="eyebrow">{paperclipIntakeCopy.artifactsEyebrow}</div>
      <div className="receiptEvidence" style={{ marginTop: 10 }}>
        {artifacts.map((artifact) => (
          <div className="zone receiptEvidenceRow" key={artifact.id}>
            <span className="zone__tag">{Icon.file}</span>
            <div>
              <div>{artifact.label}</div>
              <a className="muted" href={artifact.url} target="_blank" rel="noreferrer">
                {paperclipIntakeCopy.openInPaperclip}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
