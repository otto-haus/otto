import { describe, expect, test } from 'bun:test';
import {
  canTogglePreviewFullscreen,
  isPreviewFullscreenExitKey,
  isPreviewFullscreenShortcut,
} from './preview-fullscreen';

describe('isPreviewFullscreenShortcut', () => {
  test('matches ⌘⇧F', () => {
    expect(isPreviewFullscreenShortcut({ key: 'f', metaKey: true, ctrlKey: false, shiftKey: true, altKey: false })).toBe(true);
    expect(isPreviewFullscreenShortcut({ key: 'F', metaKey: true, ctrlKey: false, shiftKey: true, altKey: false })).toBe(true);
  });

  test('ignores other chords', () => {
    expect(isPreviewFullscreenShortcut({ key: 'f', metaKey: true, ctrlKey: false, shiftKey: false, altKey: false })).toBe(false);
    expect(isPreviewFullscreenShortcut({ key: 'p', metaKey: true, ctrlKey: false, shiftKey: true, altKey: false })).toBe(false);
  });
});

describe('isPreviewFullscreenExitKey', () => {
  test('Escape exits', () => {
    expect(isPreviewFullscreenExitKey('Escape')).toBe(true);
    expect(isPreviewFullscreenExitKey('Enter')).toBe(false);
  });
});

describe('canTogglePreviewFullscreen', () => {
  test('requires open pane with content', () => {
    expect(canTogglePreviewFullscreen(true, true)).toBe(true);
    expect(canTogglePreviewFullscreen(false, true)).toBe(false);
    expect(canTogglePreviewFullscreen(true, false)).toBe(false);
  });
});
