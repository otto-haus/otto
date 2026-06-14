import { getSecret } from './secret-store';
import { discoverLocalLettaContext, resolveHttpBaseUrl } from './runtime-transport/letta-discovery';
import type { ConfigStore } from './config-store';
import type { MemoryBlockRecord, MemoryListResult } from './shared/types';

export type { MemoryBlockRecord, MemoryListResult };

const BLOCK_PATHS = (agentId: string) => [
  `/v1/blocks?agent_id=${encodeURIComponent(agentId)}`,
  `/v1/agents/${agentId}/core-memory/blocks`,
  `/v1/agents/${agentId}/memory/blocks`,
  `/v1/agents/${agentId}/blocks`,
];

function authHeaders(): Record<string, string> {
  const key = getSecret('LETTA_API_KEY') || process.env.LETTA_API_KEY;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function normalizeBlock(raw: Record<string, unknown>): MemoryBlockRecord | null {
  const label = typeof raw.label === 'string' ? raw.label : typeof raw.name === 'string' ? raw.name : null;
  if (!label) return null;
  const id = typeof raw.id === 'string' ? raw.id : label;
  const value = typeof raw.value === 'string' ? raw.value : '';
  const limit = typeof raw.limit === 'number' ? raw.limit : null;
  const updated_at = typeof raw.updated_at === 'string'
    ? raw.updated_at
    : typeof raw.updatedAt === 'string'
      ? raw.updatedAt
      : null;
  const description = typeof raw.description === 'string' ? raw.description : null;
  return { id, label, value, limit, updated_at, description };
}

function parseBlocksPayload(json: unknown): MemoryBlockRecord[] {
  const rows = Array.isArray(json)
    ? json
    : json && typeof json === 'object' && Array.isArray((json as { data?: unknown }).data)
      ? (json as { data: unknown[] }).data
      : json && typeof json === 'object' && Array.isArray((json as { blocks?: unknown }).blocks)
        ? (json as { blocks: unknown[] }).blocks
        : [];
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map(normalizeBlock)
    .filter((b): b is MemoryBlockRecord => !!b);
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

export class MemoryStore {
  constructor(private config: ConfigStore) {}

  async listBlocks(): Promise<MemoryListResult> {
    const discovered = discoverLocalLettaContext(this.config);
    const agentCandidates = resolveAgentCandidates(this.config);
    const agentId = agentCandidates[0] ?? null;
    const baseUrl = resolveHttpBaseUrl(this.config.baseUrl() ?? discovered.baseUrl);
    const apiPath = agentId ? BLOCK_PATHS(agentId)[0]! : '/v1/agents/{agent_id}/core-memory/blocks';

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

    let lastError: string | undefined;
    for (const candidateId of agentCandidates) {
      for (const path of BLOCK_PATHS(candidateId)) {
        try {
          const res = await fetch(`${baseUrl}${path}`, { headers: authHeaders() });
          if (res.status === 404) {
            lastError = `Letta memory API 404 at ${path}`;
            continue;
          }
          if (!res.ok) {
            const body = await res.text().catch(() => '');
            lastError = `Letta memory API ${res.status}${body ? `: ${body.slice(0, 160)}` : ''}`;
            continue;
          }
          const blocks = parseBlocksPayload(await res.json());
          return { agentId: candidateId, baseUrl, blocks, apiPath: path };
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
        }
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
}
