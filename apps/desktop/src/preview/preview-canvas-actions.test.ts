import { describe, expect, it } from 'bun:test';
import {
  isPreviewCanvasActionMessage,
  PREVIEW_CANVAS_DENIED_ACTIONS,
  PREVIEW_CANVAS_FIXTURE_HTML,
  PREVIEW_CANVAS_MESSAGE_TYPE,
  validatePreviewCanvasAction,
} from './preview-canvas-actions';
import { wrapHtmlForCanvasPreview } from './preview-canvas';

describe('preview canvas actions (#661)', () => {
  it('allows navigate_surface and rejects shell in fixture HTML', () => {
    const wrapped = wrapHtmlForCanvasPreview(PREVIEW_CANVAS_FIXTURE_HTML);
    expect(wrapped).toContain('data-otto-action="navigate_surface"');
    expect(wrapped).toContain('data-otto-action="shell"');
    expect(wrapped).toContain(PREVIEW_CANVAS_MESSAGE_TYPE);
    expect(wrapped).toContain('DENIED');
  });

  it('validates allowed actions and denies irreversible ones', () => {
    expect(
      validatePreviewCanvasAction({
        type: PREVIEW_CANVAS_MESSAGE_TYPE,
        action: 'navigate_surface',
        target: 'settings',
      }),
    ).toEqual({ ok: true, action: 'navigate_surface', target: 'settings' });

    expect(
      validatePreviewCanvasAction({
        type: PREVIEW_CANVAS_MESSAGE_TYPE,
        action: 'shell',
        target: 'rm -rf /',
      }),
    ).toEqual({ ok: false, reason: 'denied' });

    expect(
      validatePreviewCanvasAction({
        type: PREVIEW_CANVAS_MESSAGE_TYPE,
        action: 'unknown_thing',
      }),
    ).toEqual({ ok: false, reason: 'unknown_action' });
  });

  it('recognizes bridge postMessage shape', () => {
    expect(
      isPreviewCanvasActionMessage({
        type: PREVIEW_CANVAS_MESSAGE_TYPE,
        action: 'copy_diagnostic',
      }),
    ).toBe(true);
    expect(isPreviewCanvasActionMessage({ type: 'other', action: 'x' })).toBe(false);
    expect(isPreviewCanvasActionMessage(null)).toBe(false);
  });

  it('documents deny list for irreversible actions', () => {
    expect(PREVIEW_CANVAS_DENIED_ACTIONS).toContain('shell');
    expect(PREVIEW_CANVAS_DENIED_ACTIONS).toContain('exec');
    expect(PREVIEW_CANVAS_DENIED_ACTIONS).toContain('send_message');
  });
});
