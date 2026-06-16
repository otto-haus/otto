export function isPreviewFullscreenShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
): boolean {
  return (event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey && event.key.toLowerCase() === 'f';
}

export function isPreviewFullscreenExitKey(key: string): boolean {
  return key === 'Escape';
}

export function canTogglePreviewFullscreen(open: boolean, hasContent: boolean): boolean {
  return open && hasContent;
}
