export type ModelFallbackBannerInput = {
  ready: boolean;
  requested: string | null | undefined;
  active: string | null | undefined;
  fallbackReason?: string | null;
};

/** Prominent banner when persisted selection differs from the active session model. */
export function shouldShowModelFallbackBanner(input: ModelFallbackBannerInput): boolean {
  if (!input.ready) return false;
  const requested = input.requested?.trim() ?? '';
  const active = input.active?.trim() ?? '';
  if (!requested || !active) return false;
  return requested !== active;
}

export function modelFallbackBannerSummary(
  requested: string,
  active: string,
  labelFor: (handle: string) => string,
): string {
  const requestedLabel = labelFor(requested);
  const activeLabel = labelFor(active);
  if (requestedLabel === activeLabel) return `${requested} → ${active}`;
  return `${requestedLabel} → ${activeLabel}`;
}

export function modelFallbackBannerBody(input: {
  requested: string;
  active: string;
  fallbackReason?: string | null;
  labelFor: (handle: string) => string;
}): string {
  const summary = modelFallbackBannerSummary(input.requested, input.active, input.labelFor);
  const reason = input.fallbackReason?.trim();
  if (reason) return reason;
  return `Requested ${summary} is unavailable for this session. Running the fallback model instead. Your selection stays saved.`;
}
