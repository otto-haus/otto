import { createContext, useContext } from 'react';
import type { LabFeatureId, LabsConfig } from '../../electron/shared/types';
import type { SurfaceId } from '../components/Sidebar';
import { defaultLabsConfig } from '../../electron/labs-config';
import { isSurfaceAccessible, surfaceGate } from '../surface-tiers';

export type LabsContextValue = {
  labs: LabsConfig;
  hydrated: boolean;
  isEnabled: (id: SurfaceId) => boolean;
  isComingSoon: (id: SurfaceId) => boolean;
  isFeatureEnabled: (id: LabFeatureId) => boolean;
  setMasterEnabled: (enabled: boolean) => Promise<void>;
  setFeatureEnabled: (id: LabFeatureId, enabled: boolean) => Promise<void>;
};

export const LabsContext = createContext<LabsContextValue | null>(null);

export function useLabs(): LabsContextValue {
  const ctx = useContext(LabsContext);
  if (!ctx) {
    const fallback = defaultLabsConfig();
    return {
      labs: fallback,
      hydrated: true,
      isEnabled: (id) => isSurfaceAccessible(id, fallback),
      isComingSoon: (id) => surfaceGate(id, fallback, true) === 'coming-soon',
      isFeatureEnabled: () => false,
      setMasterEnabled: async () => {},
      setFeatureEnabled: async () => {},
    };
  }
  return ctx;
}
