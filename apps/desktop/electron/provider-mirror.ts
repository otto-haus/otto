import type { ConfigStore } from './config-store';
import { hasLettaApiKey } from './letta-api-key';
import type { ProviderMirrorSnapshot } from './shared/types';
import { discoverLocalLettaContext } from './runtime-transport/letta-discovery';

/** Write-only BYOK mirror — boolean presence only, never key material (078). */
export function buildProviderMirror(config: ConfigStore, runtimeReady = false): ProviderMirrorSnapshot {
  const hasApiKey = hasLettaApiKey(config);
  const ctx = discoverLocalLettaContext(config);
  return {
    lettaConnected: runtimeReady,
    lettaConfigured: !!ctx.baseUrl,
    hasApiKey,
    modelHandle: config.modelHandle(),
    agentId: config.agentId(),
    note: 'Provider auth is managed by Letta. otto never stores or reads back API keys.',
  };
}
