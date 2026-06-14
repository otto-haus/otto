import type React from 'react';
import type { OnboardingStep } from './onboarding-step';
import { onboardingCopy } from './copy/surfaces';

const SEGMENTS: Array<{ key: OnboardingStep | 'welcome'; label: string }> = [
  { key: 'welcome', label: onboardingCopy.progressWelcome },
  { key: 'connect', label: onboardingCopy.progressConnect },
  { key: 'run', label: onboardingCopy.progressRun },
  { key: 'receipt', label: onboardingCopy.progressReceipt },
];

export type OnboardingEvidence = {
  welcome: boolean;
  connect: boolean;
  run: boolean;
  receipt: boolean;
};

function segmentFilled(key: OnboardingStep | 'welcome', evidence: OnboardingEvidence): boolean {
  switch (key) {
    case 'welcome': return evidence.welcome;
    case 'connect': return evidence.connect;
    case 'run': return evidence.run;
    case 'receipt': return evidence.receipt;
    default: return false;
  }
}

export const OnboardingProgressRail: React.FC<{ evidence: OnboardingEvidence; active: OnboardingStep | 'welcome' }> = ({
  evidence,
  active,
}) => {
  const completed = SEGMENTS.filter((s) => segmentFilled(s.key, evidence)).length;
  return (
    <div
      className="onboardRail"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={SEGMENTS.length}
      aria-valuenow={completed}
      aria-label="Onboarding progress"
    >
      {SEGMENTS.map((segment) => {
        const filled = segmentFilled(segment.key, evidence);
        const isActive = segment.key === active;
        return (
          <div
            key={segment.key}
            className={`onboardRail__seg${filled ? ' is-filled' : ''}${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className="onboardRail__bar" aria-hidden="true" />
            <span className="onboardRail__label">{segment.label}</span>
          </div>
        );
      })}
    </div>
  );
};

type LayoutProps = {
  step: OnboardingStep | 'welcome';
  evidence: OnboardingEvidence;
  title: string;
  lede?: string;
  canBack?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  fullScreen?: boolean;
};

export const OnboardingStepLayout: React.FC<LayoutProps> = ({
  step,
  evidence,
  title,
  lede,
  canBack,
  onBack,
  children,
  footer,
  fullScreen,
}) => (
  <div className={`onboardStepHost${fullScreen ? ' onboardStepHost--full' : ''}`}>
    <div className="onboardStepHost__inner">
      <OnboardingProgressRail evidence={evidence} active={step} />
      <div className="onboardStepHost__head">
        {canBack && onBack ? (
          <button type="button" className="onboardStepHost__back" onClick={onBack}>
            ← Back
          </button>
        ) : (
          <span className="onboardStepHost__backSpacer" aria-hidden="true" />
        )}
        <div className="onboardStepHost__titles">
          <h2 className="onboardStepHost__title">{title}</h2>
          {lede ? <p className="onboardStepHost__lede">{lede}</p> : null}
        </div>
      </div>
      {children ? <div className="onboardStepHost__body">{children}</div> : null}
      {footer ? <div className="onboardStepHost__footer">{footer}</div> : null}
      <button
        type="button"
        className="onboardStepHost__help"
        onClick={() => window.open(onboardingCopy.helpUrl, '_blank', 'noopener,noreferrer')}
      >
        {onboardingCopy.helpLabel}
      </button>
    </div>
  </div>
);
