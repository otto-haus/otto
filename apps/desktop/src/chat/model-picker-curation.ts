import type { LettaModelOption } from '../runtime';

export type ModelPickerTier = 'primary' | 'legacy' | 'other';

export type CuratedModelOption = LettaModelOption & {
  tier: ModelPickerTier;
  deprecated?: boolean;
};

/** Recommended handles shown in the default picker (current otto stack). */
const PRIMARY_MODEL_HANDLES = new Set([
  'letta/auto',
  'chatgpt-plus-pro/gpt-5.5',
  'openai/gpt-5.5',
  'openai-codex/gpt-5.5',
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-opus-4-8',
]);

const LEGACY_HANDLE_PATTERNS: RegExp[] = [
  /\bgpt-3(?:\.|$|-)/i,
  /\bgpt-35/i,
  /\bgpt-4-(?!1|o)/i,
  /\bgpt-4-turbo/i,
  /\bclaude-2/i,
  /\bclaude-instant/i,
  /\bclaude-3-(?:opus|sonnet|haiku)(?:-|$)/i,
  /\b(text-davinci|davinci|babbage|ada|curie|text-)/i,
  /\bllama-2/i,
  /\bmistral-7b/i,
];

const PRIMARY_HANDLE_PATTERNS: RegExp[] = [
  /\bgpt-5/i,
  /\bclaude-(?:sonnet|opus)-4/i,
  /\bo[134]-/i,
  /\bletta\/auto\b/i,
];

export function isLegacyModelHandle(handle: string, deprecated = false): boolean {
  if (deprecated) return true;
  const normalized = handle.trim().toLowerCase();
  if (!normalized) return false;
  return LEGACY_HANDLE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isPrimaryModelHandle(handle: string): boolean {
  const normalized = handle.trim();
  if (!normalized) return false;
  if (PRIMARY_MODEL_HANDLES.has(normalized)) return true;
  const lower = normalized.toLowerCase();
  return PRIMARY_HANDLE_PATTERNS.some((pattern) => pattern.test(lower));
}

export function tierForModel(handle: string, deprecated = false): ModelPickerTier {
  if (isLegacyModelHandle(handle, deprecated)) return 'legacy';
  if (isPrimaryModelHandle(handle)) return 'primary';
  return 'other';
}

export function curateModelOptions(models: LettaModelOption[]): CuratedModelOption[] {
  return models.map((model) => {
    const deprecated = model.deprecated === true;
    return {
      ...model,
      deprecated,
      tier: tierForModel(model.handle, deprecated),
    };
  });
}

/** Default picker rows: primary first; legacy/other only when expanded or currently selected. */
export function visiblePickerModels(
  models: CuratedModelOption[],
  showLegacy: boolean,
  selectedHandle?: string | null,
): CuratedModelOption[] {
  const selected = selectedHandle?.trim() || null;
  const primary = models.filter((model) => model.tier === 'primary');
  const legacy = models.filter((model) => model.tier === 'legacy');
  const other = models.filter((model) => model.tier === 'other');

  const visible = [...primary];
  const pinned = models.find((model) => model.handle === selected);
  if (pinned && pinned.tier !== 'primary' && !showLegacy && !visible.some((model) => model.handle === pinned.handle)) {
    visible.push(pinned);
  }
  if (showLegacy) {
    for (const model of [...legacy, ...other]) {
      if (!visible.some((row) => row.handle === model.handle)) visible.push(model);
    }
  }
  return visible;
}

export function labelForCuratedModel(model: CuratedModelOption): string {
  return model.label?.trim() || model.displayName?.trim() || model.handle;
}

/** Optional subtitle when Letta provider_name differs from the handle prefix (#459). */
export function modelProviderSubtitle(model: Pick<LettaModelOption, 'handle' | 'provider'>): string | null {
  const provider = model.provider?.trim();
  if (!provider) return null;
  const prefix = model.handle.split('/')[0]?.trim().toLowerCase();
  if (!prefix) return provider;
  if (provider.toLowerCase() === prefix) return null;
  return provider;
}
