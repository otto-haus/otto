import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ConfigStore } from './config-store';
import { defaultOttoDir } from './config-store';
import { getSecret } from './secret-store';
import { discoverLocalLettaContext, resolveHttpBaseUrl } from './runtime-transport/letta-discovery';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import type { IsolatedAgentCreateResult, IsolatedAgentListResult, IsolatedAgentRecord } from './shared/types';
import {
  isIsolationBoundaryReason,
  type IsolationBoundaryReason,
} from './isolated-agent';

export type IsolatedAgentCreateInput = {
  boundaryReason: IsolationBoundaryReason;
  label?: string | null;
};

function authHeaders(jsonBody = false): Record<string, string> {
  const key = getSecret('LETTA_API_KEY') || process.env.LETTA_API_KEY;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (jsonBody) headers['Content-Type'] = 'application/json';
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function isolatedAgentsRoot(): string {
  return join(defaultOttoDir(), 'agents');
}

function isolatedAgentDir(agentId: string): string {
  return join(isolatedAgentsRoot(), encodeURIComponent(agentId));
}

function parseAgentId(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const row = json as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : typeof row.agent_id === 'string' ? row.agent_id : null;
  return id?.trim() || null;
}

export class IsolatedAgentStore {
  constructor(
    private config: ConfigStore,
    private receipts = new ReceiptWriter(),
  ) {}

  list(): IsolatedAgentListResult {
    return { agents: this.config.get().isolatedAgents ?? [] };
  }

  async create(input: IsolatedAgentCreateInput): Promise<IsolatedAgentCreateResult> {
    const boundaryReason = input.boundaryReason?.trim();
    if (!boundaryReason || !isIsolationBoundaryReason(boundaryReason)) {
      throw new Error('Select a documented isolation boundary (ADR 093) before creating a second agent.');
    }

    const context = discoverLocalLettaContext(this.config);
    const baseUrl = resolveHttpBaseUrl(this.config.baseUrl() ?? context.baseUrl);
    if (!baseUrl) {
      throw new Error('Letta base URL not available — connect runtime in Settings before creating an isolated agent.');
    }

    const label = input.label?.trim() || `otto-isolated-${Date.now()}`;
    const description = `Isolated secondary agent (${boundaryReason}) — created via otto Advanced (#120). Standards canon ratify blocked until explicit scope.`;

    const res = await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ name: label, description }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Letta could not create agent (${res.status})${body ? `: ${body.slice(0, 240)}` : ''}`);
    }

    const agentId = parseAgentId(await res.json());
    if (!agentId) throw new Error('Letta agent create succeeded but no agent id was returned.');

    const primaryAgentId = this.config.primaryAgentId();
    if (primaryAgentId && agentId === primaryAgentId) {
      throw new Error('Created agent matches the primary agent — isolation requires a separate agent id.');
    }

    const createdAt = new Date().toISOString();
    const configDir = isolatedAgentDir(agentId);
    mkdirSync(configDir, { recursive: true });
    const metaPath = join(configDir, 'meta.json');
    const meta = {
      schema: 'otto.isolated-agent.v1',
      agentId,
      boundaryReason,
      label,
      createdAt,
      primaryAgentId,
      standardsCanonScope: 'isolated-only',
      standardsRatifyBlocked: true,
    };
    writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

    const record: IsolatedAgentRecord = {
      agentId,
      boundaryReason,
      label,
      createdAt,
      configPath: metaPath,
      standardsRatifyBlocked: true,
    };

    const existing = this.config.get().isolatedAgents ?? [];
    this.config.update({ isolatedAgents: [...existing, record] });

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'task', id: agentId },
      action: 'agent.isolated.create',
      input: { boundaryReason, label, primaryAgentId },
      result: {
        summary: 'Isolated secondary agent created via Advanced settings.',
        data: {
          agentId,
          boundaryReason,
          configPath: metaPath,
          standardsRatifyBlocked: true,
        },
      },
      evidence: [
        { kind: 'file', ref: metaPath, note: 'isolated agent metadata subtree' },
      ],
      standards: [{
        slug: '093-multi-agent-workspace-policy',
        name: 'ADR 093 — Multi-Agent Workspace Policy',
        ref: 'docs/v1/adr/093-multi-agent-workspace-policy.md',
        reason: 'Second agent requires documented isolation boundary and receipt.',
        evidence: [boundaryReason],
      }],
      blocker: null,
    });

    return { agent: record, receipt };
  }

  isIsolatedSecondary(agentId: string | null | undefined): boolean {
    const trimmed = agentId?.trim();
    if (!trimmed) return false;
    const rows = this.config.get().isolatedAgents ?? [];
    return rows.some((row) => row.agentId === trimmed);
  }
}

export { isolatedAgentsRoot, isolatedAgentDir };
