import { describe, expect, test } from 'bun:test';
import { defaultLabsConfig } from '../electron/labs-config';
import {
  isSurfaceAccessible,
  isSurfaceComingSoon,
  labsSurfaceGate,
  surfaceTier,
} from './surface-tiers';

describe('surface-tiers', () => {
  test('ship surfaces always accessible when labs off', () => {
    const labs = defaultLabsConfig();
    expect(surfaceTier('chat')).toBe('ship');
    expect(surfaceTier('tickets')).toBe('ship');
    expect(isSurfaceAccessible('charters', labs)).toBe(true);
    expect(isSurfaceComingSoon('charters', labs)).toBe(false);
  });

  test('labs surfaces blocked until master and feature enabled', () => {
    const off = defaultLabsConfig();
    expect(isSurfaceComingSoon('knowledge', off)).toBe(true);
    expect(isSurfaceAccessible('knowledge', off)).toBe(false);

    const masterOnly = { enabled: true, features: {} };
    expect(isSurfaceComingSoon('knowledge', masterOnly)).toBe(true);

    const on = { enabled: true, features: { knowledge_cognee: true } };
    expect(isSurfaceAccessible('knowledge', on)).toBe(true);
    expect(isSurfaceComingSoon('knowledge', on)).toBe(false);
  });

  test('labsSurfaceGate waits for hydration before coming soon', () => {
    const enabled = { enabled: true, features: { knowledge_cognee: true } };
    expect(labsSurfaceGate('charters', enabled, false)).toBe('open');
    expect(labsSurfaceGate('knowledge', enabled, false)).toBe('loading');
    expect(labsSurfaceGate('knowledge', enabled, true)).toBe('open');
    expect(labsSurfaceGate('knowledge', defaultLabsConfig(), true)).toBe('coming-soon');
  });
});
