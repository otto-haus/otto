import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/icons';
import { requiredMissing, isReady } from '../readiness';
import { isElectron, type EffortLevel } from '../runtime';
import { useRuntimeContext } from '../RuntimeContext';
import ottoAvatar from '../assets/otto-avatar.png';

// In Electron (window.otto present) → the runtime-wired LiveChat.
// In the web preview → the file-backed PreviewChat (unchanged).
export const Chat: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) =>
  isElectron() ? <LiveChat onOpenSettings={onOpenSettings} /> : <PreviewChat />;

/* ---------- LiveChat (Electron, wired to the Letta runtime) ---------- */
type QueueItem = { id: string; text: string; createdAt: number };

const MODEL_OPTIONS = [
  { label: 'GPT-5.5 (ChatGPT)', value: 'chatgpt-plus-pro/gpt-5.5' },
  { label: 'GPT-5.5 (Codex)', value: 'openai-codex/gpt-5.5' },
  { label: 'Opus 4.8', value: 'anthropic/claude-opus-4-8' },
  { label: 'Sonnet 4.6', value: 'anthropic/claude-sonnet-4-6' },
  { label: 'Haiku 4.5', value: 'anthropic/claude-haiku-4-5' },
] as const;

const EFFORT_OPTIONS: Array<{ label: string; value: EffortLevel }> = [
  { label: 'Off', value: 'off' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Max', value: 'max' },
];

const labelForModel = (value?: string | null) => MODEL_OPTIONS.find((m) => m.value === value)?.label ?? value ?? 'Agent default';
const labelForEffort = (value?: EffortLevel) => EFFORT_OPTIONS.find((e) => e.value === value)?.label ?? 'Max';

const renderInline = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0];
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    if (raw.startsWith('**')) {
      nodes.push(<strong key={`${index}-b`}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('`')) {
      nodes.push(<code key={`${index}-c`}>{raw.slice(1, -1)}</code>);
    } else {
      const link = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      nodes.push(link ? <a key={`${index}-a`} href={link[2]}>{link[1]}</a> : raw);
    }
    last = index + raw.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  const blocks: React.ReactNode[] = [];
  const parts = text.split(/(```[\s\S]*?```)/g).filter(Boolean);

  parts.forEach((part, partIndex) => {
    if (part.startsWith('```')) {
      const code = part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '').trimEnd();
      blocks.push(<pre className="md__pre" key={`code-${partIndex}`}><code>{code}</code></pre>);
      return;
    }

    const lines = part.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i += 1; continue; }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        const children = renderInline(heading[2]);
        blocks.push(heading[1].length === 1
          ? <h3 className="md__heading" key={`h-${partIndex}-${i}`}>{children}</h3>
          : heading[1].length === 2
            ? <h4 className="md__heading" key={`h-${partIndex}-${i}`}>{children}</h4>
            : <h5 className="md__heading" key={`h-${partIndex}-${i}`}>{children}</h5>);
        i += 1;
        continue;
      }

      const quote = line.match(/^>\s+(.+)$/);
      if (quote) {
        const quoted: string[] = [];
        while (i < lines.length) {
          const q = lines[i].match(/^>\s?(.+)$/);
          if (!q) break;
          quoted.push(q[1]);
          i += 1;
        }
        blocks.push(<blockquote className="md__quote" key={`q-${partIndex}-${i}`}>{quoted.map((q, qi) => <p key={qi}>{renderInline(q)}</p>)}</blockquote>);
        continue;
      }

      const bullet = line.match(/^\s*[-*]\s+(.+)$/);
      if (bullet) {
        const items: string[] = [];
        while (i < lines.length) {
          const b = lines[i].match(/^\s*[-*]\s+(.+)$/);
          if (!b) break;
          items.push(b[1]);
          i += 1;
        }
        blocks.push(<ul className="md__list" key={`ul-${partIndex}-${i}`}>{items.map((item, ii) => <li key={ii}>{renderInline(item)}</li>)}</ul>);
        continue;
      }

      const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (numbered) {
        const items: string[] = [];
        while (i < lines.length) {
          const n = lines[i].match(/^\s*\d+[.)]\s+(.+)$/);
          if (!n) break;
          items.push(n[1]);
          i += 1;
        }
        blocks.push(<ol className="md__list" key={`ol-${partIndex}-${i}`}>{items.map((item, ii) => <li key={ii}>{renderInline(item)}</li>)}</ol>);
        continue;
      }

      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,3})\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !/^>\s+/.test(lines[i])) {
        para.push(lines[i].trim());
        i += 1;
      }
      blocks.push(<p className="md__p" key={`p-${partIndex}-${i}`}>{renderInline(para.join(' '))}</p>);
    }
  });

  return <div className="md">{blocks}</div>;
};

const LiveChat: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const rt = useRuntimeContext();
  const [draft, setDraft] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [effortOpen, setEffortOpen] = useState(false);
  const draining = useRef(false);
  const lastSent = useRef('');
  const st = rt.status;
  const ready = !!st?.ready;
  const selectedModel = st?.modelHandle ?? st?.model ?? null;
  const selectedEffort = st?.effort ?? 'max';

  const submit = () => {
    const t = draft.trim();
    if (!t || !ready) return;
    setQueue((items) => [...items, { id: `${Date.now()}-${items.length}`, text: t, createdAt: Date.now() }]);
    setDraft('');
  };

  useEffect(() => {
    if (!ready || rt.busy || draining.current || queue.length === 0) return;
    const [next] = queue;
    if (!next) return;
    draining.current = true;
    lastSent.current = next.text;
    setQueue((items) => items.slice(1));
    void rt.send(next.text).finally(() => {
      draining.current = false;
    });
  }, [queue, ready, rt]);

  // Error state preserves the user's turn by moving the failed message back to the front of the queue.
  const lastMsg = rt.messages[rt.messages.length - 1];
  useEffect(() => {
    if (lastMsg?.who === 'error' && lastSent.current && !draft) {
      const retryText = lastSent.current;
      setQueue((items) => [{ id: `${Date.now()}-retry`, text: retryText, createdAt: Date.now() }, ...items]);
      lastSent.current = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMsg]);

  return (
    <div className="chat">
      <div className="chat__head">
        <span className="brand__mark brand__mark--avatar" style={{ width: 28, height: 28, borderRadius: 8 }}><img src={ottoAvatar} alt="" /></span>
        <div>
          <div style={{ fontWeight: 600 }}>otto</div>
          <div className="chat__id">
            {st
              ? `${st.agentId ?? 'no agent'} · ${st.model ?? labelForModel(st.modelHandle) ?? 'model unset'}${st.memfsEnabled ? ' · MemFS on' : ''}`
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
            Connected to {st?.agentId ?? 'otto'} — message otto to start a session.
          </div>
        )}
        {rt.messages.map((m, i) => (
          <div key={i} className={`msg${m.who === 'user' ? ' msg--user' : ''}`}>
            <div className="msg__who">{m.who === 'user' ? 'You' : m.who === 'error' ? 'error' : 'otto'}</div>
            <div className="msg__body" style={m.who === 'error' ? { color: 'var(--stop)' } : undefined}><MarkdownText text={m.text} /></div>
          </div>
        ))}
        {rt.busy && <div className="eyebrow">otto is working…</div>}
      </div>

      <div className="promptbar">
        {queue.length > 0 && (
          <div className="queuebar" aria-label="Queued messages">
            <div className="queuebar__head">
              <span className="dot dot--idle" />
              <span>{queue.length} queued</span>
              <button className="queuebar__clear" onClick={() => setQueue([])}>Clear</button>
            </div>
            <div className="queuebar__items">
              {queue.map((item, index) => (
                <div className="queueitem" key={item.id}>
                  <span className="mono faint">{index + 1}</span>
                  <span className="queueitem__text">{item.text}</span>
                  <button
                    className="queueitem__remove"
                    aria-label="Remove queued message"
                    onClick={() => setQueue((items) => items.filter((x) => x.id !== item.id))}
                  >
                    {Icon.x}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={`promptbox${ready ? '' : ' promptbox--disabled'}`}>
          <textarea
            placeholder={ready ? (rt.busy ? 'Queue a follow-up…' : 'Message otto…') : 'Runtime not ready — see Settings'}
            aria-label="Message Otto"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              else if (e.key === 'Escape') { setDraft(''); e.currentTarget.blur(); }
            }}
            disabled={!ready}
          />
          {rt.busy && (
            <button className="btn btn--icon" aria-label="Abort current run" onClick={rt.abort}>{Icon.stop}</button>
          )}
          <button className="btn btn--primary btn--icon" aria-label={rt.busy ? 'Queue message' : 'Send message'} disabled={!ready || !draft.trim()} onClick={submit}>{Icon.send}</button>
        </div>
        <div className="promptControls">
          <div className="picker" data-open={modelOpen ? 'true' : 'false'}>
            <button className="picker__button" onClick={() => { setModelOpen((x) => !x); setEffortOpen(false); }} disabled={rt.busy}>
              <span>{labelForModel(selectedModel)}</span>
              <span className="picker__chev">›</span>
            </button>
            {modelOpen && (
              <div className="picker__menu picker__menu--model">
                <div className="picker__title">Select model</div>
                {MODEL_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    className={`picker__option${selectedModel === m.value ? ' is-selected' : ''}`}
                    onClick={() => {
                      setModelOpen(false);
                      void rt.configure({ modelHandle: m.value });
                    }}
                  >
                    <span>{m.label}</span>
                    <span className="mono faint">{m.value}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="picker" data-open={effortOpen ? 'true' : 'false'}>
            <button className="picker__button picker__button--effort" onClick={() => { setEffortOpen((x) => !x); setModelOpen(false); }} disabled={rt.busy}>
              <span>{labelForEffort(selectedEffort)}</span>
              <span className="effortDots" aria-hidden="true">
                {EFFORT_OPTIONS.slice(1).map((e) => <i key={e.value} data-on={EFFORT_OPTIONS.findIndex((x) => x.value === e.value) <= EFFORT_OPTIONS.findIndex((x) => x.value === selectedEffort) ? 'true' : 'false'} />)}
              </span>
              <span className="picker__chev">›</span>
            </button>
            {effortOpen && (
              <div className="picker__menu picker__menu--effort">
                <div className="picker__title">Reasoning</div>
                {EFFORT_OPTIONS.map((e) => (
                  <button
                    key={e.value}
                    className={`picker__option${selectedEffort === e.value ? ' is-selected' : ''}`}
                    onClick={() => {
                      setEffortOpen(false);
                      void rt.configure({ effort: e.value });
                    }}
                  >
                    <span>{e.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="promptbar__meta">
          <span>cli: {st?.cliResolved ? 'override' : 'bundled'}</span>
          {st?.tools && <span>{st.tools.length} tools</span>}
          <span className="faint">session: {st?.sessionMode === 'smoke' ? 'smoke conversation' : (st?.conversationId ?? 'default')}</span>
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
      <span className="brand__mark brand__mark--avatar" style={{ width: 28, height: 28, borderRadius: 8 }}><img src={ottoAvatar} alt="" /></span>
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
