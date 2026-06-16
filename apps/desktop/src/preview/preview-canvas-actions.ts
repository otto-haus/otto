/** Otto-defined actions interactive canvas HTML may dispatch — not arbitrary shell/exec (#661). */

export const PREVIEW_CANVAS_MESSAGE_TYPE = 'otto-preview-canvas-action' as const;

export const PREVIEW_CANVAS_ALLOWED_ACTIONS = [
  'navigate_surface',
  'copy_diagnostic',
  'open_receipt',
] as const;

export type PreviewCanvasActionId = (typeof PREVIEW_CANVAS_ALLOWED_ACTIONS)[number];

/** Irreversible or host-escape actions — always blocked even when Labs canvas is on. */
export const PREVIEW_CANVAS_DENIED_ACTIONS = [
  'shell',
  'exec',
  'eval',
  'fetch',
  'write_file',
  'delete_file',
  'send_message',
] as const;

export type PreviewCanvasDeniedActionId = (typeof PREVIEW_CANVAS_DENIED_ACTIONS)[number];

export type PreviewCanvasActionMessage = {
  type: typeof PREVIEW_CANVAS_MESSAGE_TYPE;
  action: string;
  target?: string | null;
};

export type PreviewCanvasActionValidation =
  | { ok: true; action: PreviewCanvasActionId; target: string | null }
  | { ok: false; reason: 'invalid_message' | 'denied' | 'unknown_action' };

export function isPreviewCanvasActionMessage(data: unknown): data is PreviewCanvasActionMessage {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return record.type === PREVIEW_CANVAS_MESSAGE_TYPE && typeof record.action === 'string';
}

export function validatePreviewCanvasAction(message: PreviewCanvasActionMessage): PreviewCanvasActionValidation {
  const action = message.action.trim();
  if ((PREVIEW_CANVAS_DENIED_ACTIONS as readonly string[]).includes(action)) {
    return { ok: false, reason: 'denied' };
  }
  if (!(PREVIEW_CANVAS_ALLOWED_ACTIONS as readonly string[]).includes(action)) {
    return { ok: false, reason: 'unknown_action' };
  }
  const target = typeof message.target === 'string' ? message.target : message.target == null ? null : null;
  return { ok: true, action: action as PreviewCanvasActionId, target };
}

/** Fixture: allowed navigate button + denied shell button for regression tests. */
export const PREVIEW_CANVAS_FIXTURE_HTML = `<!DOCTYPE html>
<html><body>
  <button data-otto-action="navigate_surface" data-otto-target="settings">Open settings</button>
  <button data-otto-action="shell" data-otto-target="rm -rf /">Blocked shell</button>
</body></html>`;
