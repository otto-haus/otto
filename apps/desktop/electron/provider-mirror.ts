import { getSecret } from './secret-store';
import type { ConfigStore } from './config-store';
import type { ProviderMirrorSnapshot } from './shared/types';
import { discoverLocalLettaContext } from './runtime-transport/letta-discovery';

/** Write-only BYOK mirror — boolean presence only, never key material (078). */
export function buildProviderMirror(config: ConfigStore, runtimeReady = false): ProviderMirrorSnapshot {
  const hasApiKey = !!(getSecret('LETTA_API_KEY') || process.env.LETTA_API_KEY);
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
