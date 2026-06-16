import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  defaultLabsConfig,
  getLabsConfig,
  isPreviewCanvasEnabled,
  LAB_FEATURE_IDS,
  normalizeLabsConfig,
} from '../../electron/labs-config';

const previewPaneSource = readFileSync(join(import.meta.dir, '../components/PreviewPane.tsx'), 'utf8');
const panelSource = readFileSync(join(import.meta.dir, '../labs/LabsFeaturesPanel.tsx'), 'utf8');

describe('Labs preview_canvas feature gate (#661)', () => {
  it('registers preview_canvas in LAB_FEATURE_IDS', () => {
    expect(LAB_FEATURE_IDS).toContain('preview_canvas');
  });

  it('defaults preview_canvas off on fresh profile', () => {
    const labs = defaultLabsConfig();
    expect(isPreviewCanvasEnabled(labs)).toBe(false);
    expect(getLabsConfig({ labs } as never).features?.preview_canvas).toBeUndefined();
  });

  it('requires explicit master + feature opt-in (no silent enable)', () => {
    const masterOnly = normalizeLabsConfig({ enabled: true, features: {} });
    expect(isPreviewCanvasEnabled(masterOnly)).toBe(false);

    const featureWithoutMaster = normalizeLabsConfig({
      enabled: false,
      features: { preview_canvas: true },
    });
    expect(isPreviewCanvasEnabled(featureWithoutMaster)).toBe(false);

    const optedIn = normalizeLabsConfig({
      enabled: true,
      features: { preview_canvas: true },
    });
    expect(isPreviewCanvasEnabled(optedIn)).toBe(true);
  });

  it('PreviewPane uses canvas wrapper only when Labs feature is on', () => {
    expect(previewPaneSource).toContain("isFeatureEnabled('preview_canvas')");
    expect(previewPaneSource).toContain('wrapHtmlForCanvasPreview');
    expect(previewPaneSource).toContain('wrapHtmlForSandboxPreview');
    expect(previewPaneSource).toContain('PREVIEW_IFRAME_SANDBOX');
  });

  it('Settings Labs panel exposes preview_canvas toggle', () => {
    expect(panelSource).toContain("'preview_canvas'");
    expect(panelSource).toContain('settingsCopy.previewCanvasFeatureBlocked');
  });
});
