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
  knowledge: 'ship',
  channels: 'ship',
};

/** Legacy lab-feature map — no sidebar surfaces remain Labs-gated (Settings Labs tab removed). */
export const SURFACE_LAB_FEATURE: Partial<Record<SurfaceId, LabFeatureId>> = {};

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
    blurb: 'Local vector recall store — env-gated retrieval path.',
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
    label: 'Worker loop',
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
  turn_phase_timeline: {
    label: 'Turn phase timeline',
    blurb: 'Orient → locate → edit → verify chips on collapsed turn trail (Labs). See docs/v1/agent-turn-trail.md.',
  },
  voice_realtime: {
    label: 'Realtime voice',
    blurb: 'Speak to capture a transcript artifact — Letta holds the Realtime session and API key.',
  },
  image_gen: {
    label: 'Image generation',
    blurb: 'Letta tool path for generated images saved as artifacts — not auto-canon until ratified.',
  },
  preview_canvas: {
    label: 'Interactive preview canvas',
    blurb: 'Sandboxed HTML buttons that dispatch otto-defined actions — not arbitrary shell or exec.',
  },
};

export function surfaceTier(id: SurfaceId): SurfaceTier {
  return SURFACE_TIER[id] ?? 'ship';
}

export function isLabsTierSurface(id: SurfaceId): boolean {
  return surfaceTier(id) === 'labs';
}

export function isSurfaceAccessible(_id: SurfaceId, _labs?: LabsConfig): boolean {
  return surfaceTier(_id) === 'ship';
}

/** Ship-tier workspace panes — file-backed canon exists, but the shell is not product-ready yet. */
export const WORKSPACE_PREVIEW_SURFACES: ReadonlySet<SurfaceId> = new Set([
  'curation',
  'autonomy',
  'skills',
]);

export function isSurfaceComingSoon(id: SurfaceId, _labs?: LabsConfig): boolean {
  if (WORKSPACE_PREVIEW_SURFACES.has(id)) return true;
  return surfaceTier(id) === 'cut';
}

export type LabsSurfaceGate = 'loading' | 'coming-soon' | 'open';

/** @deprecated Labs nav gating removed — kept for callers migrating off LabsContext. */
export function labsSurfaceGate(id: SurfaceId, _labs?: LabsConfig, _hydrated?: boolean): LabsSurfaceGate {
  return surfaceGate(id);
}

/** Product gate for sidebar badges and main-pane content (Chat + Settings stay live). */
export function surfaceGate(id: SurfaceId, _labs?: LabsConfig, _hydrated?: boolean): LabsSurfaceGate {
  if (id === 'chat' || id === 'settings') return 'open';
  if (id === 'receipts' && isSampleReceiptPreview()) return 'open';
  if (WORKSPACE_PREVIEW_SURFACES.has(id)) return 'coming-soon';
  if (surfaceTier(id) === 'cut') return 'coming-soon';
  return 'open';
}

/** Topbar pill data source — live runtime vs file-backed workspace canon. */
export type SurfaceDataKind = 'live' | 'file';

const LIVE_DATA_SURFACES: ReadonlySet<SurfaceId> = new Set(['chat', 'settings', 'terminal']);

export function surfaceDataKind(id: SurfaceId): SurfaceDataKind | undefined {
  if (LIVE_DATA_SURFACES.has(id)) return 'live';
  if (surfaceTier(id) === 'cut') return undefined;
  return 'file';
}

/** Sidebar shows shipped surfaces only — preview/Labs-locked items stay out of nav. */
export function isSurfaceInSidebar(id: SurfaceId, labs: LabsConfig, hydrated: boolean): boolean {
  if (id === 'chat' || id === 'settings') return false;
  return surfaceGate(id, labs, hydrated) === 'open';
}

export function surfaceLabel(id: SurfaceId): string {
  const fromFeature = Object.entries(SURFACE_LAB_FEATURE).find(([sid]) => sid === id);
  if (fromFeature) {
    const meta = LAB_FEATURE_META[fromFeature[1] as LabFeatureId];
    if (meta.surfaces?.includes(id)) return meta.label.split(' (')[0] ?? meta.label;
  }
  return id.charAt(0).toUpperCase() + id.slice(1);
}
