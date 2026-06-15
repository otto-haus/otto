import type { LabFeatureId, LabsConfig, OttoConfig } from './shared/types';

export const LAB_FEATURE_IDS: LabFeatureId[] = [
  'knowledge_cognee',
  'pgvector_recall',
  'channels_outbound',
  'memory_observatory',
  'worker_autonomous_loop',
  'practice_mining',
  'culture_export',
  'remote_letta_cloud',
  'command_station_full',
];

const LEGACY_SURFACE_KEYS = new Set([
  'charters',
  'standards',
  'practices',
  'routines',
  'curation',
  'receipts',
  'checks',
  'autonomy',
  'skills',
  'knowledge',
  'tickets',
  'channels',
]);

function isLegacyLabsShape(raw: OttoConfig['labs']): raw is Record<string, boolean> {
  if (!raw || typeof raw !== 'object') return false;
  if ('enabled' in raw || 'features' in raw) return false;
  return Object.keys(raw).some((k) => LEGACY_SURFACE_KEYS.has(k));
}

/** Fresh profile default: Labs master off, no features enabled. */
export function defaultLabsConfig(): LabsConfig {
  return { enabled: false, features: {} };
}

export function normalizeLabsConfig(raw: OttoConfig['labs'] | undefined): LabsConfig {
  if (!raw) return defaultLabsConfig();

  if (isLegacyLabsShape(raw)) {
    const legacy = raw as Record<string, boolean>;
    const features: Partial<Record<LabFeatureId, boolean>> = {};
    if (legacy.knowledge) features.knowledge_cognee = true;
    if (legacy.channels) features.channels_outbound = true;
    const anyFeature = Object.values(features).some(Boolean);
    return {
      enabled: anyFeature,
      features,
    };
  }

  const nested = raw as LabsConfig;
  return {
    enabled: nested.enabled === true,
    features: normalizeFeatureFlags(nested.features),
  };
}

export function getLabsConfig(cfg: OttoConfig): LabsConfig {
  return normalizeLabsConfig(cfg.labs);
}

export function patchLabsConfig(cfg: OttoConfig, patch: Partial<LabsConfig>): LabsConfig {
  const current = normalizeLabsConfig(cfg.labs);
  const patchEnabled = (patch as { enabled?: unknown }).enabled;
  const patchFeatures = normalizeFeatureFlags((patch as { features?: LabsConfig['features'] }).features);
  const next: LabsConfig = {
    enabled: typeof patchEnabled === 'boolean' ? patchEnabled : current.enabled,
    features: { ...current.features, ...patchFeatures },
  };
  return next;
}

export function labsConfigToOttoPatch(next: LabsConfig): Pick<OttoConfig, 'labs'> {
  return { labs: next };
}

/** Same merge + persist steps as `otto:labs:set` IPC (Settings uses preload → this path). */
export function applyLabsConfigPatch(cfg: OttoConfig, patch: Partial<LabsConfig>): LabsConfig {
  return patchLabsConfig(cfg, patch);
}

/** Ship-tier gate for Settings cloud connection mode (#627 / #139). */
export function isRemoteLettaCloudEnabled(labs: LabsConfig): boolean {
  return labs.enabled === true && labs.features?.remote_letta_cloud === true;
}

function normalizeFeatureFlags(raw: LabsConfig['features'] | undefined): Partial<Record<LabFeatureId, boolean>> {
  const features: Partial<Record<LabFeatureId, boolean>> = {};
  if (!raw || typeof raw !== 'object') return features;
  for (const id of LAB_FEATURE_IDS) {
    if (raw[id] === true) features[id] = true;
    if (raw[id] === false) features[id] = false;
  }
  return features;
}
