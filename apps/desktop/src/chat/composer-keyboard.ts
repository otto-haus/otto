import type { ComposerSendShortcut } from '../runtime';

export const DEFAULT_COMPOSER_SEND_SHORTCUT: ComposerSendShortcut = 'enter';

export function normalizeComposerSendShortcut(value: unknown): ComposerSendShortcut {
  if (value === 'tab') return 'tab';
  if (value === 'enter') return 'enter';
  return DEFAULT_COMPOSER_SEND_SHORTCUT;
}

export function composerHintKey(shortcut: ComposerSendShortcut): 'tab' | 'enter' {
  return shortcut === 'enter' ? 'enter' : 'tab';
}

export function shouldComposerShortcutSubmit(
  key: string,
  shiftKey: boolean,
  shortcut: ComposerSendShortcut,
): boolean {
  if (shortcut === 'enter') return key === 'Enter' && !shiftKey;
  return key === 'Tab' && !shiftKey;
}
