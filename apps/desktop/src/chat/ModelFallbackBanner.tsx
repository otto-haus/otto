import React from 'react';
import { chatCopy } from '../copy/surfaces';
import { modelFallbackBannerBody, modelFallbackBannerSummary, shouldShowModelFallbackBanner } from './model-fallback-banner';

export const ModelFallbackBanner: React.FC<{
  ready: boolean;
  requested: string | null | undefined;
  active: string | null | undefined;
  fallbackReason?: string | null;
  labelFor: (handle: string) => string;
}> = ({ ready, requested, active, fallbackReason, labelFor }) => {
  if (!shouldShowModelFallbackBanner({ ready, requested, active, fallbackReason })) return null;
  const requestedHandle = requested!.trim();
  const activeHandle = active!.trim();
  const summary = modelFallbackBannerSummary(requestedHandle, activeHandle, labelFor);
  const body = modelFallbackBannerBody({
    requested: requestedHandle,
    active: activeHandle,
    fallbackReason,
    labelFor,
  });

  return (
    <div className="queuebar queuebar--warn modelFallbackBanner" role="status" aria-live="polite">
      <div className="queuebar__head">
        <span className="dot dot--warn" aria-hidden="true" />
        <span className="queuebar__summary">
          <span className="modelFallbackBanner__eyebrow">{chatCopy.modelFallbackEyebrow}</span>
          {' '}
          <span className="mono">{summary}</span>
        </span>
      </div>
      <p className="modelFallbackBanner__body">{body}</p>
    </div>
  );
};
