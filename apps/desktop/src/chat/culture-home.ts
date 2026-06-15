import type { BehaviorChangelogResult, ConstitutionResult } from '@otto-haus/core';
import { commandStationCopy } from '../copy/surfaces';
import type { CultureHomeData } from '../components/ui/CommandStationStrip';
import type { ReceiptSummary } from '../runtime';

const formatShortDate = (iso: string): string => {
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return iso;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(ms);
};

export const receiptAuthorityLabel = (receipt: ReceiptSummary): string => {
  if (receipt.action.startsWith('constitution.')) return 'human (constitution)';
  if (receipt.action.startsWith('autonomy.')) return 'human (autonomy)';
  if (receipt.subjectType === 'proposal') return 'human (curation)';
  return receipt.subjectType;
};

export const buildCultureHome = (input: {
  constitution?: ConstitutionResult | null;
  changelog?: BehaviorChangelogResult | null;
  latestReceipt?: ReceiptSummary | null;
}): CultureHomeData => {
  const forbidden = input.constitution?.document.forbidden_actions.length;
  const amendedAt = input.constitution?.document.amended_at;
  const constitutionHint = typeof forbidden === 'number'
    ? amendedAt
      ? commandStationCopy.constitutionAmended(forbidden, formatShortDate(amendedAt))
      : commandStationCopy.constitutionForbidden(forbidden)
    : undefined;

  const changelogCount = input.changelog?.entries.length ?? 0;
  const changelogHint = changelogCount > 0
    ? commandStationCopy.changelogRecent(changelogCount)
    : input.changelog?.empty_message ?? commandStationCopy.changelogNone;

  const latestProofHint = input.latestReceipt
    ? commandStationCopy.latestProofSummary(
      input.latestReceipt.status,
      receiptAuthorityLabel(input.latestReceipt),
    )
    : commandStationCopy.latestProofNone;

  return {
    constitutionHint,
    changelogHint,
    latestProofHint,
  };
};
