import React, { useEffect, useState } from 'react';
import type { PracticeSpec } from '@otto-haus/core';
import practicesData from '../data/practices.json';
import {
  readiness,
  requiredMissing,
  type ReadyItem,
  type ReadyStatus,
} from '../readiness';
import { Icon } from '../components/icons';
import { ottoApi, type RuntimeStatus, type StatusCode } from '../runtime';
import { useRuntimeContext } from '../RuntimeContext';

const practices = practicesData as PracticeSpec[];

const statusPill = (s: string) => {
  const cls = s === 'active' || s === 'success' || s === 'complete' ? 'pill--ok'
    : s === 'blocked' || s === 'pending' ? 'pill--warn'
    : s === 'proposed' || s === 'running' || s === 'draft' ? 'pill--info' : '';
  return <span className={`pill ${cls}`}>{s}</span>;
};

const EmptySurface: React.FC<{
  eyebrow: string;
  title: string;
  body: string;
  path?: string;
  next?: string;
}> = ({ eyebrow, title, body, path, next }) => (
  <div className="emptySurface">
    <div className="eyebrow">{eyebrow}</div>
    <h2>{title}</h2>
    <p>{body}</p>
    {path && <span className="filechip">{Icon.file} {path}</span>}
    {next && <div className="notice"><span className="dot dot--idle" /> {next}</div>}
  </div>
);

/* ---------- Charters ---------- */
export const Charters: React.FC = () => (
  <EmptySurface
    eyebrow="charters"
    title="No live Charter store is wired yet."
    body="This pane will read durable operating contracts from Otto's file/runtime store. It is intentionally empty until that loader exists."
    path="~/.otto/charters/"
    next="Wire real Charter records; do not show example contracts."
  />
);

/* ---------- Standards ---------- */
export const Standards: React.FC = () => (
  <EmptySurface
    eyebrow="standards"
    title="Standards exist in repo canon, but this pane has no loader yet."
    body="The desktop should show real Markdown/YAML Standards from the repo/runtime, not a recreated list. Until then this stays empty."
    path="standards/*.md"
    next="Add a generated standards.json or v2 runtime view export."
  />
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
  <EmptySurface
    eyebrow="routines"
    title="No live Routines are wired yet."
    body="This pane will show repeatable bundles only after Otto can read real routine files."
    path="routines/"
    next="Wire routine.yaml loading; no sample morning routine."
  />
);

/* ---------- Curation (proposals + approvals) ---------- */
export const Curation: React.FC = () => (
  <EmptySurface
    eyebrow="curation"
    title="No live proposals or approvals are wired yet."
    body="Curation should display real Proposal / Classification / Approval records from the runtime, not fabricated pending gates."
    path="~/.otto/curation/"
    next="Bind to v2 export-view or runtime JSON store after the human ink moment is designed."
  />
);

/* ---------- Receipts (runs + proof) ---------- */
export const Receipts: React.FC = () => (
  <EmptySurface
    eyebrow="receipts"
    title="No live receipts are wired yet."
    body="Runs and receipts should come from real JSONL/runtime records. Empty is more honest than a fake proof trail."
    path="~/.otto/runs/"
    next="Parse real trace files or consume v2 ReceiptRecord exports."
  />
);

/* ---------- Autonomy ---------- */
export const Autonomy: React.FC = () => (
  <EmptySurface
    eyebrow="autonomy"
    title="No live autonomy policy is wired yet."
    body="This pane should read explicit policy from Standards/Curation, not show hardcoded green/yellow/red examples."
    path="standards/ · ~/.otto/curation/"
    next="Wire policy from canonical files after Standards loading exists."
  />
);

/* ---------- Connect Letta (live setup) ---------- */
const codePill: Record<StatusCode, [string, string]> = {
  ready: ['pill--ok', 'connected'],
  'no-api-key': ['pill--warn', 'auth needed'],
  'no-agent': ['pill--warn', 'needs agent'],
  unreachable: ['pill--warn', 'unreachable'],
  'sdk-missing': ['pill--warn', 'SDK missing'],
  stale: ['pill--warn', 'stale session'],
  error: ['pill--warn', 'not connected'],
};

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13.5,
  background: 'var(--panel)',
  color: 'var(--ink)',
  width: '100%',
  marginTop: 4,
};

const ConnectLetta: React.FC = () => {
  const api = ottoApi();
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [agentId, setAgentId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    api.connection.get().then((c) => {
      setBaseUrl(c.baseUrl ?? '');
      setAgentId(c.agentId ?? '');
    });
    api.runtime.status().then(setStatus).catch(() => {});
  }, [api]);

  if (!api) {
    return (
      <div className="panel">
        <div className="eyebrow">connect letta</div>
        <div className="h-sec" style={{ marginTop: 6 }}>Connect Letta</div>
        <p className="muted" style={{ marginTop: 6 }}>
Local Letta URL and Agent ID are set here in the desktop app — this is the web preview.
          For v1, Otto connects to a local Letta runtime. Model/provider keys stay in Letta.
        </p>
      </div>
    );
  }

  const connect = async () => {
    setBusy(true);
    try {
      const next = await api.connection.save({
        baseUrl: baseUrl.trim() || null,
        agentId: agentId.trim() || null,
      });
      setStatus(next);
    } finally {
      setBusy(false);
    }
  };

  const code: StatusCode = status?.ready ? 'ready' : status?.code ?? 'error';
  const [cls, label] = codePill[code] ?? ['pill--warn', 'not connected'];

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="eyebrow">connect letta</div>
        <span className={`pill ${cls}`}>{label}</span>
      </div>
      <div className="h-sec" style={{ marginTop: 6 }}>Connect local Letta</div>
      <p className="muted" style={{ marginTop: 4 }}>
        Point Otto at your local Letta runtime and agent. Local Letta owns provider auth; Otto does not ask for an API key in v1.
      </p>
      {status && !status.ready && status.reason && (
        <p className="faint" style={{ marginTop: 6 }}>↳ {status.reason}</p>
      )}
      <div className="grid" style={{ gap: 12, marginTop: 12 }}>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Local Letta URL</span>
          <input
            style={inputStyle}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://127.0.0.1:51087"
            spellCheck={false}
          />
        </label>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Agent ID</span>
          <input
            className="mono"
            style={inputStyle}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="agent-..."
            spellCheck={false}
          />
        </label>
      </div>
      <div className="row" style={{ marginTop: 14, gap: 12, alignItems: 'center' }}>
        <button className="btn btn--primary" onClick={connect} disabled={busy}>
          {busy ? 'Connecting…' : 'Save & Connect'}
        </button>
        {status?.ready && (
          <span className="muted" style={{ fontSize: 13 }}>
            {status.agentId}
            {status.model ? ` · ${status.model}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};

/* ---------- Settings (Setup + Readiness) ---------- */
const readyPill = (s: ReadyStatus) => {
  const map: Record<ReadyStatus, [string, string]> = {
    connected: ['pill--ok', 'connected'],
    configured: ['pill--ok', 'configured'],
    file: ['pill', 'file-backed'],
    missing: ['pill--warn', 'missing'],
    'not-wired': ['pill', 'not wired'],
  };
  const [cls, label] = map[s];
  return <span className={`pill ${cls}`}>{label}</span>;
};

const ReadyRow: React.FC<{ item: ReadyItem }> = ({ item }) => (
  <div className="zone" style={{ gridTemplateColumns: '190px 1fr auto', gap: 16 }}>
    <span style={{ fontWeight: 600, fontSize: 14 }}>
      {item.label}
      {item.required && <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}> · required</span>}
    </span>
    <div>
      <div className="muted" style={{ fontSize: 13.5 }}>{item.detail}</div>
      {item.source && <span className="filechip" style={{ marginTop: 6 }}>{Icon.file} {item.source}</span>}
      <div className="faint mono" style={{ fontSize: 11.5, marginTop: 6 }}>↳ {item.action}</div>
    </div>
    {readyPill(item.status)}
  </div>
);

export const Settings: React.FC = () => {
  const rt = useRuntimeContext();
  // Live runtime is the source of truth in Electron; the file-backed checklist describes local
  // config only. Never let the readiness panel say "Setup required" while the runtime is connected.
  const liveConnected = rt.electron && !!rt.status?.ready;
  const ready = liveConnected || requiredMissing.length === 0;
  const group = (keys: string[]) => readiness.filter((r) => keys.includes(r.key));
  return (
    <div className="grid" style={{ maxWidth: 880, gap: 16 }}>
      <ConnectLetta />
      <div className="panel" style={ready ? undefined : { borderColor: '#e7dcc0', background: 'var(--warn-tint)' }}>
        <div className="eyebrow">readiness</div>
        <div className="h-sec" style={{ marginTop: 6 }}>
          {liveConnected
            ? `Connected — ${rt.status?.agentId ?? 'agent'}${rt.status?.model ? ` · ${rt.status.model}` : ''}`
            : ready
              ? 'Otto is ready to work'
              : 'Setup required — Otto is not ready to work'}
        </div>
        {liveConnected ? (
          <p className="muted" style={{ marginTop: 6 }}>
            Live Letta runtime connected. The file-backed checks below describe local config only.
          </p>
        ) : (
          !ready && (
            <p className="muted" style={{ marginTop: 6 }}>
              {requiredMissing.length} required {requiredMissing.length === 1 ? 'item' : 'items'} missing:{' '}
              {requiredMissing.map((r) => r.label).join(' · ')}. Configure them below — until then, Chat is disabled.
            </p>
          )
        )}
      </div>
      <div className="panel">
        <div className="eyebrow">runtime &amp; identity</div>
        <div style={{ marginTop: 4 }}>
          {group(['runtime', 'agent', 'model', 'memory', 'workspace']).map((r) => <ReadyRow key={r.key} item={r} />)}
        </div>
      </div>
      <div className="panel">
        <div className="eyebrow">capabilities</div>
        <div style={{ marginTop: 4 }}>
          {group(['skills', 'practices', 'mcp', 'functions', 'permissions']).map((r) => <ReadyRow key={r.key} item={r} />)}
        </div>
      </div>
      <p className="faint mono" style={{ fontSize: 11.5 }}>
        v1 is local-only: Otto connects to a local Letta runtime. Cloud/self-host auth can come later as an advanced path.
      </p>
    </div>
  );
};
