import type { RuntimeTransportMode } from './types';

/** Default stays SDK until WS promotion proof is accepted (039). */
export function resolveTransportMode(): RuntimeTransportMode {
  const raw = (process.env.OTTO_RUNTIME_TRANSPORT ?? 'sdk').trim().toLowerCase();
  if (raw === 'ws' || raw === 'websocket') return 'ws';
  if (raw === 'auto') return 'auto';
  return 'sdk';
}
