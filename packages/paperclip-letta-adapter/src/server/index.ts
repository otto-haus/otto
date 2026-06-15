import type { AdapterSessionCodec, ServerAdapterModule } from "../contract.js";
import { type as adapterType, models, agentConfigurationDoc } from "../index.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";
import { listLettaModels } from "./letta-client.js";

function readAgentId(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null) return null;
  const value = (raw as Record<string, unknown>).agentId;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Memory continuity is anchored to the Letta agent id: the "session" is the
 * persistent Letta agent itself, so reusing it across heartbeats reuses memory.
 */
export const sessionCodec: AdapterSessionCodec = {
  deserialize(raw) {
    const agentId = readAgentId(raw);
    return agentId ? { agentId } : null;
  },
  serialize(params) {
    const agentId = readAgentId(params);
    return agentId ? { agentId } : null;
  },
  getDisplayId(params) {
    return readAgentId(params);
  },
};

export function createServerAdapter(): ServerAdapterModule {
  return {
    type: adapterType,
    execute,
    testEnvironment,
    sessionCodec,
    models,
    listModels: listLettaModels,
    agentConfigurationDoc,
  };
}

export { execute } from "./execute.js";
export { testEnvironment } from "./test.js";
