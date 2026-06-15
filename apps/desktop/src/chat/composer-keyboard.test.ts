import { describe, expect, it } from 'bun:test';
import {
  DEFAULT_COMPOSER_SEND_SHORTCUT,
  composerHintKey,
  normalizeComposerSendShortcut,
  shouldComposerShortcutSubmit,
} from './composer-keyboard';

describe('composer keyboard (#48)', () => {
  it('defaults to Enter send; Tab send stays opt-in', () => {
    expect(DEFAULT_COMPOSER_SEND_SHORTCUT).toBe('enter');
    expect(normalizeComposerSendShortcut(undefined)).toBe('enter');
    expect(normalizeComposerSendShortcut('bogus')).toBe('enter');
    expect(normalizeComposerSendShortcut('enter')).toBe('enter');
    expect(normalizeComposerSendShortcut('tab')).toBe('tab');
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
