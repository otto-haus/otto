import React, { useCallback, useEffect, useState } from 'react';
import { SurfaceHero, SurfaceInk, SurfaceMeta, SurfacePage, WebPreviewFrame, Notice } from '../components/ui';
import { terminalCopy } from '../copy/surfaces';
import { ottoApi } from '../runtime';

export const Terminal: React.FC = () => {
  const api = ottoApi();
  const [cwd, setCwd] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOpened, setLastOpened] = useState<string | null>(null);

  useEffect(() => {
    if (!api?.terminal) return;
    let cancelled = false;
    void api.terminal.workspaceRoot().then((root) => {
      if (!cancelled) setCwd(root);
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const openTerminal = useCallback(async () => {
    if (!api?.terminal) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.terminal.open();
      setCwd(result.cwd);
      if (result.ok) {
        setLastOpened(new Date().toLocaleTimeString());
      } else {
        setError(result.error ?? terminalCopy.openFailed);
      }
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }, [api]);

  if (!api) {
    return <WebPreviewFrame surface="terminal" />;
  }

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={terminalCopy.eyebrow}
        title={terminalCopy.title}
        lede={terminalCopy.body}
        actions={
          <button type="button" className="btn btn--primary" onClick={() => void openTerminal()} disabled={busy}>
            {busy ? terminalCopy.opening : terminalCopy.open}
          </button>
        }
      />
      <SurfaceInk lead={terminalCopy.inkLead} muted={terminalCopy.inkMuted} sub={terminalCopy.embeddedNote} />
      <SurfaceMeta label={terminalCopy.workspaceLabel}>{cwd ?? terminalCopy.workspaceLoading}</SurfaceMeta>
      {lastOpened ? <SurfaceMeta label={terminalCopy.lastOpenedLabel}>{lastOpened}</SurfaceMeta> : null}
      {error ? <Notice tone="warn">{error}</Notice> : null}
    </SurfacePage>
  );
};
