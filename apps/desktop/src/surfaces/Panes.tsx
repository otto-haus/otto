import React, { useState } from 'react';
import type { PracticeSpec } from '@otto-do/core';
import practicesData from '../data/practices.json';
import { mockRuns, mockApprovals } from '../mockData';
import {
  sampleCharters,
  standards,
  precedents,
  antiPatterns,
  sampleRoutines,
  autonomyZones,
  agent,
} from '../sampleData';
import { Icon } from '../components/icons';

const practices = practicesData as PracticeSpec[];

const statusPill = (s: string) => {
  const cls = s === 'active' || s === 'success' || s === 'complete' ? 'pill--ok'
    : s === 'blocked' || s === 'pending' ? 'pill--warn'
    : s === 'proposed' || s === 'running' || s === 'draft' ? 'pill--info' : '';
  return <span className={`pill ${cls}`}>{s}</span>;
};

/* ---------- Charters ---------- */
export const Charters: React.FC = () => (
  <div className="cards" style={{ maxWidth: 820 }}>
    {sampleCharters.map((c) => (
      <div className="panel" key={c.slug}>
        <div className="between">
          <div className="h-sec">{c.title}</div>
          {statusPill(c.status)}
        </div>
        <p className="lede" style={{ marginTop: 6 }}>{c.intent}</p>
        <div className="grid" style={{ marginTop: 14, gap: 8 }}>
          {c.acceptance.map((ac) => (
            <div className="row" key={ac.id}>
              <span style={{ color: ac.done ? 'var(--ok)' : 'var(--faint)' }}>
                {ac.done ? Icon.check : Icon.lock}
              </span>
              <span className="mono faint" style={{ fontSize: 12 }}>{ac.id}</span>
              <span style={{ color: ac.done ? 'var(--ink)' : 'var(--mut)' }}>{ac.text}</span>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 14, gap: 10 }}>
          <span className="filechip">{Icon.file} {c.root}</span>
          <span className="pill">{c.receipts} receipts</span>
        </div>
      </div>
    ))}
  </div>
);

/* ---------- Standards ---------- */
export const Standards: React.FC = () => (
  <div className="grid" style={{ maxWidth: 920, gap: 16 }}>
    <div className="panel">
      <div className="eyebrow">authority stack</div>
      <p className="mono" style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
        Sebastian → Standards → Curation → [Practices · Routines · Charters · Channels · Memory]
      </p>
      <p className="muted" style={{ marginTop: 8 }}>
        Standards changes require a human. <code>auto_apply: false</code> — Curation may propose, only Sebastian ratifies.
      </p>
    </div>
    <div className="panel">
      <div className="h-sec">The v0 canon</div>
      <div className="cards" style={{ marginTop: 12 }}>
        {standards.map((s) => (
          <div className="card" key={s.slug} style={{ cursor: 'default' }}>
            <div className="between">
              <span className="card__title">{s.name}</span>
              <span className="filechip">{Icon.file} standards/{s.slug}.md</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid--2">
      <div className="panel">
        <div className="eyebrow">precedents · case law</div>
        {precedents.map((p) => (
          <div className="filechip" key={p.slug} style={{ marginTop: 10 }}>{Icon.file} {p.name}</div>
        ))}
      </div>
      <div className="panel">
        <div className="eyebrow">anti-patterns</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {antiPatterns.map((a) => <span className="pill pill--stop" key={a}>{a}</span>)}
        </div>
      </div>
    </div>
  </div>
);

/* ---------- Practices (real data) ---------- */
export const Practices: React.FC = () => {
  const [slug, setSlug] = useState(practices[0]?.slug ?? '');
  const sel = practices.find((p) => p.slug === slug) ?? practices[0];
  return (
    <div className="split">
      <div className="cards">
        {practices.map((p) => (
          <button
            key={p.slug}
            className={`card${p.slug === sel?.slug ? ' is-selected' : ''}`}
            onClick={() => setSlug(p.slug)}
          >
            <div className="between">
              <span className="card__title">{p.name}</span>
              {statusPill(p.status)}
            </div>
            <span className="card__sub">{p.summary}</span>
          </button>
        ))}
      </div>
      {sel && (
        <div className="detail">
          <div className="panel">
            <div className="between">
              <div className="h-sec">{sel.name}</div>
              {statusPill(sel.status)}
            </div>
            <p className="lede" style={{ marginTop: 6 }}>{sel.summary}</p>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {sel.invocations?.map((i) => <span className="filechip" key={i}>{i}</span>)}
            </div>
          </div>
          <div className="grid grid--2">
            <div className="panel">
              <div className="eyebrow">guardrails</div>
              <ul className="list">{sel.guardrails?.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
            <div className="panel">
              <div className="eyebrow">evidence standard</div>
              <ul className="list">{sel.evidence_standard?.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">approval floor · cannot be bypassed</div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {sel.approval_required_for?.map((a) => <span className="pill pill--warn" key={a}>{a}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Routines ---------- */
export const Routines: React.FC = () => (
  <div className="cards" style={{ maxWidth: 820 }}>
    {sampleRoutines.map((r) => (
      <div className="panel" key={r.slug}>
        <div className="between">
          <div className="h-sec">{r.name}</div>
          {statusPill(r.status)}
        </div>
        <div className="grid" style={{ marginTop: 12, gap: 8 }}>
          {r.steps.map((s, i) => (
            <div className="row" key={i} style={{ gap: 12 }}>
              <span className="mono faint" style={{ fontSize: 12, minWidth: 18 }}>{i + 1}</span>
              <span className="filechip">{s.invocation}</span>
              <span className="muted" style={{ fontSize: 13 }}>{s.note}</span>
            </div>
          ))}
        </div>
        {r.recurring && (
          <div className="notice" style={{ marginTop: 14 }}>
            <span className="dot dot--warn" /> recurring activation is a standing claim on attention — requires approval
          </div>
        )}
      </div>
    ))}
  </div>
);

/* ---------- Curation (proposals + approvals) ---------- */
export const Curation: React.FC = () => (
  <div className="grid" style={{ maxWidth: 820, gap: 14 }}>
    <p className="lede">Curation decides what compounds. Consequential proposals become Approvals — human-ratification records. {mockApprovals.length} pending.</p>
    {mockApprovals.map((a) => (
      <div className="panel" key={a.id}>
        <div className="between">
          <div className="h-sec" style={{ fontSize: 15 }}>{a.requested_action}</div>
          {statusPill(a.status)}
        </div>
        <div className="kv" style={{ marginTop: 12, gridTemplateColumns: 'repeat(2,1fr)', display: 'grid', gap: 12 }}>
          <div><div className="k">scope</div><div className="v mono" style={{ fontSize: 12.5 }}>{a.scope}</div></div>
          <div><div className="k">requirement</div><div className="v mono" style={{ fontSize: 12.5 }}>{a.requirement}</div></div>
          <div style={{ gridColumn: '1 / -1' }}><div className="k">evidence required</div><div className="v">{a.evidence_required}</div></div>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 14 }}>
          <button className="btn btn--primary">Approve</button>
          <button className="btn">Deny</button>
          <span className="pill" style={{ marginLeft: 'auto' }}>expires {new Date(a.expires_at).toLocaleDateString()}</span>
        </div>
      </div>
    ))}
  </div>
);

/* ---------- Receipts (runs + proof) ---------- */
export const Receipts: React.FC = () => (
  <div className="grid" style={{ maxWidth: 820, gap: 12 }}>
    <p className="lede">Runs and their proof. No artifact, no progress.</p>
    {mockRuns.map((r) => (
      <div className="panel" key={r.id}>
        <div className="between">
          <div className="row" style={{ gap: 10 }}>
            <span className="filechip">{r.invocation}</span>
            <span className="mono faint" style={{ fontSize: 12 }}>{r.id}</span>
          </div>
          {statusPill(r.status)}
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 14 }}>{r.summary}</p>
        {r.receipts.length > 0 && (
          <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {r.receipts.map((rc) => (
              <span className="filechip" key={rc.id}>{Icon.file} {rc.ref} → {(rc.proves ?? []).join(', ')}</span>
            ))}
          </div>
        )}
        {r.gate_decisions.length > 0 && (
          <div className="notice" style={{ marginTop: 10 }}>
            <span className="dot dot--warn" /> gated: {r.gate_decisions[0].requirement} → {r.gate_decisions[0].status}
          </div>
        )}
      </div>
    ))}
  </div>
);

/* ---------- Autonomy ---------- */
export const Autonomy: React.FC = () => (
  <div className="grid" style={{ maxWidth: 820, gap: 16 }}>
    <div className="panel">
      <div className="eyebrow">three-zone model</div>
      <div style={{ marginTop: 6 }}>
        {autonomyZones.map((z) => (
          <div className="zone" key={z.tag}>
            <span className={`zone__tag zone__tag--${z.cls}`}>{z.tag}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{z.label}</div>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{z.examples}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="panel">
      <div className="eyebrow">ticketcraft</div>
      <p className="muted" style={{ marginTop: 8 }}>
        <code>/ticket</code> compiles messy work into a bounded packet: allowed files, acceptance, a verify command, and the one-way doors that must escalate. Main Otto orchestrates; workers execute; receipts prove it.
      </p>
    </div>
  </div>
);

/* ---------- Settings ---------- */
export const Settings: React.FC = () => (
  <div className="grid" style={{ maxWidth: 720, gap: 16 }}>
    <div className="panel">
      <div className="eyebrow">runtime</div>
      <div className="kv" style={{ marginTop: 12 }}>
        <div><div className="k">runtime root</div><div className="v mono">~/.otto <span className="faint">(OTTO_HOME · falls back to VINNY_HOME)</span></div></div>
        <div><div className="k">agent</div><div className="v mono">{agent.id} · {agent.backend} backend</div></div>
        <div><div className="k">model</div><div className="v mono">{agent.model}</div></div>
        <div><div className="k">memory</div><div className="v">MemFS enabled (Letta)</div></div>
      </div>
    </div>
    <div className="panel">
      <div className="eyebrow">letta connection</div>
      <p className="muted" style={{ marginTop: 8 }}>
        v0.1 preview reads file-backed state. Live runtime (stream, tools, permission gates) wires through
        <code> @letta-ai/letta-code-sdk</code> in a later phase.
      </p>
      <span className="pill pill--info" style={{ marginTop: 10 }}>not yet connected</span>
    </div>
  </div>
);
