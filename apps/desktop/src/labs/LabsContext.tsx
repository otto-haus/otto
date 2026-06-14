import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { LabFeatureId, LabsConfig } from '../../electron/shared/types';
import type { SurfaceId } from '../components/Sidebar';
import { ottoApi } from '../runtime';
import {
  isSurfaceAccessible,
  labsSurfaceGate,
  LAB_FEATURE_META,
} from '../surface-tiers';
import { defaultLabsConfig } from '../../electron/labs-config';

type LabsContextValue = {
  labs: LabsConfig;
  hydrated: boolean;
  isEnabled: (id: SurfaceId) => boolean;
  isComingSoon: (id: SurfaceId) => boolean;
  isFeatureEnabled: (id: LabFeatureId) => boolean;
  setMasterEnabled: (enabled: boolean) => Promise<void>;
  setFeatureEnabled: (id: LabFeatureId, enabled: boolean) => Promise<void>;
};

const LabsContext = createContext<LabsContextValue | null>(null);

function normalize(labs: LabsConfig | undefined): LabsConfig {
  return {
    enabled: labs?.enabled ?? false,
    features: { ...(labs?.features ?? {}) },
  };
}

export const LabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [labs, setLabs] = useState<LabsConfig>(() => defaultLabsConfig());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const api = ottoApi();
    if (!api?.labs) {
      setHydrated(true);
      return;
    }
    void api.labs.get().then((cfg) => {
      setLabs(normalize(cfg));
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  const persist = useCallback(async (next: LabsConfig) => {
    setLabs(next);
    await ottoApi()?.labs.set(next);
  }, []);

  const setMasterEnabled = useCallback(async (enabled: boolean) => {
    await persist({ ...labs, enabled });
  }, [labs, persist]);

  const setFeatureEnabled = useCallback(async (id: LabFeatureId, enabled: boolean) => {
    await persist({
      ...labs,
      features: { ...labs.features, [id]: enabled },
    });
  }, [labs, persist]);

  const value = useMemo<LabsContextValue>(() => ({
    labs,
    hydrated,
    isEnabled: (id) => isSurfaceAccessible(id, labs),
    isComingSoon: (id) => labsSurfaceGate(id, labs, hydrated) === 'coming-soon',
    isFeatureEnabled: (id) => labs.enabled === true && labs.features?.[id] === true,
    setMasterEnabled,
    setFeatureEnabled,
  }), [labs, hydrated, setMasterEnabled, setFeatureEnabled]);

  return <LabsContext.Provider value={value}>{children}</LabsContext.Provider>;
};

export function useLabs(): LabsContextValue {
  const ctx = useContext(LabsContext);
  if (!ctx) {
    const fallback = defaultLabsConfig();
    return {
      labs: fallback,
      hydrated: true,
      isEnabled: (id) => isSurfaceAccessible(id, fallback),
      isComingSoon: (id) => labsSurfaceGate(id, fallback, true) === 'coming-soon',
      isFeatureEnabled: () => false,
      setMasterEnabled: async () => {},
      setFeatureEnabled: async () => {},
    };
  }
  return ctx;
}

export { LAB_FEATURE_META };
export { LAB_FEATURE_IDS } from '../../electron/labs-config';
