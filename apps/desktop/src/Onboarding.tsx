import type React from 'react';
import { useState } from 'react';
import { useRuntimeContext } from './RuntimeContext';
import type { SurfaceId } from './components/Sidebar';

// First-run onboarding (desktop): Welcome → Connect → First run.
// Driven by REAL state (prove-then-proceed) — never implies connected/ready before it is.

const KEY = 'otto.onboarded.v1';
const wasOnboarded = () => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};
const markOnboarded = () => {
  try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
};

const Dots: React.FC<{ at: number }> = ({ at }) => (
  <div className="onboardDots">
    {[0, 1, 2].map((i) => (
      <span key={i} className={`onboardDot${i === at ? ' is-active' : ''}`} />
    ))}
  </div>
);

export const Onboarding: React.FC<{ onNavigate: (id: SurfaceId) => void }> = ({ onNavigate }) => {
  const rt = useRuntimeContext();
  const [dismissed, setDismissed] = useState(wasOnboarded);
  const [started, setStarted] = useState(false);

  if (!rt.electron || dismissed) return null;

  const connected = !!rt.status?.ready;
  const hasRun = rt.messages.length > 0;

  const finish = () => { markOnboarded(); setDismissed(true); };

  const step: 'welcome' | 'connect' | 'run' =
    !started && !connected && !hasRun ? 'welcome' : connected ? 'run' : 'connect';

  if (step === 'welcome') {
    return (
      <div className="onboardOverlay">
        <div className="onboardCard">
          <div className="onboardEyebrow onboardEyebrow--dark">otto</div>
          <h2 className="onboardTitle" style={{ color: '#fff' }}>
            The behavior layer for persistent agents.
          </h2>
          <p className="onboardBody" style={{ maxWidth: '46ch' }}>
            otto records what your agent relied on before it acted — and changes the next run only when you ratify it.
          </p>
          <div style={{ fontSize: 13.5, color: '#C9CACE', marginTop: 22, fontWeight: 500 }}>
            The human ratifies. otto records the proof.
          </div>
          <div className="onboardActions">
            <button type="button" className="btn btn--solid-d" onClick={() => { setStarted(true); onNavigate('settings'); }}>
              Connect local Letta →
            </button>
            <button type="button" className="btn btn--ghost-d" onClick={() => { setStarted(true); onNavigate('receipts'); }}>
              See what Receipts will prove
            </button>
            <button type="button" className="btn btn--ghost-d" style={{ marginLeft: 'auto', border: 0, color: '#9D9EA2' }} onClick={finish}>
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isConnect = step === 'connect';
  return (
    <div className="onboardDock">
      <div className="between" style={{ marginBottom: 10 }}>
        <span className="onboardEyebrow onboardEyebrow--light">Getting started</span>
        <Dots at={isConnect ? 1 : 2} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
        {isConnect ? 'Connect otto to your local Letta' : "You're connected — run your first message"}
      </div>
      <p className="onboardBody onboardBody--light" style={{ marginTop: 8 }}>
        {isConnect
          ? 'otto tries to discover Letta Desktop and your current local agent automatically. Use Settings only for advanced overrides; Chat unlocks the moment otto is truly connected.'
          : 'Send otto a first message and watch it do real work. Your first Receipt will appear once work completes with proof.'}
      </p>
      <div className="onboardActions" style={{ marginTop: 16 }}>
        {isConnect
          ? <button type="button" className="btn btn--primary" onClick={() => onNavigate('settings')}>Open Settings</button>
          : <button type="button" className="btn btn--primary" onClick={() => onNavigate('chat')}>Go to Chat</button>}
        <button type="button" className="btn" onClick={finish}>{hasRun ? 'Done' : 'Skip'}</button>
      </div>
    </div>
  );
};
