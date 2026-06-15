import { describe, expect, test } from 'bun:test';
import { defaultLabsConfig } from '../electron/labs-config';
import type { SurfaceId } from './components/Sidebar';
import {
  isSurfaceAccessible,
  isSurfaceComingSoon,
  labsSurfaceGate,
  surfaceGate,
  surfaceTier,
} from './surface-tiers';

const ALL_SURFACES: SurfaceId[] = [
  'chat',
  'settings',
  'charters',
  'standards',
  'practices',
  'routines',
  'curation',
  'receipts',
  'checks',
  'autonomy',
  'skills',
  'knowledge',
  'tickets',
  'channels',
];

describe('surface-tiers', () => {
  test('no sidebar surface is Cut tier (Cut items stay out of nav)', () => {
    for (const id of ALL_SURFACES) {
      expect(surfaceTier(id)).not.toBe('cut');
    }
  });

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

  test('receipts opens during onboarding sample education', () => {
    const labs = defaultLabsConfig();
    const store = new Map<string, string>();
    const prior = globalThis.sessionStorage;
    globalThis.sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    } as Storage;

    try {
      expect(surfaceGate('receipts', labs, true)).toBe('coming-soon');
      store.set('otto.onboarding.sampleReceipt.v1', '1');
      expect(surfaceGate('receipts', labs, true)).toBe('open');
      expect(surfaceGate('charters', labs, true)).toBe('coming-soon');
    } finally {
      globalThis.sessionStorage = prior;
    }
  });

  test('labsSurfaceGate waits for hydration before coming soon', () => {
    const enabled = { enabled: true, features: { knowledge_cognee: true } };
    expect(labsSurfaceGate('charters', enabled, false)).toBe('open');
    expect(labsSurfaceGate('knowledge', enabled, false)).toBe('loading');
    expect(labsSurfaceGate('knowledge', enabled, true)).toBe('open');
    expect(labsSurfaceGate('knowledge', defaultLabsConfig(), true)).toBe('coming-soon');
  });
});
