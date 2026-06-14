import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/icons';
import { requiredMissing, isReady } from '../readiness';
import { isElectron } from '../runtime';
import { useRuntimeContext } from '../RuntimeContext';

// In Electron (window.otto present) → the runtime-wired LiveChat.
// In the web preview → the file-backed PreviewChat (unchanged).
export const Chat: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) =>
  isElectron() ? <LiveChat onOpenSettings={onOpenSettings} /> : <PreviewChat />;

/* ---------- LiveChat (Electron, wired to the Letta runtime) ---------- */
const LiveChat: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const rt = useRuntimeContext();
  const [draft, setDraft] = useState('');
  const lastSent = useRef('');
  const st = rt.status;
  const ready = !!st?.ready;

  const submit = () => {
    const t = draft.trim();
    if (t && ready && !rt.busy) {
      lastSent.current = t;
      rt.send(t);
      setDraft('');
    }
  };

  // Error state preserves the user's input: if the last event is an error, restore the draft.
  const lastMsg = rt.messages[rt.messages.length - 1];
  useEffect(() => {
    if (lastMsg?.who === 'error' && lastSent.current && !draft) {
      setDraft(lastSent.current);
      lastSent.current = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMsg]);

  return (
    <div className="chat">
      <div className="chat__head">
        <span className="brand__mark" style={{ width: 28, height: 28, borderRadius: 8 }}>{Icon.owl}</span>
        <div>
          <div style={{ fontWeight: 600 }}>otto</div>
          <div className="chat__id">
            {st
              ? `${st.agentId ?? 'no agent'} · ${st.model ?? 'model unset'}${st.memfsEnabled ? ' · MemFS on' : ''}`
              : 'connecting…'}
          </div>
        </div>
        <span className={`pill ${ready ? 'pill--ok' : 'pill--warn'}`} style={{ marginLeft: 'auto' }}>
          {ready ? 'connected' : 'not connected'}
        </span>
      </div>

      <div className="chat__stream">
        {!ready && st && (
          <div className="inkblock" style={{ maxWidth: 760 }}>
            <div className="inkblock__eyebrow"><span className="dot dot--warn" /> runtime not ready</div>
            <div className="inkblock__title">Otto can't connect yet</div>
            <div className="inkblock__meta">
              <span>{st.reason ?? 'unknown reason'}</span>
              <span>cli: {st.cliResolved ? st.cliPath : 'bundled @letta-ai/letta-code'}</span>
            </div>
            <div className="inkblock__actions">
              <button className="btn btn--solid-d" onClick={rt.retry}>Retry</button>
              {onOpenSettings && <button className="btn btn--ghost-d" onClick={onOpenSettings}>Open Settings</button>}
            </div>
          </div>
        )}
        {ready && rt.messages.length === 0 && (
          <div className="eyebrow" style={{ textAlign: 'center', marginTop: 48 }}>
            Connected to {st?.agentId ?? 'Otto'} — message Otto to start a session.
          </div>
        )}
        {rt.messages.map((m, i) => (
          <div key={i} className={`msg${m.who === 'user' ? ' msg--user' : ''}`}>
            <div className="msg__who">{m.who === 'user' ? 'You' : m.who === 'error' ? 'error' : 'otto'}</div>
            <div className="msg__body" style={m.who === 'error' ? { color: 'var(--stop)' } : undefined}>{m.text}</div>
          </div>
        ))}
        {rt.busy && <div className="eyebrow">Otto is working…</div>}
      </div>

      <div className="promptbar">
        <div className={`promptbox${ready ? '' : ' promptbox--disabled'}`}>
          <input
            placeholder={ready ? 'Message Otto…' : 'Runtime not ready — see Settings'}
            aria-label="Message Otto"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              else if (e.key === 'Escape') { setDraft(''); e.currentTarget.blur(); }
            }}
            disabled={!ready || rt.busy}
          />
          <button className="btn btn--primary" aria-label="Send message" disabled={!ready || rt.busy || !draft.trim()} onClick={submit}>{Icon.send}</button>
        </div>
        <div className="promptbar__meta">
          <span>cli: {st?.cliResolved ? 'override' : 'bundled'}</span>
          {st?.tools && <span>{st.tools.length} tools</span>}
          <span className="faint">runtime: {ready ? 'connected' : 'not connected'}</span>
        </div>
      </div>
    </div>
  );
};

/* ---------- PreviewChat (web preview, file-backed, not wired) ---------- */
const PreviewChat: React.FC = () => (
  <div className="chat">
    <div className="chat__head">
      <span className="brand__mark" style={{ width: 28, height: 28, borderRadius: 8 }}>{Icon.owl}</span>
      <div>
        <div style={{ fontWeight: 600 }}>otto</div>
        <div className="chat__id">runtime not connected · desktop bridge unavailable</div>
      </div>
      <span className="pill pill--warn" style={{ marginLeft: 'auto' }}>preview · not connected</span>
    </div>

    <div className="chat__stream">
      <div className="emptySurface emptySurface--chat">
        <div className="eyebrow">chat</div>
        <h2>No live session in web preview.</h2>
        <p>Open the packaged desktop app to connect to local Letta. This preview does not show fake messages.</p>
      </div>
    </div>

    <div className="promptbar">
      {!isReady && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--warn-tint)',
            border: '1px solid #e7dcc0',
            borderRadius: 8,
            padding: '9px 13px',
            fontSize: 13.5,
            color: 'var(--ink-soft)',
          }}
        >
          <span className="dot dot--warn" />
          <span>
            <strong>Setup required</strong> — Otto is not connected to a runtime ({requiredMissing.length} required items missing). Open <strong>Settings</strong> to configure.
          </span>
        </div>
      )}
      <div className="promptbox promptbox--disabled">
        <input
          placeholder="Chat is not wired to the Letta runtime in this preview"
          aria-label="Chat input (disabled in preview)"
          disabled
          readOnly
        />
        <button className="btn btn--primary" aria-label="Send message" disabled aria-disabled="true">{Icon.send}</button>
      </div>
      <div className="promptbar__meta">
        <span>desktop bridge unavailable</span>
        <span className="faint">runtime: not connected</span>
      </div>
    </div>
  </div>
);
