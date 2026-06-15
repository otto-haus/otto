import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LabFeatureId, LabsConfig } from '../../electron/shared/types';
import type { SurfaceId } from '../components/Sidebar';
import { ottoApi } from '../runtime';
import { useToast } from '../components/toast-context';
import { isSurfaceAccessible, surfaceGate } from '../surface-tiers';
import { defaultLabsConfig } from '../../electron/labs-config';
import { LabsContext, type LabsContextValue } from './labs-context';

function normalize(labs: LabsConfig | undefined): LabsConfig {
  return {
    enabled: labs?.enabled ?? false,
    features: { ...(labs?.features ?? {}) },
  };
}

/** Pure reducer for the Labs master toggle. */
export type LabsUpdate = (prev: LabsConfig) => LabsConfig;

export const masterEnabledUpdate = (enabled: boolean): LabsUpdate =>
  (prev) => ({ ...prev, enabled, features: { ...prev.features } });

export const featureEnabledUpdate = (id: LabFeatureId, enabled: boolean): LabsUpdate =>
  (prev) => ({ ...prev, features: { ...prev.features, [id]: enabled } });

export function LabsProvider({ children }: { children: React.ReactNode }) {
  const [labs, setLabs] = useState<LabsConfig>(() => defaultLabsConfig());
  const [hydrated, setHydrated] = useState(false);
  const { push: pushToast } = useToast();
  // Synchronous source of truth so rapid toggles compose on the latest value rather than a
  // stale render closure (which dropped concurrent updates) (#698).
  const labsRef = useRef(labs);

  const commit = useCallback((next: LabsConfig) => {
    labsRef.current = next;
    setLabs(next);
  }, []);

  useEffect(() => {
    const api = ottoApi();
    if (!api?.labs) {
      setHydrated(true);
      return;
    }
    void api.labs.get().then((cfg) => {
      commit(normalize(cfg));
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, [commit]);

  const persist = useCallback(async (update: LabsUpdate) => {
    const prev = labsRef.current;
    const next = update(prev);
    commit(next);
    try {
      await ottoApi()?.labs.set(next);
    } catch (e) {
      // Revert only if no later toggle superseded this one, so a failed save doesn't clobber
      // concurrent successful changes (#698).
      if (labsRef.current === next) commit(prev);
      pushToast({
        title: 'labs not saved',
        body: e instanceof Error ? e.message : 'Could not persist Labs settings. Reverted to last saved values.',
        tone: 'warn',
      });
    }
  }, [commit, pushToast]);

  const setMasterEnabled = useCallback(
    (enabled: boolean) => persist(masterEnabledUpdate(enabled)),
    [persist],
  );

  const setFeatureEnabled = useCallback(
    (id: LabFeatureId, enabled: boolean) => persist(featureEnabledUpdate(id, enabled)),
    [persist],
  );

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
