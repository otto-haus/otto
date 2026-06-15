import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { SkillListResult, SkillRecord } from '@otto-haus/core';

export class SkillStore {
  constructor(private dir = resolveSkillsDir()) {}

  listResult(): SkillListResult {
    const skills: SkillRecord[] = [];
    const skipped: SkillListResult['skipped'] = [];

    const rootSkill = join(this.dir, 'SKILL.md');
    if (existsSync(rootSkill)) {
      try {
        skills.push(readSkill(rootSkill, 'otto'));
      } catch (error) {
        skipped.push({ slug: 'otto', file: rootSkill, reason: String(error) });
      }
    }

    if (existsSync(this.dir)) {
      for (const entry of readdirSync(this.dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const file = join(this.dir, entry.name, 'SKILL.md');
        if (!existsSync(file)) continue;
        try {
          skills.push(readSkill(file, entry.name));
        } catch (error) {
          skipped.push({ slug: entry.name, file, reason: String(error) });
        }
      }
    }

    skills.sort((a, b) => a.slug.localeCompare(b.slug));
    return { dir: this.dir, skills, skipped, storage: 'files' };
  }

  get(slug: string): SkillRecord | null {
    return this.listResult().skills.find((skill) => skill.slug === slug) ?? null;
  }
}

export function resolveSkillsDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.OTTO_SKILLS_DIR,
    process.env.OTTO_ROOT ? join(process.env.OTTO_ROOT, 'skill') : null,
    resolve(process.cwd(), 'skill'),
    resolve(process.cwd(), '../../skill'),
    resourcesPath ? join(resourcesPath, 'skill') : null,
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'SKILL.md'))) return candidate;
  }

  return candidates[0] ?? resolve(process.cwd(), 'skill');
}

function readSkill(file: string, slug: string): SkillRecord {
  const raw = readFileSync(file, 'utf8');
  const frontmatter = parseFrontmatter(raw);
  return {
    slug,
    name: frontmatter.name ?? slug,
    description: frontmatter.description ?? '',
    file,
    triggers: extractTriggers(raw, frontmatter.description ?? ''),
  };
}

function parseFrontmatter(raw: string): { name?: string; description?: string } {
  if (!raw.startsWith('---')) return {};
  const end = raw.indexOf('---', 3);
  if (end < 0) return {};
  const block = raw.slice(3, end).trim();
  const parsed = parse(block);
  if (!isRecord(parsed)) return {};
  const result: { name?: string; description?: string } = {};
  if (typeof parsed.name === 'string') result.name = parsed.name;
  if (typeof parsed.description === 'string') result.description = parsed.description;
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function extractTriggers(raw: string, description: string): string[] {
  const triggers = new Set<string>();
  if (description) {
    for (const token of description.split(/[,;]/)) {
      const trimmed = token.trim();
      if (trimmed.length > 3) triggers.add(trimmed.slice(0, 120));
    }
  }
  for (const match of raw.matchAll(/`(\/[\w-]+)`/g)) {
    triggers.add(match[1]);
  }
  return [...triggers].slice(0, 8);
}
