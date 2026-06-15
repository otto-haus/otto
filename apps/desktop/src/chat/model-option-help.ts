import type { LettaModelOption } from '../runtime';

type AutoHelp = {
  match: RegExp;
  text: string;
};

const AUTO_HELP_BY_HANDLE: AutoHelp[] = [
  {
    match: /^letta\/auto-chat$/i,
    text: 'Routes to a conversational model when available. Favors reply quality over speed or cost.',
  },
  {
    match: /^letta\/auto-fast$/i,
    text: 'Routes to the fastest available model. Favors latency over depth or memory.',
  },
  {
    match: /^letta\/auto-memory$/i,
    text: 'Routes to models suited for long context and memory-heavy turns when available.',
  },
  {
    match: /^letta\/auto$/i,
    text: 'Letta chooses from your connected providers each turn. The resolved model can change.',
  },
];

const AUTO_HELP_BY_LABEL: AutoHelp[] = [
  {
    match: /^auto chat$/i,
    text: 'Routes to a conversational model when available. Favors reply quality over speed or cost.',
  },
  {
    match: /^auto fast$/i,
    text: 'Routes to the fastest available model. Favors latency over depth or memory.',
  },
  {
    match: /^auto memory$/i,
    text: 'Routes to models suited for long context and memory-heavy turns when available.',
  },
  {
    match: /^auto$/i,
    text: 'Letta chooses from your connected providers each turn. The resolved model can change.',
  },
];

export function isAutoModelOption(option: Pick<LettaModelOption, 'handle' | 'label'>): boolean {
  if (/^letta\/auto/i.test(option.handle)) return true;
  return /^auto(\s|$)/i.test(option.label.trim());
}

export function helpTextForModelOption(option: Pick<LettaModelOption, 'handle' | 'label'>): string | null {
  if (!isAutoModelOption(option)) return null;
  const handle = option.handle.trim();
  const label = option.label.trim();
  for (const entry of AUTO_HELP_BY_HANDLE) {
    if (entry.match.test(handle)) return entry.text;
  }
  for (const entry of AUTO_HELP_BY_LABEL) {
    if (entry.match.test(label)) return entry.text;
  }
  return 'Letta may route this preset dynamically. The resolved model can differ from the label.';
}

export function formatResolvedModelLabel(
  requestedHandle: string | null | undefined,
  resolvedHandle: string | null | undefined,
  options: LettaModelOption[],
  labelFor: (value?: string | null, options?: LettaModelOption[]) => string,
): string | null {
  if (!requestedHandle || !resolvedHandle) return null;
  if (requestedHandle === resolvedHandle) return null;
  if (!isAutoModelOption({ handle: requestedHandle, label: labelFor(requestedHandle, options) })) return null;
  return labelFor(resolvedHandle, options);
}
