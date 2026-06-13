import React, { useState } from 'react';
import { Icon } from '../components/icons';
import { agent, requiredMissing, isReady } from '../sampleData';
import { isElectron, useRuntime } from '../runtime';

// In Electron (window.otto present) → the runtime-wired LiveChat.
// In the web preview → the file-backed PreviewChat (unchanged).
export const Chat: React.FC = () => (isElectron() ? <LiveChat /> : <PreviewChat />);

/* ---------- LiveChat (Electron, wired to the Letta runtime) ---------- */
const LiveChat: React.FC = () => {
  const rt = useRuntime();
  const [draft, setDraft] = useState('');
  const st = rt.status;
  const ready = !!st?.ready;

  const submit = () => {
    const t = draft.trim();
    if (t && ready && !rt.busy) {
      rt.send(t);
      setDraft('');
    }
  };

  return (
    <div className="chat">
      <div className="chat__head">
        <span className="brand__mark" style={{ width: 28, height: 28, borderRadius: 8 }}>{Icon.owl}</span>
        <div>
          <div style={{ fontWeight: 600 }}>Otto</div>
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
            </div>
          </div>
        )}
        {rt.messages.map((m, i) => (
          <div key={i} className={`msg${m.who === 'user' ? ' msg--user' : ''}`}>
            <div className="msg__who">{m.who === 'user' ? 'Sebastian' : m.who === 'error' ? 'error' : 'Otto'}</div>
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
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            disabled={!ready || rt.busy}
          />
          <button className="btn btn--primary" disabled={!ready || rt.busy || !draft.trim()} onClick={submit}>{Icon.send}</button>
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
        <div style={{ fontWeight: 600 }}>{agent.name}</div>
        <div className="chat__id">{agent.id} · runtime not connected · sample data</div>
      </div>
      <span className="pill pill--warn" style={{ marginLeft: 'auto' }}>preview · not connected</span>
    </div>

    <div className="chat__stream">
      <div className="eyebrow" style={{ textAlign: 'center' }}>sample session · not live</div>

      <div className="msg msg--user">
        <div className="msg__who">Sebastian</div>
        <div className="msg__body">Ship Otto v0.1 — rename, prove every feature, demo it. Stay local until I approve.</div>
      </div>

      <div className="msg">
        <div className="msg__who"><span className="brand__mark" style={{ width: 16, height: 16, borderRadius: 5 }}>{Icon.owl}</span> Otto</div>
        <div className="msg__body">
          Compiling that into a Charter. AC1 — rename to <code>@otto-haus</code> and keep tests green.
          AC2 — public README, eight feature demos, receipts. I'll gate the push behind your approval.
        </div>
      </div>

      <div className="toolcard">
        <div className="toolcard__top"><span className="dot dot--ok" /> tool · <strong>bun test</strong> <span className="faint">— packages/practices</span></div>
        <div className="toolcard__out">6 pass · 0 fail · 7 expect() calls
Ran 6 tests across 1 file. [43.00ms]</div>
      </div>

      <div className="msg">
        <div className="msg__who"><span className="brand__mark" style={{ width: 16, height: 16, borderRadius: 5 }}>{Icon.owl}</span> Otto</div>
        <div className="msg__body">AC1 is green. Next step pushes the branch to <code>otto-haus/otto</code> — that's a one-way door, so I'm stopping to ask.</div>
      </div>

      <div className="inkblock">
        <div className="inkblock__eyebrow"><span className="dot dot--warn" /> approval required · one-way door</div>
        <div className="inkblock__title">Push branch to <code style={{ color: 'inherit' }}>otto-haus/otto</code></div>
        <div className="inkblock__meta">
          <span>scope: git:push:otto-haus/otto:letta/otto-v01-integration</span>
          <span>requirement: external-side-effects · expires in 24h</span>
          <span>evidence: tests green · 8 demos rendered · RELEASE_CHECKLIST.md</span>
        </div>
        <div className="inkblock__actions">
          <button className="btn btn--solid-d" disabled aria-disabled="true">Approve push</button>
          <button className="btn btn--ghost-d" disabled aria-disabled="true">Deny</button>
          <span className="mono" style={{ color: 'var(--dark-mut)', fontSize: 12, alignSelf: 'center' }}>preview — not wired</span>
        </div>
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
        <button className="btn btn--primary" disabled aria-disabled="true">{Icon.send}</button>
      </div>
      <div className="promptbar__meta">
        <span>cwd: {agent.cwd}</span>
        <span>backend: {agent.backend}</span>
        <span className="faint">runtime: not connected</span>
      </div>
    </div>
  </div>
);
