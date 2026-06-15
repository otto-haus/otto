import type React from 'react';
import { useEffect, useState } from 'react';
import { onboardingCopy } from './copy/surfaces';
import { useRuntimeContext } from './RuntimeContext';
import type { SurfaceId } from './components/Sidebar';
import { ottoApi } from './runtime';
import {
  clearOnboardingModeDraft,
  dismissOnboarding,
  getOnboardingModeDraft,
  onOnboardingDismiss,
  onOnboardingFirstMessage,
  requestOnboardingStarter,
  setOnboardingModeDraft,
  type OnboardingConnectionMode,
  wasOnboarded,
} from './onboarding-storage';
import {
  ONBOARDING_STEP_COUNT,
  canAdvanceOnboardingModePick,
  onboardingDotIndex,
  resolveOnboardingStep,
  shouldShowOnboardingModePicker,
  type OnboardingIntent,
} from './onboarding-step';
import { OnboardingStepLayout, type OnboardingEvidence } from './OnboardingStepLayout';
import { enableSampleReceiptPreview, SAMPLE_RECEIPT_LABEL } from './onboarding-sample-receipt';

const ModeCard: React.FC<{
  title: string;
  body: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ title, body, badge, selected, onSelect }) => (
  <button
    type="button"
    className={`onboardChoiceCard${selected ? ' is-selected' : ''}`}
    onClick={onSelect}
    aria-pressed={selected}
  >
    <div className="onboardChoiceCard__head">
      <span className="onboardChoiceCard__title">{title}</span>
      {badge ? <span className="onboardChoiceCard__badge">{badge}</span> : null}
      <span className={`onboardChoiceCard__radio${selected ? ' is-on' : ''}`} aria-hidden="true" />
    </div>
    <p className="onboardChoiceCard__body">{body}</p>
  </button>
);

export const Onboarding: React.FC<{ onNavigate: (id: SurfaceId) => void; activeSurface: SurfaceId }> = ({
  onNavigate,
  activeSurface,
}) => {
  const rt = useRuntimeContext();
  const api = ottoApi();
  const [dismissed, setDismissed] = useState(wasOnboarded);
  const [started, setStarted] = useState(false);
  const [intent, setIntent] = useState<OnboardingIntent>('connect');
  const [sessionFirstMessage, setSessionFirstMessage] = useState(false);
  const [modeDraft, setModeDraft] = useState<OnboardingConnectionMode | null>(getOnboardingModeDraft);
  const [modePick, setModePick] = useState<OnboardingConnectionMode | null>(null);
  const [modeBusy, setModeBusy] = useState(false);
  const [hydrated, setHydrated] = useState(!rt.electron);

  useEffect(() => onOnboardingFirstMessage(() => setSessionFirstMessage(true)), []);
  useEffect(() => onOnboardingDismiss(() => setDismissed(true)), []);
  useEffect(() => {
    if (!rt.electron) return;
    if (rt.status === null) return;
    setHydrated(true);
  }, [rt.electron, rt.status]);

  const connected = !!rt.status?.ready;

  // Chat-first: connected operators skip the onboarding theater.
  useEffect(() => {
    if (!connected || dismissed || started) return;
    dismissOnboarding();
    setDismissed(true);
  }, [connected, dismissed, started]);

  if (!rt.electron || dismissed || !hydrated) return null;
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
    onNavigate(surface);
  };

  const evidence: OnboardingEvidence = {
    welcome: started,
    connect: connected,
    run: sessionFirstMessage,
    receipt: intent === 'receipts-preview' ? false : sessionFirstMessage,
  };

  const showModePicker = shouldShowOnboardingModePicker({
    started,
    intent,
    connected,
    modeDraft,
  });

  const persistModeAndOpenSettings = async (mode: OnboardingConnectionMode) => {
    setModeBusy(true);
    try {
      setOnboardingModeDraft(mode);
      setModeDraft(mode);
      if (api) await api.config.set({ connectionMode: mode });
      onNavigate('settings');
    } finally {
      setModeBusy(false);
    }
  };

  const goBack = () => {
    if (showModePicker) {
      setStarted(false);
      clearOnboardingModeDraft();
      setModeDraft(null);
      return;
    }
    if (step === 'connect' && modeDraft) {
      clearOnboardingModeDraft();
      setModeDraft(null);
      return;
    }
    if (step === 'run') onNavigate('settings');
    if (step === 'receipt' && intent === 'connect') onNavigate('chat');
  };

  if (step === 'welcome') {
    return (
      <div className="onboardOverlay">
        <div className="onboardCard onboardCard--welcome">
          <span className="onboardBadge">{onboardingCopy.badge}</span>
          <div className="onboardEyebrow onboardEyebrow--dark">{onboardingCopy.eyebrow}</div>
          <h2 className="onboardTitle" style={{ color: '#fff' }}>{onboardingCopy.welcomeTitle}</h2>
          <p className="onboardBody" style={{ maxWidth: '46ch' }}>{onboardingCopy.welcomeBody}</p>
          <div className="onboardAuthority">{onboardingCopy.authorityLine}</div>
          <div className="onboardActions">
            <button type="button" className="btn btn--solid-d" onClick={() => startPath('connect', 'settings')}>
              {onboardingCopy.primaryStart}
            </button>
            <button
              type="button"
              className="btn btn--ghost-d"
              onClick={() => {
                enableSampleReceiptPreview();
                startPath('receipts-preview', 'receipts');
              }}
            >
              {onboardingCopy.secondarySample}
            </button>
            <button type="button" className="btn btn--ghost-d onboardSkip" onClick={finish}>
              {onboardingCopy.skip}
            </button>
          </div>
          <button
            type="button"
            className="onboardHelp onboardHelp--dark"
            onClick={() => window.open(onboardingCopy.helpUrl, '_blank', 'noopener,noreferrer')}
          >
            {onboardingCopy.helpLabel}
          </button>
        </div>
      </div>
    );
  }

  if (showModePicker) {
    return (
      <div className="onboardOverlay onboardOverlay--step">
        <div className="onboardFlowPanel">
          <OnboardingStepLayout
            step="connect"
            evidence={evidence}
            title={onboardingCopy.modeTitle}
            lede={onboardingCopy.modeLede}
            canBack
            onBack={goBack}
            fullScreen
            footer={(
              <button
                type="button"
                className="btn btn--primary"
                disabled={!canAdvanceOnboardingModePick(modePick, modeBusy)}
                onClick={() => modePick && void persistModeAndOpenSettings(modePick)}
              >
                {onboardingCopy.modeContinue}
              </button>
            )}
          >
            <div className="onboardChoiceGrid">
              <ModeCard
                title={onboardingCopy.modeEmbeddedTitle}
                body={onboardingCopy.modeEmbeddedBody}
                badge={onboardingCopy.modeEmbeddedBadge}
                selected={modePick === 'embedded'}
                onSelect={() => setModePick('embedded')}
              />
              <ModeCard
                title={onboardingCopy.modeExistingTitle}
                body={onboardingCopy.modeExistingBody}
                selected={modePick === 'existing'}
                onSelect={() => setModePick('existing')}
              />
            </div>
          </OnboardingStepLayout>
        </div>
      </div>
    );
  }

  const retryStatus = async () => {
    if (!api) return;
    const next = await api.runtime.status();
    rt.updateStatus(next);
  };

  const statusReason = rt.status?.reason?.trim();
  const statusCode = rt.status?.code;
  const dotAt = onboardingDotIndex(step);

  const stepChrome = (() => {
    if (step === 'connect' && activeSurface === 'settings') {
      return (
        <OnboardingStepLayout
          step="connect"
          evidence={evidence}
          title={onboardingCopy.connectTitle}
          lede={onboardingCopy.connectLede}
          canBack
          onBack={goBack}
          footer={(
            <>
              {!connected && (
                <button type="button" className="btn btn--primary" disabled={connected} onClick={() => onNavigate('settings')}>
                  {onboardingCopy.connectOpenSettings}
                </button>
              )}
              {connected && (
                <button type="button" className="btn btn--primary" onClick={() => onNavigate('chat')}>
                  {onboardingCopy.runGoChat}
                </button>
              )}
              <button type="button" className="btn" onClick={() => void retryStatus()}>{onboardingCopy.connectRetry}</button>
              <button type="button" className="btn" onClick={finish}>{onboardingCopy.skip}</button>
            </>
          )}
        >
          {!connected && (statusReason || statusCode) ? (
            <p className="onboardStatusReason onboardStatusReason--inline">
              {statusCode ? <span className="mono onboardStatusCode">{statusCode}</span> : null}
              {statusReason}
            </p>
          ) : null}
          {connected ? <p className="onboardInlineOk">{onboardingCopy.connectedOk}</p> : null}
        </OnboardingStepLayout>
      );
    }

    if (step === 'run' && activeSurface === 'chat') {
      return (
        <OnboardingStepLayout
          step="run"
          evidence={evidence}
          title={onboardingCopy.runTitle}
          lede={onboardingCopy.runLede}
          canBack
          onBack={goBack}
          footer={(
            <>
              {onboardingCopy.runChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="btn"
                  disabled={!connected || rt.busy}
                  onClick={() => requestOnboardingStarter(chip)}
                >
                  {chip}
                </button>
              ))}
              <button type="button" className="btn" onClick={finish}>{onboardingCopy.skip}</button>
            </>
          )}
        />
      );
    }

    if (step === 'receipt') {
      const samplePath = intent === 'receipts-preview';
      return (
        <OnboardingStepLayout
          step="receipt"
          evidence={{ ...evidence, receipt: !samplePath && sessionFirstMessage }}
          title={onboardingCopy.receiptTitle}
          lede={samplePath ? `${onboardingCopy.receiptLede} ${SAMPLE_RECEIPT_LABEL}.` : onboardingCopy.receiptLede}
          canBack={!samplePath}
          onBack={samplePath ? undefined : goBack}
          footer={(
            <>
              <button type="button" className="btn btn--primary" onClick={() => onNavigate('receipts')}>
                {onboardingCopy.receiptOpen}
              </button>
              <button type="button" className="btn" onClick={finish}>{onboardingCopy.receiptDone}</button>
            </>
          )}
        >
          {samplePath ? <p className="onboardSampleNote">{onboardingCopy.sampleOnlyNote}</p> : null}
        </OnboardingStepLayout>
      );
    }

    return null;
  })();

  if (stepChrome) {
    return <div className="onboardStepAnchor">{stepChrome}</div>;
  }

  if (step === 'connect' && activeSurface !== 'settings' && modeDraft) {
    return (
      <div className="onboardDock onboardDock--connect">
        <OnboardingStepLayout
          step="connect"
          evidence={evidence}
          title={onboardingCopy.connectTitle}
          lede={onboardingCopy.connectLede}
          canBack
          onBack={goBack}
          footer={(
            <button type="button" className="btn btn--primary" onClick={() => onNavigate('settings')}>
              {onboardingCopy.connectOpenSettings}
            </button>
          )}
        />
      </div>
    );
  }

  // Legacy dock fallback when step chrome does not attach to the active surface.
  if (step === 'receipt') {
    return (
      <div className="onboardDock onboardDock--receipt">
        <div className="between" style={{ marginBottom: 10 }}>
          <span className="onboardEyebrow onboardEyebrow--light">{onboardingCopy.legacyDockEyebrow}</span>
          <div className="onboardDots" aria-hidden="true">
            {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, i) => (
              <span key={i} className={`onboardDot${i === dotAt ? ' is-active' : ''}`} />
            ))}
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{onboardingCopy.receiptTitle}</div>
        <p className="onboardBody onboardBody--light" style={{ marginTop: 8 }}>{onboardingCopy.receiptLede}</p>
        <div className="onboardActions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn--primary" onClick={() => onNavigate('receipts')}>{onboardingCopy.receiptOpen}</button>
          <button type="button" className="btn" onClick={finish}>{onboardingCopy.receiptDone}</button>
        </div>
      </div>
    );
  }

  return null;
};
