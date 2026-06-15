import { describe, expect, test } from 'bun:test';
import { defaultLabsConfig } from '../electron/labs-config';
import type { SurfaceId } from './components/Sidebar';
import {
  effectiveConnectionMode,
  gatedConnectionMode,
  isRemoteLettaCloudEnabled,
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

  test('charters surface is open for ship (#447)', () => {
    const labs = defaultLabsConfig();
    expect(surfaceTier('charters')).toBe('ship');
    expect(isSurfaceAccessible('charters', labs)).toBe(true);
    expect(isSurfaceComingSoon('charters', labs)).toBe(false);
    expect(surfaceGate('charters', labs, true)).toBe('open');
  });

  test('ship workspace previews show coming soon in the product shell', () => {
    const labs = defaultLabsConfig();
    expect(surfaceTier('chat')).toBe('ship');
    expect(surfaceTier('tickets')).toBe('ship');
    expect(surfaceTier('terminal')).toBe('ship');
    expect(isSurfaceComingSoon('terminal', labs)).toBe(false);
    expect(surfaceGate('terminal', labs, true)).toBe('open');
    expect(surfaceGate('chat', labs, true)).toBe('open');
    expect(surfaceGate('settings', labs, true)).toBe('open');
  });

  test('tickets surface is open for Paperclip intake (#92)', () => {
    const labs = defaultLabsConfig();
    expect(isSurfaceComingSoon('tickets', labs)).toBe(false);
    expect(surfaceGate('tickets', labs, true)).toBe('open');
  });

  test('receipts surface is open for onboarding payoff (#139)', () => {
    const labs = defaultLabsConfig();
    expect(isSurfaceComingSoon('receipts', labs)).toBe(false);
    expect(surfaceGate('receipts', labs, true)).toBe('open');
  });

  test('standards surface is open (#448)', () => {
    const labs = defaultLabsConfig();
    expect(surfaceTier('standards')).toBe('ship');
    expect(isSurfaceComingSoon('standards', labs)).toBe(false);
    expect(surfaceGate('standards', labs, true)).toBe('open');
  });

  test('practices surface is open for ship (#449)', () => {
    const labs = defaultLabsConfig();
    expect(isSurfaceComingSoon('practices', labs)).toBe(false);
    expect(surfaceGate('practices', labs, true)).toBe('open');
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
      expect(surfaceGate('charters', labs, true)).toBe('open');
    } finally {
      globalThis.sessionStorage = prior;
    }
  });

  test('knowledge and channels surfaces are open (Labs tab removed)', () => {
    const labs = defaultLabsConfig();
    expect(surfaceTier('knowledge')).toBe('ship');
    expect(surfaceTier('channels')).toBe('ship');
    expect(isSurfaceComingSoon('knowledge', labs)).toBe(false);
    expect(isSurfaceAccessible('knowledge', labs)).toBe(true);
    expect(surfaceGate('knowledge', labs, true)).toBe('open');
    expect(surfaceGate('channels', labs, true)).toBe('open');
  });

  test('labsSurfaceGate no longer blocks on hydration', () => {
    expect(labsSurfaceGate('knowledge', defaultLabsConfig(), false)).toBe('open');
    expect(labsSurfaceGate('routines', defaultLabsConfig(), false)).toBe('coming-soon');
  });

  test('remote_letta_cloud gate hides cloud connection mode for Ship users (#627)', () => {
    const off = defaultLabsConfig();
    expect(isRemoteLettaCloudEnabled(off)).toBe(false);
    expect(effectiveConnectionMode('cloud', off)).toBe('existing');
    expect(effectiveConnectionMode('embedded', off)).toBe('embedded');
    expect(effectiveConnectionMode('existing', off)).toBe('existing');

    const masterOnly = { enabled: true, features: {} };
    expect(isRemoteLettaCloudEnabled(masterOnly)).toBe(false);
    expect(effectiveConnectionMode('cloud', masterOnly)).toBe('existing');

    const on = { enabled: true, features: { remote_letta_cloud: true } };
    expect(isRemoteLettaCloudEnabled(on)).toBe(true);
    expect(effectiveConnectionMode('cloud', on)).toBe('cloud');
  });

  test('gatedConnectionMode defers Labs clamp until hydration (#627)', () => {
    const off = defaultLabsConfig();
    const on = { enabled: true, features: { remote_letta_cloud: true } };

    expect(gatedConnectionMode('cloud', off, false)).toBe('cloud');
    expect(gatedConnectionMode('cloud', off, true)).toBe('existing');
    expect(gatedConnectionMode('cloud', on, false)).toBe('cloud');
    expect(gatedConnectionMode('cloud', on, true)).toBe('cloud');
    expect(gatedConnectionMode('embedded', off, false)).toBe('embedded');
  });
});
