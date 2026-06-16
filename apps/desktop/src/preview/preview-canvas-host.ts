import type { SurfaceId } from '../components/Sidebar';
import { openSettingsSection, type SettingsSectionId } from '../settings-section-nav';
import { openReceipt } from '../surface-selection-nav';
import type { PreviewCanvasActionId } from './preview-canvas-actions';

const SURFACE_IDS = new Set<SurfaceId>([
  'chat',
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
  'settings',
]);

const SETTINGS_SECTION_IDS = new Set<SettingsSectionId>([
  'general',
  'display',
  'providers',
  'memory',
  'culture',
  'diagnostics',
]);

export type PreviewCanvasDiagnostics = {
  export: () => Promise<{ bundlePath: string }>;
};

export type PreviewCanvasHostToast = {
  push: (toast: { title: string; body?: string; tone: 'ok' | 'warn' }) => void;
};

export type PreviewCanvasHostDeps = {
  action: PreviewCanvasActionId;
  target: string | null;
  onNavigate?: (surface: SurfaceId) => void;
  diagnostics?: PreviewCanvasDiagnostics | null;
  toast?: PreviewCanvasHostToast | null;
  copyText?: (text: string) => Promise<void>;
};

export function isCanvasSurfaceId(value: string): value is SurfaceId {
  return SURFACE_IDS.has(value as SurfaceId);
}

export function isCanvasSettingsSection(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.has(value as SettingsSectionId);
}

/** Parse navigate_surface target: surface id, settings section, or `settings/<section>`. */
export function parseCanvasNavigateTarget(raw: string | null): {
  surface: SurfaceId;
  settingsSection?: SettingsSectionId;
} | null {
  const target = raw?.trim();
  if (!target) return null;

  if (target.startsWith('settings/')) {
    const section = target.slice('settings/'.length);
    if (isCanvasSettingsSection(section)) {
      return { surface: 'settings', settingsSection: section };
    }
    return null;
  }

  if (isCanvasSettingsSection(target)) {
    return { surface: 'settings', settingsSection: target };
  }

  if (isCanvasSurfaceId(target)) {
    return { surface: target };
  }

  return null;
}

export async function executePreviewCanvasHostAction(deps: PreviewCanvasHostDeps): Promise<void> {
  const { action, target, onNavigate, diagnostics, toast, copyText } = deps;

  if (action === 'navigate_surface') {
    const parsed = parseCanvasNavigateTarget(target);
    if (!parsed) {
      toast?.push({
        title: 'Preview canvas',
        body: target ? `Unknown navigation target: ${target}` : 'Navigation target required',
        tone: 'warn',
      });
      return;
    }
    if (parsed.settingsSection) {
      openSettingsSection(parsed.settingsSection);
    }
    if (onNavigate) {
      onNavigate(parsed.surface);
    } else if (typeof location !== 'undefined') {
      location.hash = parsed.surface;
    }
    return;
  }

  if (action === 'open_receipt') {
    const receiptId = target?.trim();
    if (!receiptId) {
      toast?.push({ title: 'Preview canvas', body: 'Receipt id required', tone: 'warn' });
      return;
    }
    openReceipt(receiptId, onNavigate ? (surface) => onNavigate(surface) : undefined);
    return;
  }

  if (action === 'copy_diagnostic') {
    if (!diagnostics) {
      toast?.push({ title: 'Preview canvas', body: 'Diagnostics export unavailable', tone: 'warn' });
      return;
    }
    try {
      const result = await diagnostics.export();
      const write = copyText ?? ((text: string) => navigator.clipboard.writeText(text));
      await write(result.bundlePath);
      toast?.push({
        title: 'Diagnostics copied',
        body: result.bundlePath,
        tone: 'ok',
      });
    } catch (error) {
      toast?.push({
        title: 'Diagnostics export failed',
        body: error instanceof Error ? error.message : String(error),
        tone: 'warn',
      });
    }
  }
}
