import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { LabFeatureId, LabsConfig } from '../../electron/shared/types';
import type { SurfaceId } from '../components/Sidebar';
import { ottoApi } from '../runtime';
import { isSurfaceAccessible, surfaceGate } from '../surface-tiers';
import { defaultLabsConfig } from '../../electron/labs-config';
import { LabsContext, type LabsContextValue } from './labs-context';

function normalize(labs: LabsConfig | undefined): LabsConfig {
  return {
    enabled: labs?.enabled ?? false,
    features: { ...(labs?.features ?? {}) },
  };
}

export function LabsProvider({ children }: { children: React.ReactNode }) {
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
    isEnabled: (id: SurfaceId) => isSurfaceAccessible(id, labs),
    isComingSoon: (id: SurfaceId) => surfaceGate(id, labs, hydrated) === 'coming-soon',
    isFeatureEnabled: (id: LabFeatureId) => labs.enabled === true && labs.features?.[id] === true,
    setMasterEnabled,
    setFeatureEnabled,
  }), [labs, hydrated, setMasterEnabled, setFeatureEnabled]);

  return <LabsContext.Provider value={value}>{children}</LabsContext.Provider>;
}
