import type { RuntimeTransportMode } from './types';

/** Default to functional local chat; strict WS remains selectable for proof. */
export function resolveTransportMode(): RuntimeTransportMode {
  const raw = (process.env.OTTO_RUNTIME_TRANSPORT ?? 'auto').trim().toLowerCase();
  if (raw === 'ws' || raw === 'websocket') return 'ws';
  if (raw === 'sdk') return 'sdk';
  if (raw === 'auto') return 'auto';
  return 'auto';
}
