import { describe, expect, test } from 'bun:test';
import type { LabsConfig } from '../../electron/shared/types';
import { featureEnabledUpdate, masterEnabledUpdate } from './LabsContext';

const base: LabsConfig = { enabled: false, features: {} };

describe('Labs reducers (#698)', () => {
  test('master toggle does not drop existing feature flags', () => {
    const withFeature = featureEnabledUpdate('memory_observatory', true)(base);
    const next = masterEnabledUpdate(true)(withFeature);
    expect(next.enabled).toBe(true);
    expect(next.features.memory_observatory).toBe(true);
  });

  test('sequential feature toggles compose without lost updates', () => {
    // Mirrors the ref-based synchronous composition: each update applies to the latest value.
    const afterA = featureEnabledUpdate('memory_observatory', true)(base);
    const afterB = featureEnabledUpdate('culture_export', true)(afterA);
    expect(afterB.features.memory_observatory).toBe(true);
    expect(afterB.features.culture_export).toBe(true);
  });

  test('reducers do not mutate the previous config (rollback stays valid)', () => {
    const prev: LabsConfig = { enabled: false, features: { culture_export: true } };
    const next = featureEnabledUpdate('culture_export', false)(prev);
    expect(prev.features.culture_export).toBe(true);
    expect(next.features.culture_export).toBe(false);
    expect(next).not.toBe(prev);
    expect(next.features).not.toBe(prev.features);
  });
});
