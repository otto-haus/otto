import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type {
  StandardCitation,
  StandardConflictResult,
  StandardRecord,
  StandardRef,
  StandardsRegistry,
  StandardStatus,
} from '@otto-haus/core';

export interface StandardListResult {
  dir: string;
  registryPath: string;
  registry: StandardsRegistry;
  standards: StandardRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
}

export class StandardStore {
  constructor(private dir = resolveStandardsDir()) {}

  listResult(): StandardListResult {
    const registryPath = join(this.dir, 'registry.yaml');
    const registry = normalizeRegistry(parse(readFileSync(registryPath, 'utf8')), registryPath);
    const standards: StandardRecord[] = [];
    const skipped: StandardListResult['skipped'] = [];

    for (const ref of registry.standards) {
      const file = this.pathFor(ref.file);
      try {
        standards.push(readStandard(file, registryPath));
      } catch (error) {
        skipped.push({
          slug: ref.slug,
          file,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    standards.sort((a, b) => a.slug.localeCompare(b.slug));
    return { dir: this.dir, registryPath, registry, standards, skipped, storage: 'files' };
  }

  get(slug: string): StandardRecord | null {
    return this.listResult().standards.find((standard) => standard.slug === slug) ?? null;
  }

  citationsForSlugs(slugs: string[], reason: string): StandardCitation[] {
    const standards = this.listResult().standards;
    return unique(slugs)
      .map((slug) => standards.find((standard) => standard.slug === slug))
      .filter((standard): standard is StandardRecord => !!standard)
      .map((standard) => citationFor(standard, reason));
  }

  citationsForText(text: string): StandardCitation[] {
    const lower = text.toLowerCase();
    const slugs = new Set<string>(['quality']);
    if (/\b(attention|interrupt|notify|ping|message|follow[- ]?up)\b/.test(lower)) slugs.add('respect-attention');
    if (/\b(done|proof|receipt|evidence|review|verify|verified|ship)\b/.test(lower)) slugs.add('quality');
    if (/\b(decide|judgment|uncertain|tradeoff|risk)\b/.test(lower)) slugs.add('judgment');
    if (/\b(candid|truth|kind|blunt)\b/.test(lower)) slugs.add('candor-kindness');
    return this.citationsForSlugs([...slugs], 'Runtime receipt cites relevant file-backed Standards.');
  }

  conflictForSlugs(slugs: string[]): StandardConflictResult | null {
    const normalized = unique(slugs);
    if (!normalized.length) return null;
    const { registry } = this.listResult();
    const match = registry.conflicts.find((conflict) =>
      conflict.between.some((slug) => normalized.includes(slug)),
    );
    return match ? this.enrichConflict(match) : null;
  }

  conflictForStandard(slug: string): StandardConflictResult | null {
    const standard = this.get(slug);
    const related = unique([slug, ...(standard?.conflicts_with ?? [])]);
    return this.conflictForSlugs(related);
  }

  readPrecedent(relativePath: string): { excerpt?: string; file?: string } | null {
    const file = join(this.dir, relativePath);
    if (!existsSync(file)) return null;
    const source = readFileSync(file, 'utf8');
    const excerpt = extractPrecedentExcerpt(source);
    return { file: relativePath, excerpt };
  }

  private enrichConflict(conflict: StandardsRegistry['conflicts'][number]): StandardConflictResult {
    const precedent = conflict.precedent ? this.readPrecedent(conflict.precedent) : null;
    const message = precedent?.excerpt
      ? `Case law applies — ${conflict.tie_breaker}`
      : `No case law yet — tie-breaker is "${conflict.tie_breaker}".`;
    return {
      between: conflict.between,
      message,
      tie_breaker: conflict.tie_breaker,
      precedent: precedent ?? undefined,
    };
  }

  private pathFor(registryFile: string): string {
    return resolve(this.dir, registryFile);
  }
}

export function resolveStandardsDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.OTTO_STANDARDS_DIR,
    process.env.OTTO_ROOT ? join(process.env.OTTO_ROOT, 'standards') : null,
    resolve(process.cwd(), 'standards'),
    resolve(process.cwd(), '../../standards'),
    resourcesPath ? join(resourcesPath, 'standards') : null,
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'registry.yaml'))) return candidate;
  }

  return candidates[0] ?? resolve(process.cwd(), 'standards');
}

function readStandard(file: string, registryPath: string): StandardRecord {
  const source = readFileSync(file, 'utf8');
  const match = source.match(/^```ya?ml\r?\n([\s\S]*?)\r?\n```\r?\n?/);
  if (!match) throw new Error(`Missing leading fenced YAML block: ${file}`);
  const parsed = parse(match[1]) as unknown;
  const spec = normalizeStandardSpec(parsed, file);
  return {
    schema: 'otto.standard.v1',
    ...spec,
    file,
    registry_file: registryPath,
    markdown: source.slice(match[0].length).trim(),
  };
}

function normalizeRegistry(value: unknown, file: string): StandardsRegistry {
  if (!isRecord(value)) throw new Error(`Standards registry must be a YAML object: ${file}`);
  const standards = arrayOfRecords(value.standards).map((entry) => ({
    slug: requiredString(entry.slug, 'standards[].slug'),
    name: requiredString(entry.name, 'standards[].name'),
    version: String(entry.version),
    status: status(entry.status),
    file: requiredString(entry.file, 'standards[].file'),
    meaning: requiredString(entry.meaning, 'standards[].meaning'),
  }));

  return {
    version: String(value.version),
    status: status(value.status),
    authority_stack: Array.isArray(value.authority_stack) ? value.authority_stack : [],
    ratification: ratification(value.ratification),
    standards,
    conflicts: arrayOfRecords(value.conflicts).map((entry) => ({
      between: stringArray(entry.between),
      tie_breaker: requiredString(entry.tie_breaker, 'conflicts[].tie_breaker'),
      precedent: typeof entry.precedent === 'string' ? entry.precedent : null,
    })),
    anti_patterns: stringArray(value.anti_patterns),
    canon: arrayOfRecords(value.canon).map((entry) => ({
      slug: requiredString(entry.slug, 'canon[].slug'),
      file: requiredString(entry.file, 'canon[].file'),
      role: requiredString(entry.role, 'canon[].role'),
    })),
  };
}

function normalizeStandardSpec(value: unknown, file: string): Omit<StandardRecord, 'schema' | 'file' | 'registry_file' | 'markdown'> {
  if (!isRecord(value)) throw new Error(`Standard YAML must be an object: ${file}`);
  const underPressure = isRecord(value.under_pressure) ? value.under_pressure : {};
  return {
    name: requiredString(value.name, 'name'),
    slug: requiredString(value.slug, 'slug'),
    version: String(value.version),
    status: status(value.status),
    meaning: requiredString(value.meaning, 'meaning'),
    under_pressure: {
      do: stringArray(underPressure.do),
      refuse: stringArray(underPressure.refuse),
    },
    reward: stringArray(value.reward),
    failure_modes: stringArray(value.failure_modes),
    conflicts_with: stringArray(value.conflicts_with),
    tie_breakers: stringArray(value.tie_breakers),
    related_practices: stringArray(value.related_practices),
    related_curation_rules: stringArray(value.related_curation_rules),
    evidence: stringArray(value.evidence),
    related_anti_patterns: stringArray(value.related_anti_patterns),
    canon_refs: stringArray(value.canon_refs),
    ratification: ratification(value.ratification),
  };
}

function citationFor(standard: StandardRecord, reason: string): StandardCitation {
  return {
    slug: standard.slug,
    name: standard.name,
    ref: standard.file,
    reason,
    evidence: standard.evidence,
  };
}

function ratification(value: unknown) {
  const record = isRecord(value) ? value : {};
  return {
    owner: typeof record.owner === 'string' ? record.owner : 'Sebastian',
    standards_changes_require_human: record.standards_changes_require_human === true,
    auto_apply: typeof record.auto_apply === 'boolean' ? record.auto_apply : undefined,
  };
}

function status(value: unknown): StandardStatus {
  if (value === 'draft' || value === 'active' || value === 'deprecated') return value;
  throw new Error(`Invalid Standard status: ${String(value)}`);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`Missing ${label}`);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function extractPrecedentExcerpt(markdown: string): string {
  const which = markdown.match(/## Which standard won\?\s*\n([\s\S]*?)(?:\n## |\n$)/);
  if (which?.[1]) return which[1].trim().slice(0, 480);
  const decision = markdown.match(/## Decision\s*\n([\s\S]*?)(?:\n## |\n$)/);
  if (decision?.[1]) return decision[1].trim().slice(0, 480);
  return markdown.replace(/^```[\s\S]*?```\s*/m, '').trim().slice(0, 480);
}
