import type { RuntimeTransportMode } from './types';

/** Default to the local WebSocket runtime; SDK is an explicit diagnostic escape hatch. */
export function resolveTransportMode(): RuntimeTransportMode {
  const raw = (process.env.OTTO_RUNTIME_TRANSPORT ?? 'ws').trim().toLowerCase();
  if (raw === 'ws' || raw === 'websocket') return 'ws';
  if (raw === 'sdk') return 'sdk';
  if (raw === 'auto') return 'auto';
  return 'ws';
}
