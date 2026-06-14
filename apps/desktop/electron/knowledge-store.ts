import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { KnowledgeListResult, KnowledgeModelEntry, KnowledgeRegistrySummary } from '@otto-haus/core';

export class KnowledgeStore {
  constructor(private dir = resolveKnowledgeDir()) {}

  listResult(): KnowledgeListResult {
    const registryPath = join(this.dir, 'ai-frontier', 'model-registry.yaml');
    const capabilityNotesPath = join(this.dir, 'ai-frontier', 'capability-notes.md');
    const providerCostsPath = join(this.dir, 'ai-frontier', 'provider-costs.md');
    const observedPerformanceDir = join(this.dir, 'ai-frontier', 'observed-performance');

    return {
      dir: this.dir,
      registryPath,
      registry: existsSync(registryPath) ? readRegistrySafe(registryPath) : null,
      capabilityNotesPath: existsSync(capabilityNotesPath) ? capabilityNotesPath : null,
      providerCostsPath: existsSync(providerCostsPath) ? providerCostsPath : null,
      observedPerformanceDir: existsSync(observedPerformanceDir) ? observedPerformanceDir : null,
      storage: 'files',
    };
  }

  routingForRole(role: string): KnowledgeRegistrySummary['routing'] | null {
    const registry = this.listResult().registry;
    if (!registry) return null;
    const assignment = registry.routing.assignments[role];
    if (!assignment) return null;
    return registry.routing;
  }

  resolveModelForRole(role: string): { provider: string; model: string; status: 'proposed' | 'active' } | null {
    const result = this.listResult();
    const registry = result.registry;
    if (!registry) return null;
    const assignment = registry.routing.assignments[role];
    if (!assignment) return null;
    const [provider, model] = assignment.split('/');
    if (!provider || !model) return null;
    return { provider, model, status: registry.routing.status };
  }
}

export function resolveKnowledgeDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.OTTO_KNOWLEDGE_DIR,
    process.env.OTTO_ROOT ? join(process.env.OTTO_ROOT, 'knowledge') : null,
    resolve(process.cwd(), 'knowledge'),
    resolve(process.cwd(), '../../knowledge'),
    resourcesPath ? join(resourcesPath, 'knowledge') : null,
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'ai-frontier', 'model-registry.yaml'))) return candidate;
  }

  return candidates[0] ?? resolve(process.cwd(), 'knowledge');
}

function readRegistrySafe(file: string): KnowledgeRegistrySummary | null {
  try {
    return readRegistry(file);
  } catch {
    return null;
  }
}

function readRegistry(file: string): KnowledgeRegistrySummary {
  const raw = parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const modelsRaw = Array.isArray(raw.models) ? raw.models : [];
  const models: KnowledgeModelEntry[] = modelsRaw.map((entry) => {
    const model = entry as Record<string, unknown>;
    return {
      provider: String(model.provider ?? ''),
      model: String(model.model ?? ''),
      handle_note: optionalString(model.handle_note),
      cost_tier: optionalString(model.cost_tier),
      default_roles: stringArray(model.default_roles),
      verified: model.verified === true,
      last_verified: optionalString(model.last_verified),
    };
  });

  const routingRaw = isRecord(raw.routing) ? raw.routing : {};
  const assignmentsRaw = isRecord(routingRaw.assignments) ? routingRaw.assignments : {};
  const assignments: Record<string, string> = {};
  for (const [key, value] of Object.entries(assignmentsRaw)) {
    if (typeof value === 'string') assignments[key] = value;
  }

  const allowlistRaw = isRecord(raw.provider_allowlist) ? raw.provider_allowlist : {};
  return {
    schema: 'otto.knowledge.registry.v1',
    version: String(raw.version ?? '0.1'),
    status: raw.status === 'active' ? 'active' : 'proposed',
    last_reviewed: optionalString(raw.last_reviewed),
    next_review_due: optionalString(raw.next_review_due),
    roles: stringArray(raw.roles),
    models,
    routing: {
      status: routingRaw.status === 'active' ? 'active' : 'proposed',
      assignments,
    },
    provider_allowlist: {
      status: allowlistRaw.status === 'active' ? 'active' : 'proposed',
      providers: stringArray(allowlistRaw.providers),
    },
    file,
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
