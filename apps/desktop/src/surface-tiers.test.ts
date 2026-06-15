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
  'terminal',
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
    expect(surfaceTier('terminal')).toBe('ship');
    expect(isSurfaceAccessible('charters', labs)).toBe(true);
    expect(isSurfaceComingSoon('charters', labs)).toBe(true);
    expect(isSurfaceComingSoon('terminal', labs)).toBe(false);
    expect(surfaceGate('charters', labs, true)).toBe('coming-soon');
    expect(surfaceGate('terminal', labs, true)).toBe('open');
    expect(surfaceGate('chat', labs, true)).toBe('open');
    expect(surfaceGate('settings', labs, true)).toBe('open');
  });

  test('knowledge and channels are ship-tier and open without Labs', () => {
    const labs = defaultLabsConfig();
    expect(surfaceTier('knowledge')).toBe('ship');
    expect(surfaceTier('channels')).toBe('ship');
    expect(isSurfaceComingSoon('knowledge', labs)).toBe(false);
    expect(surfaceGate('knowledge', labs, true)).toBe('open');
    expect(surfaceGate('channels', labs, true)).toBe('open');
  });

  test('receipts surface is open for onboarding payoff (#139)', () => {
    const labs = defaultLabsConfig();
    expect(isSurfaceComingSoon('receipts', labs)).toBe(false);
    expect(surfaceGate('receipts', labs, true)).toBe('open');
  });

  test('receipts stays open during onboarding sample education (#139)', () => {
    const labs = defaultLabsConfig();
    const store = new Map<string, string>();
    const prior = globalThis.sessionStorage;
    globalThis.sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    } as Storage;

    try {
      expect(surfaceGate('receipts', labs, true)).toBe('open');
      store.set('otto.onboarding.sampleReceipt.v1', '1');
      expect(surfaceGate('receipts', labs, true)).toBe('open');
      expect(surfaceGate('charters', labs, true)).toBe('coming-soon');
    } finally {
      globalThis.sessionStorage = prior;
    }
  });

  test('labsSurfaceGate delegates to surfaceGate', () => {
    expect(labsSurfaceGate('knowledge', defaultLabsConfig(), true)).toBe('open');
    expect(labsSurfaceGate('charters', defaultLabsConfig(), false)).toBe('coming-soon');
  });
});
