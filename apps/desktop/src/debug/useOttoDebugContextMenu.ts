import type React from 'react';
import { isElectron, ottoApi } from '../runtime';

/** Right-click opens the native otto debug menu (logs, status copy, DevTools). */
export function useOttoDebugContextMenu(surface?: string) {
  const onContextMenu = (event: React.MouseEvent) => {
    if (!isElectron()) return;
    event.preventDefault();
    event.stopPropagation();
    void ottoApi()?.debug?.showContextMenu(surface);
  };
  return { onContextMenu };
}
