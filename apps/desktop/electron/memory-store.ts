import Letta, { APIError } from '@letta-ai/letta-client';
import type { BlockResponse } from '@letta-ai/letta-client/resources/blocks/blocks';
import { getSecret } from './secret-store';
import { discoverLocalLettaContext, resolveHttpBaseUrl } from './runtime-transport/letta-discovery';
import type { ConfigStore } from './config-store';
import type { MemoryBlockRecord, MemoryListResult, MemoryUpdateResult } from './shared/types';

export type { MemoryBlockRecord, MemoryListResult, MemoryUpdateResult };

const CORE_MEMORY_BLOCKS_PATH = (agentId: string) =>
  `/v1/agents/${encodeURIComponent(agentId)}/core-memory/blocks`;

const CORE_MEMORY_BLOCK_PATH = (agentId: string, label: string) =>
  `/v1/agents/${encodeURIComponent(agentId)}/core-memory/blocks/${encodeURIComponent(label)}`;

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

function lettaErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    const detail = typeof error.message === 'string' ? error.message : '';
    return `Letta memory API ${error.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`;
  }
  return error instanceof Error ? error.message : String(error);
}

export class MemoryStore {
  constructor(private config: ConfigStore) {}

  async listBlocks(): Promise<MemoryListResult> {
    const discovered = discoverLocalLettaContext(this.config);
    const agentCandidates = resolveAgentCandidates(this.config);
    const agentId = agentCandidates[0] ?? null;
    const apiPath = agentId ? CORE_MEMORY_BLOCKS_PATH(agentId) : '/v1/agents/{agent_id}/core-memory/blocks';
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
      const path = CORE_MEMORY_BLOCKS_PATH(candidateId);
      try {
        const page = await client.agents.blocks.list(candidateId);
        const blocks = page.getPaginatedItems()
          .map((row) => normalizeBlock(row))
          .filter((b): b is MemoryBlockRecord => !!b);
        return { agentId: candidateId, baseUrl, blocks, apiPath: path };
      } catch (error) {
        if (error instanceof APIError && error.status === 404) {
          lastError = `Letta memory API 404 at ${path}`;
          continue;
        }
        lastError = lettaErrorMessage(error);
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
      ? CORE_MEMORY_BLOCK_PATH(agentId, trimmedLabel)
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
      const path = CORE_MEMORY_BLOCK_PATH(candidateId, trimmedLabel);
      try {
        const updated = await client.agents.blocks.update(trimmedLabel, {
          agent_id: candidateId,
          value,
        });
        const block = normalizeBlock(updated);
        if (!block) {
          lastError = 'Letta memory update returned an unparseable block payload.';
          continue;
        }
        return { agentId: candidateId, baseUrl, block, apiPath: path };
      } catch (error) {
        lastError = error instanceof APIError && error.status === 404
          ? `Letta memory update 404 at ${path}`
          : lettaErrorMessage(error);
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
