import type { SurfaceId } from './components/Sidebar';
import type { LabFeatureId, LabsConfig } from '../electron/shared/types';
import { isRemoteLettaCloudEnabled } from '../electron/labs-config';
import { isSampleReceiptPreview } from './onboarding-sample-receipt';

export { isRemoteLettaCloudEnabled };

export type ConnectionMode = 'embedded' | 'existing' | 'cloud';

/** Clamp persisted cloud mode when Labs gate is off so Ship users cannot stay on cloud via UI. */
export function effectiveConnectionMode(mode: ConnectionMode, labs: LabsConfig): ConnectionMode {
  if (mode === 'cloud' && !isRemoteLettaCloudEnabled(labs)) {
    return 'existing';
  }
  return mode;
}

/** Defer Labs gate until hydration so pre-load Save cannot clobber stored cloud mode (#627). */
export function gatedConnectionMode(
  mode: ConnectionMode,
  labs: LabsConfig,
  hydrated: boolean,
): ConnectionMode {
  if (!hydrated) return mode;
  return effectiveConnectionMode(mode, labs);
}

export type SurfaceTier = 'ship' | 'labs' | 'cut';

export const SURFACE_TIER: Record<SurfaceId, SurfaceTier> = {
  chat: 'ship',
  settings: 'ship',
  charters: 'ship',
  standards: 'ship',
  practices: 'ship',
  routines: 'ship',
  curation: 'ship',
  receipts: 'ship',
  checks: 'ship',
  autonomy: 'ship',
  skills: 'ship',
  tickets: 'ship',
  terminal: 'ship',
  knowledge: 'labs',
  channels: 'labs',
};

/** Labs-tier sidebar surfaces and the feature flag that unlocks them. */
export const SURFACE_LAB_FEATURE: Partial<Record<SurfaceId, LabFeatureId>> = {
  knowledge: 'knowledge_cognee',
  channels: 'channels_outbound',
};

export type LabFeatureMeta = {
  label: string;
  blurb: string;
  surfaces?: SurfaceId[];
};

export const LAB_FEATURE_META: Record<LabFeatureId, LabFeatureMeta> = {
  knowledge_cognee: {
    label: 'Knowledge (Cognee)',
    blurb: 'Optional recall graph sidecar for Knowledge — not required for Ship.',
    surfaces: ['knowledge'],
  },
  pgvector_recall: {
    label: 'pgvector recall',
    blurb: 'Local vector recall store — env-gated; experimental retrieval path.',
  },
  channels_outbound: {
    label: 'Channels outbound',
    blurb: 'Live outbound bot sends — contract-only until enabled.',
    surfaces: ['channels'],
  },
  memory_observatory: {
    label: 'Memory observatory',
    blurb: 'Deep memory block inspection in Settings when runtime is up.',
  },
  worker_autonomous_loop: {
    label: 'Worker autonomous loop',
    blurb: 'Ticket worker loop without manual nudge — approval-gated.',
  },
  practice_mining: {
    label: 'Practice mining',
    blurb: 'Observe loop that proposes practice updates from runs.',
  },
  culture_export: {
    label: 'Culture export',
    blurb: 'Portable culture bundle export from Settings.',
  },
  remote_letta_cloud: {
    label: 'Remote Letta Cloud',
    blurb: 'Advanced cloud connection mode — parked for most users.',
  },
  command_station_full: {
    label: 'Command Station dashboard',
    blurb: 'Dedicated culture home dashboard — strip in Chat stays Ship.',
  },
  turn_phase_timeline: {
    label: 'Turn phase timeline',
    blurb: 'Orient → locate → edit → verify chips on collapsed turn trail (Labs). See docs/v1/agent-turn-trail.md.',
  },
};

export function surfaceTier(id: SurfaceId): SurfaceTier {
  return SURFACE_TIER[id] ?? 'ship';
}

export function isLabsTierSurface(id: SurfaceId): boolean {
  return surfaceTier(id) === 'labs';
}

export function isSurfaceAccessible(id: SurfaceId, labs: LabsConfig): boolean {
  const tier = surfaceTier(id);
  if (tier === 'ship') return true;
  if (tier === 'cut') return false;
  if (!labs.enabled) return false;
  const feature = SURFACE_LAB_FEATURE[id];
  if (!feature) return true;
  return labs.features?.[feature] === true;
}

/** Ship-tier workspace panes — file-backed canon exists, but the shell is not product-ready yet. */
export const WORKSPACE_PREVIEW_SURFACES: ReadonlySet<SurfaceId> = new Set([
  'practices',
  'routines',
  'curation',
  'checks',
  'autonomy',
  'skills',
]);

export function isSurfaceComingSoon(id: SurfaceId, labs: LabsConfig): boolean {
  if (WORKSPACE_PREVIEW_SURFACES.has(id)) return true;
  return isLabsTierSurface(id) && !isSurfaceAccessible(id, labs);
}

export type LabsSurfaceGate = 'loading' | 'coming-soon' | 'open';

/** Gate Labs-tier surfaces until config hydrates — avoids false "coming soon" on first paint. */
export function labsSurfaceGate(id: SurfaceId, labs: LabsConfig, hydrated: boolean): LabsSurfaceGate {
  if (!isLabsTierSurface(id)) return 'open';
  if (!hydrated) return 'loading';
  if (!isSurfaceAccessible(id, labs)) return 'coming-soon';
  return 'open';
}

/** Product gate for sidebar badges and main-pane content (Chat + Settings stay live). */
export function surfaceGate(id: SurfaceId, labs: LabsConfig, hydrated: boolean): LabsSurfaceGate {
  if (id === 'chat' || id === 'settings') return 'open';
  const labsGate = labsSurfaceGate(id, labs, hydrated);
  if (labsGate !== 'open') return labsGate;
  if (WORKSPACE_PREVIEW_SURFACES.has(id)) {
    if (id === 'receipts' && isSampleReceiptPreview()) return 'open';
    return 'coming-soon';
  }
  return 'open';
}

export function surfaceLabel(id: SurfaceId): string {
  const fromFeature = Object.entries(SURFACE_LAB_FEATURE).find(([sid]) => sid === id);
  if (fromFeature) {
    const meta = LAB_FEATURE_META[fromFeature[1] as LabFeatureId];
    if (meta.surfaces?.includes(id)) return meta.label.split(' (')[0] ?? meta.label;
  }
  return id.charAt(0).toUpperCase() + id.slice(1);
}
