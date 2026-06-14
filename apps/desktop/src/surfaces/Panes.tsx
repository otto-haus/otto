import type React from 'react';
import { useEffect, useState } from 'react';
import {
  readiness,
  requiredMissing,
  type ReadyItem,
  type ReadyStatus,
} from '../readiness';
import { Icon } from '../components/icons';
import { ottoApi, type RuntimeStatus, type StatusCode } from '../runtime';
import { useRuntimeContext } from '../RuntimeContext';


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

/* ---------- Coming-soon surfaces ---------- */
export const Charters: React.FC = () => (
  <EmptySurface
    eyebrow="charters"
    title="Charters are coming soon."
    body="This surface is not finished yet. For v0.1, otto keeps it empty instead of showing sample contracts."
    next="Soon: real Charter records, status, approvals, and receipts."
  />
);

export const Standards: React.FC = () => (
  <EmptySurface
    eyebrow="standards"
    title="Standards are coming soon."
    body="This surface is not finished yet. otto will show real Standards here once the loader is wired."
    next="Soon: source-backed Standards and the behaviors they govern."
  />
);

export const Practices: React.FC = () => (
  <EmptySurface
    eyebrow="practices"
    title="Practices are coming soon."
    body="This surface is not finished yet. The placeholder Practice list is hidden so v0.1 does not imply these workflows are live."
    next="Soon: approved Practices backed by real files, runs, and receipts."
  />
);

export const Routines: React.FC = () => (
  <EmptySurface
    eyebrow="routines"
    title="Routines are coming soon."
    body="This surface is not finished yet. Repeated bundles of work are not wired into the desktop today."
    next="Soon: real Routine definitions, activation gates, and run history."
  />
);

export const Curation: React.FC = () => (
  <EmptySurface
    eyebrow="curation"
    title="Curation is coming soon."
    body="This surface is not finished yet. The proposal and approval queue is not part of the v0.1 desktop."
    next="Soon: real proposals, approvals, and decisions about what compounds."
  />
);

export const Receipts: React.FC = () => (
  <EmptySurface
    eyebrow="receipts"
    title="Receipts are coming soon."
    body="This surface is not finished yet. Proof and run history are not loaded into the desktop today."
    next="Soon: real receipts mapped to completed work."
  />
);

export const Autonomy: React.FC = () => (
  <EmptySurface
    eyebrow="autonomy"
    title="Autonomy is coming soon."
    body="This surface is not finished yet. Policy visibility is not wired into the desktop today."
    next="Soon: real autonomy boundaries from Standards, approvals, and runtime policy."
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
  const rt = useRuntimeContext();
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
      rt.updateStatus(next);
    } finally {
      setBusy(false);
    }
  };

  const displayStatus = rt.status ?? status;
  const code: StatusCode = displayStatus?.ready ? 'ready' : displayStatus?.code ?? 'error';
  const [cls, label] = codePill[code] ?? ['pill--warn', 'not connected'];

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="eyebrow">connect letta</div>
        <span className={`pill ${cls}`}>{label}</span>
      </div>
      <div className="h-sec" style={{ marginTop: 6 }}>Local Letta connection</div>
      <p className="muted" style={{ marginTop: 4 }}>
        otto tries to discover Letta Desktop and your current local agent automatically. These fields are advanced overrides for the rare case discovery picks the wrong runtime or agent.
      </p>
      {displayStatus && !displayStatus.ready && displayStatus.reason && (
        <p className="faint" style={{ marginTop: 6 }}>↳ {displayStatus.reason}</p>
      )}
      <div className="grid" style={{ gap: 12, marginTop: 12 }}>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Local Letta URL · advanced override</span>
          <input
            style={inputStyle}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://127.0.0.1:51087"
            spellCheck={false}
          />
        </label>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Agent ID · advanced override</span>
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
        <button type="button" className="btn btn--primary" onClick={connect} disabled={busy}>
          {busy ? 'Connecting…' : 'Save overrides & reconnect'}
        </button>
        {displayStatus?.ready && (
          <span className="muted" style={{ fontSize: 13 }}>
            {displayStatus.agentId}
            {displayStatus.baseUrl ? ` · ${displayStatus.baseUrl}` : ''}
            {displayStatus.model ? ` · ${displayStatus.model}` : ''}
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
  <div className="zone" style={{ gridTemplateColumns: '190px minmax(0, 1fr) auto', gap: 16 }}>
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

type ProviderKind = 'local' | 'cloud';
const MODEL_PROVIDERS: Array<{
  kind: ProviderKind;
  name: string;
  detail: string;
  matches: string[];
}> = [
  { kind: 'local', name: 'ChatGPT Plus/Pro (Codex Subscription)', detail: 'Subscription auth and Codex/GPT handles managed by Letta.', matches: ['chatgpt-plus-pro', 'openai-codex'] },
  { kind: 'local', name: 'Anthropic', detail: 'Claude API keys managed by Letta.', matches: ['anthropic/claude'] },
  { kind: 'local', name: 'Anthropic (Claude Pro/Max)', detail: 'Subscription auth managed by Letta.', matches: ['claude-pro-max'] },
  { kind: 'local', name: 'OpenAI', detail: 'OpenAI API keys managed by Letta.', matches: ['openai/'] },
  { kind: 'cloud', name: 'Amazon Bedrock', detail: 'AWS Bedrock credentials live in Letta.', matches: ['bedrock/', 'amazon-bedrock'] },
  { kind: 'cloud', name: 'Azure OpenAI Responses', detail: 'Azure endpoint and key live in Letta.', matches: ['azure-openai'] },
  { kind: 'cloud', name: 'Cloudflare AI Gateway', detail: 'Cloudflare gateway credentials live in Letta.', matches: ['cloudflare'] },
  { kind: 'cloud', name: 'DeepSeek', detail: 'DeepSeek API key lives in Letta.', matches: ['deepseek'] },
  { kind: 'cloud', name: 'Cerebras', detail: 'Cerebras API key lives in Letta.', matches: ['cerebras'] },
  { kind: 'cloud', name: 'Fireworks', detail: 'Fireworks API key lives in Letta.', matches: ['fireworks'] },
];

const ModelProviders: React.FC = () => {
  const api = ottoApi();
  const rt = useRuntimeContext();
  const [tab, setTab] = useState<ProviderKind>('local');
  const activeModel = `${rt.status?.modelHandle ?? ''} ${rt.status?.model ?? ''}`.toLowerCase();
  const openLetta = () => void api?.runtime.openLetta();
  const rows = MODEL_PROVIDERS.filter((p) => p.kind === tab);

  return (
    <div className="providersScreen">
      <div className="panel providersHero">
        <div>
          <div className="eyebrow">model providers</div>
          <div className="h-sec" style={{ marginTop: 6 }}>Managed in Letta, selected in otto</div>
          <p className="muted" style={{ marginTop: 6 }}>
            otto does not collect provider keys. Connect providers in Letta, then choose model and effort from the chat composer.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openLetta}>Open Letta</button>
      </div>

      <div className="segmented" role="tablist" aria-label="Provider type">
        <button type="button" className={tab === 'local' ? 'is-active' : ''} onClick={() => setTab('local')}>Local</button>
        <button type="button" className={tab === 'cloud' ? 'is-active' : ''} onClick={() => setTab('cloud')}>Cloud</button>
      </div>

      <div className="providerList">
        {rows.map((provider) => {
          const active = provider.matches.some((m) => activeModel.includes(m));
          return (
            <div className="providerRow" key={provider.name}>
              <div className="providerRow__glyph">{active ? <span className="dot dot--ok" /> : Icon.lock}</div>
              <div>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <strong>{provider.name}</strong>
                  <span className={`pill ${active ? 'pill--ok' : ''}`}>{active ? 'active model' : 'managed in Letta'}</span>
                </div>
                <p className="muted" style={{ marginTop: 4 }}>{provider.detail}</p>
              </div>
              <button type="button" className="btn" onClick={openLetta}>{active ? 'Manage' : 'Connect'}</button>
            </div>
          );
        })}
      </div>

      <p className="faint mono" style={{ fontSize: 11.5 }}>
        Current model: {rt.status?.model ?? rt.status?.modelHandle ?? 'not connected'} · Provider connection status is intentionally not guessed.
      </p>
    </div>
  );
};

export const Settings: React.FC = () => {
  const rt = useRuntimeContext();
  const [section, setSection] = useState<'general' | 'providers'>('general');
  // Live runtime is the source of truth in Electron; the file-backed checklist describes local
  // config only. Never let the readiness panel say "Setup required" while the runtime is connected.
  const liveConnected = rt.electron && !!rt.status?.ready;
  const ready = liveConnected || requiredMissing.length === 0;
  const group = (keys: string[]) => readiness.filter((r) => keys.includes(r.key));

  return (
    <div className="settingsShell">
      <aside className="settingsNav" aria-label="Settings sections">
        <button type="button" className={section === 'general' ? 'is-active' : ''} onClick={() => setSection('general')}>
          {Icon.settings}<span>General</span>
        </button>
        <button type="button" className={section === 'providers' ? 'is-active' : ''} onClick={() => setSection('providers')}>
          {Icon.lock}<span>Model providers</span>
        </button>
      </aside>

      {section === 'providers' ? (
        <ModelProviders />
      ) : (
        <div className="grid" style={{ maxWidth: 880, gap: 16 }}>
          <ConnectLetta />
          <div className="panel" style={ready ? undefined : { borderColor: '#e7dcc0', background: 'var(--warn-tint)' }}>
            <div className="eyebrow">readiness</div>
            <div className="h-sec" style={{ marginTop: 6 }}>
              {liveConnected
                ? `Connected — ${rt.status?.agentId ?? 'agent'}${rt.status?.model ? ` · ${rt.status.model}` : ''}`
                : ready
                  ? 'otto is ready to work'
                  : 'Setup required — otto is not ready to work'}
            </div>
            {liveConnected ? (
              <p className="muted" style={{ marginTop: 6 }}>
                Live Letta runtime connected. The file-backed checks below describe local config only; runtime and agent may have been discovered from Letta settings.
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
            v1 is local-only: otto connects to a local Letta runtime. Cloud/self-host auth can come later as an advanced path.
          </p>
        </div>
      )}
    </div>
  );
};
