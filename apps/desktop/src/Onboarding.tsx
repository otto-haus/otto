import type React from 'react';
import { useEffect, useState } from 'react';
import { onboardingCopy } from './copy/surfaces';
import { useRuntimeContext } from './runtime-context';
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
  wasFirstMessageDuringOnboarding,
  wasOnboarded,
} from './onboarding-storage';
import {
  canAdvanceOnboardingModePick,
  resolveOnboardingStep,
  shouldShowOnboardingModePicker,
  type OnboardingIntent,
} from './onboarding-step';
import { OnboardingStepLayout, type OnboardingEvidence } from './OnboardingStepLayout';
import { enableSampleReceiptPreview, SAMPLE_RECEIPT_LABEL } from './onboarding-sample-receipt';
import { ReadinessPanel } from './ReadinessPanel';

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
  const [sessionFirstMessage, setSessionFirstMessage] = useState(wasFirstMessageDuringOnboarding);
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
      if (api) {
        await api.config.set({ connectionMode: mode });
        const next = await api.connection.save({});
        rt.updateStatus(next);
      }
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
      <div className="onboardOverlay onboardOverlay--takeover">
        <div className="onboardCard onboardCard--welcome">
          <div className="onboardEyebrow onboardEyebrow--dark">{onboardingCopy.eyebrow}</div>
          <h2 className="onboardTitle">{onboardingCopy.welcomeTitle}</h2>
          <p className="onboardBody">{onboardingCopy.welcomeBody}</p>
          <div className="onboardWelcomeStack">
            <button
              type="button"
              className="btn btn--solid-d onboardWelcomeStack__primary"
              onClick={() => startPath('connect', connected ? 'chat' : 'settings')}
            >
              {onboardingCopy.primaryStart}
            </button>
            <button
              type="button"
              className="onboardLinkSecondary"
              onClick={() => {
                enableSampleReceiptPreview();
                startPath('receipts-preview', 'receipts');
              }}
            >
              {onboardingCopy.secondarySample}
            </button>
            <div className="onboardTertiary">
              <button type="button" className="onboardLinkTertiary" onClick={finish}>
                {onboardingCopy.skip}
              </button>
              <button
                type="button"
                className="onboardLinkTertiary"
                onClick={() => {
                  setIntent('connect');
                  setStarted(true);
                  void persistModeAndOpenSettings('existing');
                }}
              >
                {onboardingCopy.advancedExisting}
              </button>
            </div>
          </div>
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
    const next = await api.runtime.init();
    rt.updateStatus(next);
  };

  const statusReason = rt.status?.reason?.trim();
  const statusCode = rt.status?.code;

  const stepChrome = (() => {
    if (step === 'connect') {
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
              <button
                type="button"
                className="btn btn--primary"
                disabled={!connected}
                onClick={() => connected && onNavigate('chat')}
              >
                {onboardingCopy.connectContinue}
              </button>
              {!connected && (
                <button type="button" className="btn" onClick={() => void retryStatus()}>
                  {onboardingCopy.connectRetry}
                </button>
              )}
              <button type="button" className="btn" onClick={finish}>{onboardingCopy.skip}</button>
            </>
          )}
        >
          <ReadinessPanel variant="onboarding" />
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

  // Run-step chrome stays on Chat; suppress dock on Settings so Save stays reachable.
  if (step === 'run' && activeSurface === 'settings') return null;

  return null;
};
