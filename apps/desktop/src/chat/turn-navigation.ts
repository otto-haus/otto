import type { ChatMsg } from '../runtime';

const lastAnchorAtOrBefore = (anchors: number[], index: number): number => {
  for (let i = anchors.length - 1; i >= 0; i -= 1) {
    if (anchors[i]! <= index) return i;
  }
  return 0;
};

/** First message index for each visible speaker block (a "turn" anchor). */
export function turnAnchorIndices(messages: Pick<ChatMsg, 'who'>[]): number[] {
  const anchors: number[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    if (i === 0 || messages[i - 1].who !== messages[i].who) anchors.push(i);
  }
  return anchors;
}

/** Jump to the previous or next turn anchor relative to `currentIndex`. */
export function jumpTurnAnchor(
  anchors: number[],
  currentIndex: number,
  direction: 'prev' | 'next',
): number | null {
  if (!anchors.length) return null;
  let pos = anchors.findIndex((a) => a === currentIndex);
  if (pos === -1) {
    pos = lastAnchorAtOrBefore(anchors, currentIndex);
    const blockAnchor = anchors[pos] ?? anchors[0];
    if (direction === 'prev' && currentIndex > blockAnchor) return blockAnchor;
    if (direction === 'next' && currentIndex >= blockAnchor) {
      const nextPos = pos + 1;
      return nextPos < anchors.length ? anchors[nextPos] ?? null : null;
    }
  }
  const nextPos = direction === 'prev' ? pos - 1 : pos + 1;
  if (nextPos < 0 || nextPos >= anchors.length) return null;
  return anchors[nextPos] ?? null;
}

export const CHAT_TURN_NAV_SHORTCUT = 'Alt+↑ / Alt+↓';

export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return true;
  return (el as HTMLElement).isContentEditable;
}
