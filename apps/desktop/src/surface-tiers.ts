import type { SurfaceId } from './components/Sidebar';
import type { LabFeatureId, LabsConfig } from '../electron/shared/types';
import { isSampleReceiptPreview } from './onboarding-sample-receipt';

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
};

export function surfaceTier(id: SurfaceId): SurfaceTier {
  return SURFACE_TIER[id] ?? 'ship';
}

export function isLabsTierSurface(id: SurfaceId): boolean {
  return surfaceTier(id) === 'labs';
}

export function isSurfaceAccessible(id: SurfaceId, _labs?: LabsConfig): boolean {
  return surfaceTier(id) === 'ship';
}

/** Ship-tier workspace panes — file-backed canon exists, but the shell is not product-ready yet. */
export const WORKSPACE_PREVIEW_SURFACES: ReadonlySet<SurfaceId> = new Set([
  'charters',
  'standards',
  'practices',
  'routines',
  'curation',
  'checks',
  'autonomy',
  'skills',
  'tickets',
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

export function surfaceLabel(id: SurfaceId): string {
  const fromFeature = Object.entries(SURFACE_LAB_FEATURE).find(([sid]) => sid === id);
  if (fromFeature) {
    const meta = LAB_FEATURE_META[fromFeature[1] as LabFeatureId];
    if (meta.surfaces?.includes(id)) return meta.label.split(' (')[0] ?? meta.label;
  }
  return id.charAt(0).toUpperCase() + id.slice(1);
}
