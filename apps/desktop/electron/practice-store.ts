import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import {
  APPROVAL_FLOOR,
  type ApprovalRequirement,
  type PracticeRecord,
  type PracticeReference,
  type PracticeSpec,
  type PracticeStatus,
} from '@otto-haus/core';

export interface PracticeListResult {
  dir: string;
  practices: PracticeRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
}

const approvalRequirementMap = new Map<string, ApprovalRequirement>([
  ['enabling globally', 'enabling-globally'],
  ['enabling-globally', 'enabling-globally'],
  ['external side effects', 'external-side-effects'],
  ['external-side-effects', 'external-side-effects'],
  ['permission expansion', 'permission-expansion'],
  ['permission-expansion', 'permission-expansion'],
  ['any send / outbound touch', 'send-or-publish'],
  ['any send / post / publish / outbound touch', 'send-or-publish'],
  ['send or publish', 'send-or-publish'],
  ['send-or-publish', 'send-or-publish'],
  ['deploy', 'deploy'],
  ['spend', 'spend'],
  ['delete or destroy', 'delete-or-destroy'],
  ['delete-or-destroy', 'delete-or-destroy'],
  ['credential or security change', 'credential-or-security-change'],
  ['credential-or-security-change', 'credential-or-security-change'],
]);

export class PracticeStore {
  constructor(private dir = resolvePracticesDir()) {}

  listResult(): PracticeListResult {
    const practices: PracticeRecord[] = [];
    const skipped: PracticeListResult['skipped'] = [];

    if (!existsSync(this.dir)) {
      return { dir: this.dir, practices, skipped, storage: 'files' };
    }

    for (const entry of readdirSync(this.dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = join(this.dir, entry.name, 'practice.yaml');
      try {
        practices.push(readPractice(file, entry.name));
      } catch (error) {
        skipped.push({
          slug: entry.name,
          file,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    practices.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return { dir: this.dir, practices, skipped, storage: 'files' };
  }

  get(slug: string): PracticeRecord | null {
    return this.listResult().practices.find((practice) => practice.slug === slug) ?? null;
  }

  resolveForText(text: string): PracticeReference | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();

    for (const practice of this.listResult().practices) {
      const match = practice.invocations
        .map((invocation) => invocation.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)
        .find((invocation) => matchesInvocation(lower, invocation));

      if (match) return referenceFor(practice, match);

      const slugPrefix = `/${practice.slug}`;
      if (lower === slugPrefix) {
        return referenceFor(practice, slugPrefix);
      }
    }

    return null;
  }
}

export function resolvePracticesDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.OTTO_PRACTICES_DIR,
    process.env.OTTO_ROOT ? join(process.env.OTTO_ROOT, 'practices') : null,
    resolve(process.cwd(), 'practices'),
    resolve(process.cwd(), '../../practices'),
    resourcesPath ? join(resourcesPath, 'practices') : null,
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return candidates[0] ?? resolve(process.cwd(), 'practices');
}

function readPractice(file: string, fallbackSlug: string): PracticeRecord {
  const parsed = parse(readFileSync(file, 'utf8')) as unknown;
  const spec = normalizePracticeSpec(parsed, fallbackSlug);
  return { ...spec, file };
}

function normalizePracticeSpec(value: unknown, fallbackSlug: string): PracticeSpec {
  if (!isRecord(value)) throw new Error('Practice YAML must be an object');
  const approvalRequired = Array.from(
    new Set([
      ...APPROVAL_FLOOR,
      ...stringArray(value.approval_required_for).map(normalizeApprovalRequirement),
    ]),
  );

  return {
    name: requiredString(value.name, 'name'),
    slug: requiredString(value.slug, 'slug') || fallbackSlug,
    version: String(value.version ?? '0.1'),
    status: status(value.status),
    summary: requiredString(value.summary, 'summary'),
    implementation: isRecord(value.implementation)
      ? {
          extension: optionalString(value.implementation.extension),
          skill: optionalString(value.implementation.skill),
          templates: optionalString(value.implementation.templates),
        }
      : undefined,
    invocations: stringArray(value.invocations),
    triggers: stringArray(value.triggers),
    inputs: stringArray(value.inputs),
    outputs: stringArray(value.outputs),
    state_paths: stringArray(value.state_paths),
    guardrails: stringArray(value.guardrails),
    evidence_standard: stringArray(value.evidence_standard),
    metrics: stringArray(value.metrics),
    owner: optionalString(value.owner) ?? 'Otto',
    approval_required_for: approvalRequired,
  };
}

function referenceFor(practice: PracticeRecord, invocation: string): PracticeReference {
  return {
    slug: practice.slug,
    name: practice.name,
    version: practice.version,
    status: practice.status,
    invocation,
    ref: practice.file,
  };
}

function matchesInvocation(text: string, invocation: string): boolean {
  const normalized = invocation.trim().toLowerCase();
  if (!text.startsWith(normalized)) return false;
  const next = text.charAt(normalized.length);
  return next === '' || /\s/.test(next);
}

function normalizeApprovalRequirement(value: string): ApprovalRequirement {
  const normalized = value.trim().toLowerCase();
  const mapped = approvalRequirementMap.get(normalized);
  if (!mapped) throw new Error(`Unknown approval requirement: ${value}`);
  return mapped;
}

function status(value: unknown): PracticeStatus {
  if (value === 'draft' || value === 'active' || value === 'deprecated') return value;
  throw new Error(`Invalid Practice status: ${String(value)}`);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`Missing ${label}`);
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
