import type React from 'react';
import { useEffect, useState } from 'react';
import { useRuntimeContext } from './RuntimeContext';
import type { SurfaceId } from './components/Sidebar';
import { enableSampleReceiptPreview } from './onboarding-sample-receipt';
import {
  dismissOnboarding,
  onOnboardingDismiss,
  onOnboardingFirstMessage,
  wasOnboarded,
} from './onboarding-storage';
import {
  ONBOARDING_STEP_COUNT,
  onboardingDotIndex,
  resolveOnboardingStep,
  type OnboardingIntent,
} from './onboarding-step';

// First-run onboarding (desktop): Welcome → Connect → First loop → First Receipt.
// Driven by REAL state (prove-then-proceed) — never implies connected/ready before it is.

const Dots: React.FC<{ at: number }> = ({ at }) => (
  <div className="onboardDots" aria-hidden="true">
    {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, i) => (
      <span key={i} className={`onboardDot${i === at ? ' is-active' : ''}`} />
    ))}
  </div>
);

export const Onboarding: React.FC<{ onNavigate: (id: SurfaceId) => void; activeSurface: SurfaceId }> = ({
  onNavigate,
  activeSurface,
}) => {
  const rt = useRuntimeContext();
  const [dismissed, setDismissed] = useState(wasOnboarded);
  const [started, setStarted] = useState(false);
  const [intent, setIntent] = useState<OnboardingIntent>('connect');
  const [sessionFirstMessage, setSessionFirstMessage] = useState(false);
  /** Avoid welcome flash before runtime status is known; auto-start connect path when already connected. */
  const [hydrated, setHydrated] = useState(!rt.electron);

  useEffect(() => onOnboardingFirstMessage(() => {
    setSessionFirstMessage(true);
  }), []);

  useEffect(() => onOnboardingDismiss(() => setDismissed(true)), []);

  useEffect(() => {
    if (!rt.electron) return;
    if (rt.status === null) return;
    if (!wasOnboarded() && rt.status.ready) {
      setStarted(true);
      setIntent('connect');
    }
    setHydrated(true);
  }, [rt.electron, rt.status]);

  if (!rt.electron || dismissed || !hydrated) return null;

  const connected = !!rt.status?.ready;
  const step = resolveOnboardingStep({
    started,
    intent,
    connected,
    firstMessageDuringOnboarding: sessionFirstMessage,
  });

  const finish = () => { dismissOnboarding(); setDismissed(true); };

  const startPath = (nextIntent: OnboardingIntent, surface: SurfaceId) => {
    setIntent(nextIntent);
    setStarted(true);
    if (nextIntent === 'receipts-preview') enableSampleReceiptPreview();
    onNavigate(surface);
  };

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
            <button type="button" className="btn btn--solid-d" onClick={() => startPath('connect', 'settings')}>
              Connect local Letta →
            </button>
            <button type="button" className="btn btn--ghost-d" onClick={() => startPath('receipts-preview', 'receipts')}>
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

  const dotAt = onboardingDotIndex(step);
  const statusReason = rt.status?.reason?.trim();
  const statusCode = rt.status?.code;

  if (step === 'receipt') {
    return (
      <div className="onboardDock onboardDock--receipt">
        <div className="between" style={{ marginBottom: 10 }}>
          <span className="onboardEyebrow onboardEyebrow--light">Getting started</span>
          <Dots at={dotAt} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Inspect a sample Receipt
        </div>
        <p className="onboardBody onboardBody--light" style={{ marginTop: 8 }}>
          Receipts are durable proof records — what was relied on, what happened, and what evidence was retained.
          The sample card is labeled and is not from your workspace.
        </p>
        <div className="onboardActions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn--primary" onClick={() => onNavigate('receipts')}>View sample Receipt</button>
          <button type="button" className="btn" onClick={finish}>Done</button>
        </div>
      </div>
    );
  }

  const isConnect = step === 'connect';
  // On Chat, hide the run-step dock — bottom dock covers the composer.
  if (step === 'run' && activeSurface === 'chat') return null;

  return (
    <div className={`onboardDock${isConnect ? ' onboardDock--connect' : ''}`}>
      <div className="between" style={{ marginBottom: 10 }}>
        <span className="onboardEyebrow onboardEyebrow--light">Getting started</span>
        <Dots at={dotAt} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
        {isConnect ? 'Connect otto to your local Letta' : "You're connected — run your first message"}
      </div>
      <p className="onboardBody onboardBody--light" style={{ marginTop: 8 }}>
        {isConnect
          ? 'otto tries to discover Letta Desktop and your current local agent automatically. Use Settings only for advanced overrides; Chat unlocks the moment otto is truly connected.'
          : 'Send otto a first message and watch it do real work. When the turn completes, otto writes an `otto.receipt.v1` proof record you can inspect in Receipts.'}
      </p>
      {isConnect && !connected && (statusReason || statusCode) && (
        <p className="onboardBody onboardBody--light onboardStatusReason">
          {statusCode && <span className="mono onboardStatusCode">{statusCode}</span>}
          {statusReason}
        </p>
      )}
      <div className="onboardActions" style={{ marginTop: 16 }}>
        {isConnect
          ? <button type="button" className="btn btn--primary" onClick={() => onNavigate('settings')}>Open Settings</button>
          : <button type="button" className="btn btn--primary" onClick={() => onNavigate('chat')}>Go to Chat</button>}
        <button type="button" className="btn" onClick={finish}>
          {sessionFirstMessage ? 'Done' : 'Skip'}
        </button>
      </div>
    </div>
  );
};
