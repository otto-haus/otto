/** Max composer height before internal scroll (#278). */
export const COMPOSER_TEXTAREA_MAX_HEIGHT_PX = 200;

/** Sync textarea height to content up to {@link COMPOSER_TEXTAREA_MAX_HEIGHT_PX}. */
export function syncComposerTextareaHeight(
  textarea: HTMLTextAreaElement,
  maxHeightPx = COMPOSER_TEXTAREA_MAX_HEIGHT_PX,
): void {
  textarea.style.height = '0px';
  const contentHeight = textarea.scrollHeight;
  const nextHeight = Math.min(contentHeight, maxHeightPx);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = contentHeight > maxHeightPx ? 'auto' : 'hidden';
}
