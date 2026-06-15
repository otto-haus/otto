import { describe, expect, it } from 'bun:test';
import {
  DEFAULT_COMPOSER_SEND_SHORTCUT,
  composerHintKey,
  normalizeComposerSendShortcut,
  shouldComposerShortcutSubmit,
} from './composer-keyboard';

describe('composer keyboard (#48)', () => {
  it('defaults to Tab send for steering-first compose', () => {
    expect(DEFAULT_COMPOSER_SEND_SHORTCUT).toBe('tab');
    expect(normalizeComposerSendShortcut(undefined)).toBe('tab');
    expect(normalizeComposerSendShortcut('tab')).toBe('tab');
    expect(normalizeComposerSendShortcut('enter')).toBe('enter');
    expect(normalizeComposerSendShortcut('bogus')).toBe('tab');
  });

  it('maps shortcut modes to submit keys', () => {
    expect(shouldComposerShortcutSubmit('Tab', false, 'tab')).toBe(true);
    expect(shouldComposerShortcutSubmit('Tab', true, 'tab')).toBe(false);
    expect(shouldComposerShortcutSubmit('Enter', false, 'tab')).toBe(false);
    expect(shouldComposerShortcutSubmit('Enter', false, 'enter')).toBe(true);
    expect(shouldComposerShortcutSubmit('Enter', true, 'enter')).toBe(false);
  });

  it('selects hint copy keys', () => {
    expect(composerHintKey('tab')).toBe('tab');
    expect(composerHintKey('enter')).toBe('enter');
  });
});
