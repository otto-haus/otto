import type React from 'react';
import { useState } from 'react';
import { useRuntimeContext } from './RuntimeContext';
import type { SurfaceId } from './components/Sidebar';

// First-run onboarding (desktop): Welcome → Connect → First run.
// Driven by REAL state (prove-then-proceed) — never implies connected/ready before it is.
// Implements the flow in `otto-onboarding.md`. No CSS-file changes (brand hex, self-contained).

const KEY = 'otto.onboarded.v1';
const wasOnboarded = () => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};
const markOnboarded = () => {
  try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
};

const MONO = 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace';

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center',
  background: 'rgba(15,16,20,0.55)', backdropFilter: 'blur(3px)',
};
const inkCard: React.CSSProperties = {
  background: '#0F1014', border: '1px solid #2C2E32', borderRadius: 18,
  padding: '34px 36px', maxWidth: 520, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.6)',
};
const dock: React.CSSProperties = {
  position: 'fixed', left: 24, bottom: 24, zIndex: 100, width: 344,
  background: '#fff', border: '1px solid #E4E4E7', borderRadius: 14, padding: '18px 20px',
  boxShadow: '0 30px 70px -34px rgba(20,34,62,0.35), 0 3px 10px -4px rgba(0,0,0,0.06)',
};
const eyebrow = (color: string): React.CSSProperties => ({
  fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.09em', textTransform: 'uppercase', color,
});
const btnSolid: React.CSSProperties = {
  background: '#111114', color: '#fff', border: '1px solid #111114', borderRadius: 9,
  padding: '9px 16px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
};
const btnGhostDark: React.CSSProperties = {
  background: 'transparent', color: '#F4F4F5', border: '1px solid #2C2E32', borderRadius: 999,
  padding: '9px 16px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#111114', border: '1px solid #E4E4E7', borderRadius: 9,
  padding: '9px 16px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
};
const skipDark: React.CSSProperties = {
  background: 'transparent', color: '#9D9EA2', border: 0, padding: '9px 8px', fontSize: 13,
  cursor: 'pointer', marginLeft: 'auto',
};

const Dots: React.FC<{ at: number }> = ({ at }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: 999,
        background: i === at ? '#57585B' : 'transparent', border: '1px solid #C9CACE',
      }} />
    ))}
  </div>
);

export const Onboarding: React.FC<{ onNavigate: (id: SurfaceId) => void }> = ({ onNavigate }) => {
  const rt = useRuntimeContext();
  const [dismissed, setDismissed] = useState(wasOnboarded);
  const [started, setStarted] = useState(false);

  // Desktop-only first run; the web preview is a marketing surface, not a real session.
  if (!rt.electron || dismissed) return null;

  const connected = !!rt.status?.ready;
  const hasRun = rt.messages.length > 0;

  const finish = () => { markOnboarded(); setDismissed(true); };

  // Truthful step: Welcome until the operator starts; Connect until truly connected; then First run.
  const step: 'welcome' | 'connect' | 'run' =
    !started && !connected && !hasRun ? 'welcome' : connected ? 'run' : 'connect';

  if (step === 'welcome') {
    return (
      <div style={overlay}>
        <div style={inkCard}>
          <div style={eyebrow('#9D9EA2')}>otto</div>
          <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '14px 0 0', color: '#fff' }}>
            The behavior layer for persistent agents.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: '#9D9EA2', margin: '14px 0 0', maxWidth: '46ch' }}>
            otto records what your agent relied on before it acted — and changes the next run only when you ratify it.
          </p>
          <div style={{ fontSize: 13.5, color: '#C9CACE', margin: '22px 0 0', fontWeight: 500 }}>
            The human ratifies. otto records the proof.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 26 }}>
            <button type="button" style={btnSolid} onClick={() => { setStarted(true); onNavigate('settings'); }}>
              Connect local Letta →
            </button>
            <button type="button" style={btnGhostDark} onClick={() => { setStarted(true); onNavigate('receipts'); }}>
              See what Receipts will prove
            </button>
            <button type="button" style={skipDark} onClick={finish}>Skip</button>
          </div>
        </div>
      </div>
    );
  }

  const isConnect = step === 'connect';
  return (
    <div style={dock}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={eyebrow('#57585B')}>Getting started</span>
        <Dots at={isConnect ? 1 : 2} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: '#111114' }}>
        {isConnect ? 'Connect otto to your local Letta' : "You're connected — run your first message"}
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.5, color: '#57585B', margin: '8px 0 0' }}>
        {isConnect
          ? 'otto tries to discover Letta Desktop and your current local agent automatically. Use Settings only for advanced overrides; Chat unlocks the moment otto is truly connected.'
          : 'Send otto a first message and watch it do real work. Your first Receipt will appear here once Receipts land.'}
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {isConnect
          ? <button type="button" style={btnSolid} onClick={() => onNavigate('settings')}>Open Settings</button>
          : <button type="button" style={btnSolid} onClick={() => onNavigate('chat')}>Go to Chat</button>}
        <button type="button" style={btnGhost} onClick={finish}>{hasRun ? 'Done' : 'Skip'}</button>
      </div>
    </div>
  );
};
