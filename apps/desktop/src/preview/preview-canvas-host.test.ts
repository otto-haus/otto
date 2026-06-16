import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  executePreviewCanvasHostAction,
  isCanvasSurfaceId,
  parseCanvasNavigateTarget,
} from './preview-canvas-host';

describe('preview canvas host handlers (#661 follow-up)', () => {
  const priorStorage = globalThis.sessionStorage;

  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    } as Storage;
  });

  afterEach(() => {
    globalThis.sessionStorage = priorStorage;
  });

  it('parses surface and settings subsection targets', () => {
    expect(parseCanvasNavigateTarget('settings')).toEqual({ surface: 'settings' });
    expect(parseCanvasNavigateTarget('receipts')).toEqual({ surface: 'receipts' });
    expect(parseCanvasNavigateTarget('diagnostics')).toEqual({
      surface: 'settings',
      settingsSection: 'diagnostics',
    });
    expect(parseCanvasNavigateTarget('settings/diagnostics')).toEqual({
      surface: 'settings',
      settingsSection: 'diagnostics',
    });
    expect(parseCanvasNavigateTarget('unknown')).toBeNull();
    expect(parseCanvasNavigateTarget(null)).toBeNull();
  });

  it('recognizes sidebar surface ids', () => {
    expect(isCanvasSurfaceId('chat')).toBe(true);
    expect(isCanvasSurfaceId('settings')).toBe(true);
    expect(isCanvasSurfaceId('nope')).toBe(false);
  });

  it('navigate_surface opens settings subsection and navigates', async () => {
    const onNavigate = mock((surface: string) => surface);

    await executePreviewCanvasHostAction({
      action: 'navigate_surface',
      target: 'settings/diagnostics',
      onNavigate,
    });

    expect(sessionStorage.getItem('otto.settings.section')).toBe('diagnostics');
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('open_receipt stages receipt id and navigates', async () => {
    const onNavigate = mock((_surface: string) => {});

    await executePreviewCanvasHostAction({
      action: 'open_receipt',
      target: 'rcpt-canvas-1',
      onNavigate,
    });

    expect(sessionStorage.getItem('otto.receipts.selectedId')).toBe('rcpt-canvas-1');
    expect(onNavigate).toHaveBeenCalledWith('receipts');
  });

  it('copy_diagnostic exports bundle path to clipboard', async () => {
    const copyText = mock(async (_text: string) => {});
    const diagnostics = {
      export: mock(async () => ({ bundlePath: '/tmp/otto-diagnostics.zip' })),
    };
    const toast = { push: mock((_t: unknown) => {}) };

    await executePreviewCanvasHostAction({
      action: 'copy_diagnostic',
      target: null,
      diagnostics,
      toast,
      copyText,
    });

    expect(diagnostics.export).toHaveBeenCalled();
    expect(copyText).toHaveBeenCalledWith('/tmp/otto-diagnostics.zip');
    expect(toast.push).toHaveBeenCalled();
  });
});
