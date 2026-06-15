import Letta, { APIError } from '@letta-ai/letta-client';
import type { BlockResponse } from '@letta-ai/letta-client/resources/blocks/blocks';
import { getSecret } from './secret-store';
import { discoverLocalLettaContext, resolveHttpBaseUrl } from './runtime-transport/letta-discovery';
import type { ConfigStore } from './config-store';
import type { MemoryBlockRecord, MemoryListResult, MemoryUpdateResult } from './shared/types';

export type { MemoryBlockRecord, MemoryListResult, MemoryUpdateResult };

const BLOCKS_QUERY_PATH = (agentId: string) =>
  `/v1/blocks/?agent_id=${encodeURIComponent(agentId)}`;

const CORE_MEMORY_BLOCKS_PATH = (agentId: string) =>
  `/v1/agents/${encodeURIComponent(agentId)}/core-memory/blocks`;

const CORE_MEMORY_BLOCK_PATH = (agentId: string, label: string) =>
  `/v1/agents/${encodeURIComponent(agentId)}/core-memory/blocks/${encodeURIComponent(label)}`;

const BLOCK_BY_ID_PATH = (blockId: string) =>
  `/v1/blocks/${encodeURIComponent(blockId)}`;

/** Local Letta agents use `agent-local-{uuid}` ids; core-memory path only accepts `agent-{uuid4}`. */
export function isLocalLettaAgentId(agentId: string): boolean {
  return agentId.startsWith('agent-local-');
}

function createLettaClient(baseUrl: string): Letta {
  const apiKey = getSecret('LETTA_API_KEY') || process.env.LETTA_API_KEY || null;
  return new Letta({ baseURL: baseUrl, apiKey });
}

function normalizeBlock(raw: BlockResponse): MemoryBlockRecord | null {
  const label = raw.label?.trim() || null;
  if (!label) return null;
  return {
    id: raw.id || label,
    label,
    value: raw.value ?? '',
    limit: typeof raw.limit === 'number' ? raw.limit : null,
    updated_at: null,
    description: raw.description ?? null,
  };
}

function resolveAgentCandidates(config: ConfigStore): string[] {
  const discovered = discoverLocalLettaContext(config);
  const primary = config.primaryAgentId();
  const configured = config.agentId();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [primary, configured, ...discovered.agentCandidates]) {
    const trimmed = id?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/** Settings observatory response when Letta session is not initialized (#715). */
export function memoryListBlockedResult(input?: {
  agentId?: string | null;
  reason?: string | null;
}): MemoryListResult {
  return {
    agentId: input?.agentId ?? null,
    baseUrl: null,
    blocks: [],
    apiPath: '/v1/agents/{agent_id}/core-memory/blocks',
    error: input?.reason?.trim()
      || 'Runtime not ready — connect Letta in Settings before inspecting memory.',
  };
}

/** User-facing memory errors — no trace_id or raw JSON in the observatory. */
export function lettaMemoryUserMessage(error: unknown): string {
  if (error instanceof APIError) {
    if (error.status === 422) {
      return 'Core memory blocks are not available for this agent in the current runtime state.';
    }
    if (error.status === 404) {
      return 'No core memory blocks were found for this agent.';
    }
    return `Letta memory API returned ${error.status}. Check runtime connection in Settings.`;
  }
  return error instanceof Error ? error.message : String(error);
}

async function listBlocksForAgent(client: Letta, candidateId: string): Promise<{
  blocks: MemoryBlockRecord[];
  apiPath: string;
}> {
  // Letta local REST accepts agent_id on /v1/blocks/; OpenAPI typings omit it.
  const listByAgent = () =>
    client.blocks.list({ agent_id: candidateId } as never);

  const attempts: Array<{
    apiPath: string;
    run: () => Promise<BlockResponse[]>;
  }> = [
    {
      apiPath: BLOCKS_QUERY_PATH(candidateId),
      run: async () => listByAgent().then((page) => page.getPaginatedItems()),
    },
  ];
  if (!isLocalLettaAgentId(candidateId)) {
    attempts.push({
      apiPath: CORE_MEMORY_BLOCKS_PATH(candidateId),
      run: async () => client.agents.blocks.list(candidateId).then((page) => page.getPaginatedItems()),
    });
  }

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const rows = await attempt.run();
      const blocks = rows
        .map((row) => normalizeBlock(row))
        .filter((b): b is MemoryBlockRecord => !!b);
      return { blocks, apiPath: attempt.apiPath };
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? new Error('Letta memory blocks not found.');
}

async function updateBlockForAgent(
  client: Letta,
  candidateId: string,
  label: string,
  value: string,
): Promise<{ block: MemoryBlockRecord; apiPath: string }> {
  if (isLocalLettaAgentId(candidateId)) {
    const listResult = await listBlocksForAgent(client, candidateId);
    const existing = listResult.blocks.find((b) => b.label === label);
    if (!existing?.id) {
      throw new APIError(404, undefined, `Block ${label} not found`, undefined);
    }
    const apiPath = BLOCK_BY_ID_PATH(existing.id);
    const updated = await client.blocks.update(existing.id, { value });
    const block = normalizeBlock(updated);
    if (!block) throw new Error('Letta memory update returned an unparseable block payload.');
    return { block, apiPath };
  }

  const apiPath = CORE_MEMORY_BLOCK_PATH(candidateId, label);
  const updated = await client.agents.blocks.update(label, {
    agent_id: candidateId,
    value,
  });
  const block = normalizeBlock(updated);
  if (!block) throw new Error('Letta memory update returned an unparseable block payload.');
  return { block, apiPath };
}

export class MemoryStore {
  constructor(private config: ConfigStore) {}

  async listBlocks(): Promise<MemoryListResult> {
    const discovered = discoverLocalLettaContext(this.config);
    const agentCandidates = resolveAgentCandidates(this.config);
    const agentId = agentCandidates[0] ?? null;
    const apiPath = agentId
      ? (isLocalLettaAgentId(agentId) ? BLOCKS_QUERY_PATH(agentId) : CORE_MEMORY_BLOCKS_PATH(agentId))
      : '/v1/agents/{agent_id}/core-memory/blocks';
    const baseUrl = resolveHttpBaseUrl(this.config.baseUrl() ?? discovered.baseUrl, this.config);

    if (!agentCandidates.length) {
      return {
        agentId: null,
        baseUrl,
        blocks: [],
        apiPath,
        error: discovered.reason ?? 'No local Letta agent — connect runtime in Settings first.',
      };
    }
    if (!baseUrl) {
      return {
        agentId,
        baseUrl: null,
        blocks: [],
        apiPath,
        error: 'Letta base URL not discovered — start Letta local runtime or set base URL in Settings.',
      };
    }

    const client = createLettaClient(baseUrl);
    let lastError: string | undefined;
    for (const candidateId of agentCandidates) {
      try {
        const { blocks, apiPath: path } = await listBlocksForAgent(client, candidateId);
        return { agentId: candidateId, baseUrl, blocks, apiPath: path };
      } catch (error) {
        if (error instanceof APIError && error.status === 404) {
          lastError = lettaMemoryUserMessage(error);
          continue;
        }
        lastError = lettaMemoryUserMessage(error);
      }
    }

    return {
      agentId,
      baseUrl,
      blocks: [],
      apiPath,
      error: lastError ?? 'Letta memory API unreachable — connect runtime in Settings.',
    };
  }

  searchBlocks(query: string, blocks: MemoryBlockRecord[]): MemoryBlockRecord[] {
    const q = query.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter((b) =>
      b.label.toLowerCase().includes(q)
      || b.value.toLowerCase().includes(q)
      || (b.description?.toLowerCase().includes(q) ?? false),
    );
  }

  async updateBlock(label: string, value: string): Promise<MemoryUpdateResult> {
    const trimmedLabel = label.trim();
    const agentCandidates = resolveAgentCandidates(this.config);
    const agentId = agentCandidates[0] ?? null;
    const baseUrl = resolveHttpBaseUrl(this.config.baseUrl() ?? discoverLocalLettaContext(this.config).baseUrl, this.config);
    const apiPath = agentId && trimmedLabel
      ? (isLocalLettaAgentId(agentId)
        ? `/v1/blocks/{block_id}`
        : CORE_MEMORY_BLOCK_PATH(agentId, trimmedLabel))
      : '/v1/agents/{agent_id}/core-memory/blocks/{block_label}';

    if (!trimmedLabel) {
      return {
        agentId,
        baseUrl,
        block: null,
        apiPath,
        error: 'Memory block label is required for update.',
      };
    }

    if (!agentCandidates.length) {
      const discovered = discoverLocalLettaContext(this.config);
      return {
        agentId: null,
        baseUrl,
        block: null,
        apiPath,
        error: discovered.reason ?? 'No local Letta agent — connect runtime in Settings first.',
      };
    }
    if (!baseUrl) {
      return {
        agentId,
        baseUrl: null,
        block: null,
        apiPath,
        error: 'Letta base URL not discovered — start Letta local runtime or set base URL in Settings.',
      };
    }

    const client = createLettaClient(baseUrl);
    let lastError: string | undefined;
    for (const candidateId of agentCandidates) {
      try {
        const { block, apiPath: path } = await updateBlockForAgent(client, candidateId, trimmedLabel, value);
        return { agentId: candidateId, baseUrl, block, apiPath: path };
      } catch (error) {
        lastError = lettaMemoryUserMessage(error);
      }
    }

    return {
      agentId,
      baseUrl,
      block: null,
      apiPath,
      error: lastError ?? 'Letta memory update unreachable — connect runtime in Settings.',
    };
  }
}
