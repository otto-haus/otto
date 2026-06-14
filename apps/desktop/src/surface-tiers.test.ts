import { describe, expect, test } from 'bun:test';
import { defaultLabsConfig } from '../electron/labs-config';
import {
  isSurfaceAccessible,
  isSurfaceComingSoon,
  labsSurfaceGate,
  surfaceGate,
  surfaceTier,
} from './surface-tiers';

describe('surface-tiers', () => {
  test('ship workspace previews show coming soon in the product shell', () => {
    const labs = defaultLabsConfig();
    expect(surfaceTier('chat')).toBe('ship');
    expect(surfaceTier('tickets')).toBe('ship');
    expect(isSurfaceAccessible('charters', labs)).toBe(true);
    expect(isSurfaceComingSoon('charters', labs)).toBe(true);
    expect(surfaceGate('charters', labs, true)).toBe('coming-soon');
    expect(surfaceGate('chat', labs, true)).toBe('open');
    expect(surfaceGate('settings', labs, true)).toBe('open');
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
