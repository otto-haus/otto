import React from 'react';
import { Icon } from '../components/icons';
import { agent } from '../sampleData';

export const Chat: React.FC = () => (
  <div className="chat">
    <div className="chat__head">
      <span className="brand__mark" style={{ width: 28, height: 28, borderRadius: 8 }}>{Icon.owl}</span>
      <div>
        <div style={{ fontWeight: 600 }}>{agent.name}</div>
        <div className="chat__id">{agent.id} · {agent.model} · MemFS on</div>
      </div>
      <span className="pill pill--info" style={{ marginLeft: 'auto' }}>prototype shell</span>
    </div>

    <div className="chat__stream">
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

      {/* the ink moment — one critical state, inverted block */}
      <div className="inkblock">
        <div className="inkblock__eyebrow"><span className="dot dot--warn" /> approval required · one-way door</div>
        <div className="inkblock__title">Push branch to <code style={{ color: 'inherit' }}>otto-haus/otto</code></div>
        <div className="inkblock__meta">
          <span>scope: git:push:otto-haus/otto:letta/otto-v01-integration</span>
          <span>requirement: external-side-effects · expires in 24h</span>
          <span>evidence: tests green · 8 demos rendered · RELEASE_CHECKLIST.md</span>
        </div>
        <div className="inkblock__actions">
          <button className="btn btn--solid-d">Approve push</button>
          <button className="btn btn--ghost-d">Deny</button>
          <button className="btn btn--ghost-d">Open receipts</button>
        </div>
      </div>
    </div>

    <div className="promptbar">
      <div className="promptbox promptbox--disabled">
        <input
          placeholder="Chat is not wired to the Letta runtime in this preview"
          aria-label="Chat input (disabled in preview)"
          disabled
        />
        <button className="btn btn--primary" disabled aria-disabled="true">{Icon.send}</button>
      </div>
      <div className="promptbar__meta">
        <span>cwd: {agent.cwd}</span>
        <span>backend: {agent.backend}</span>
        <span className="notice"><span className="dot dot--warn" /> preview shell — chat is disabled; not wired to the Letta runtime</span>
      </div>
    </div>
  </div>
);
