import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  defaultLabsConfig,
  getLabsConfig,
  isImageGenEnabled,
  isVoiceRealtimeEnabled,
  LAB_FEATURE_IDS,
  normalizeLabsConfig,
} from '../../electron/labs-config';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');
const panelSource = readFileSync(join(import.meta.dir, '../labs/LabsFeaturesPanel.tsx'), 'utf8');

describe('Labs voice/image feature gates (#578)', () => {
  it('registers voice_realtime and image_gen in LAB_FEATURE_IDS', () => {
    expect(LAB_FEATURE_IDS).toContain('voice_realtime');
    expect(LAB_FEATURE_IDS).toContain('image_gen');
  });

  it('defaults both features off on fresh profile', () => {
    const labs = defaultLabsConfig();
    expect(isVoiceRealtimeEnabled(labs)).toBe(false);
    expect(isImageGenEnabled(labs)).toBe(false);
    expect(getLabsConfig({ labs } as never).features?.voice_realtime).toBeUndefined();
    expect(getLabsConfig({ labs } as never).features?.image_gen).toBeUndefined();
  });

  it('requires explicit master + feature opt-in (no silent enable)', () => {
    const masterOnly = normalizeLabsConfig({ enabled: true, features: {} });
    expect(isVoiceRealtimeEnabled(masterOnly)).toBe(false);
    expect(isImageGenEnabled(masterOnly)).toBe(false);

    const featureWithoutMaster = normalizeLabsConfig({
      enabled: false,
      features: { voice_realtime: true, image_gen: true },
    });
    expect(isVoiceRealtimeEnabled(featureWithoutMaster)).toBe(false);
    expect(isImageGenEnabled(featureWithoutMaster)).toBe(false);

    const optedIn = normalizeLabsConfig({
      enabled: true,
      features: { voice_realtime: true, image_gen: true },
    });
    expect(isVoiceRealtimeEnabled(optedIn)).toBe(true);
    expect(isImageGenEnabled(optedIn)).toBe(true);
  });

  it('Settings General shows Voice & image Labs panel with blocked copy', () => {
    expect(panesSource).toContain('settings-voice-image-labs');
    expect(panesSource).toContain('settingsCopy.voiceImageTitle');
    expect(panesSource).toContain('<LabsFeaturesPanel />');
    expect(panelSource).toContain("'voice_realtime'");
    expect(panelSource).toContain("'image_gen'");
    expect(panelSource).toContain('settingsCopy.voiceImageLabsGate');
    expect(panelSource).toContain('setFeatureEnabled');
  });
});
