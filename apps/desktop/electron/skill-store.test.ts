import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillStore } from './skill-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const skillsDir = join(repoRoot, 'skill');

/** Issue #86 seed capability stubs — guardrails required in SKILL.md body. */
const SEED_CAPABILITY_SLUGS = [
  'github',
  'browser-proof',
  'pdf',
  '1password',
  'discord',
] as const;

const AUTONOMY_TAGGED_SLUGS = [...SEED_CAPABILITY_SLUGS, 'cognee'] as const;

/** Stubs with one-way-door caps must declare at least one red autonomy line. */
const RED_AUTONOMY_SLUGS = ['github', 'discord', '1password', 'pdf', 'cognee'] as const;

describe('SkillStore', () => {
  test('loads SKILL.md packages from file-backed canon', () => {
    const store = new SkillStore(skillsDir);
    const result = store.listResult();

    expect(result.storage).toBe('files');
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.skills.some((skill) => skill.slug === 'otto')).toBe(true);
  });

  test('get returns a single skill by slug', () => {
    const store = new SkillStore(skillsDir);
    const skill = store.get('otto');
    expect(skill?.file).toContain('SKILL.md');
    expect(skill?.description.length).toBeGreaterThan(0);
  });

  test('parses YAML frontmatter with quoted scalars and block descriptions', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-skill-yaml-'));
    const pkgDir = join(tmp, 'quoted-skill');
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(
      join(pkgDir, 'SKILL.md'),
      `---
name: "quoted skill"
description: |
  Line one of description.
  Line two of description.
---

# Skill body
Use \`/test-cmd\` when needed.
`,
    );

    const store = new SkillStore(tmp);
    const skill = store.get('quoted-skill');

    expect(skill?.name).toBe('quoted skill');
    expect(skill?.description).toBe('Line one of description.\nLine two of description.\n');
    expect(skill?.triggers).toContain('/test-cmd');

    rmSync(tmp, { recursive: true, force: true });
  });

  test('lists at least five skills for the desktop surface (#86)', () => {
    const store = new SkillStore(skillsDir);
    const result = store.listResult();

    expect(result.skipped).toEqual([]);
    expect(result.skills.length).toBeGreaterThanOrEqual(5);
  });

  test('loads seed capability stubs with frontmatter (#86)', () => {
    const store = new SkillStore(skillsDir);
    const slugs = new Set(store.listResult().skills.map((skill) => skill.slug));

    for (const slug of SEED_CAPABILITY_SLUGS) {
      expect(slugs.has(slug)).toBe(true);
      const skill = store.get(slug);
      expect(skill?.description.length).toBeGreaterThan(0);
      expect(skill?.file).toContain(`${slug}/SKILL.md`);
    }
  });

  test('tags dangerous capabilities with Autonomy policy sections (#86)', () => {
    for (const slug of AUTONOMY_TAGGED_SLUGS) {
      const file = join(skillsDir, slug, 'SKILL.md');
      const raw = readFileSync(file, 'utf8');
      expect(raw).toContain('## Autonomy');
      expect(raw).toMatch(/: (green|yellow|red)/);
    }

    for (const slug of RED_AUTONOMY_SLUGS) {
      const file = join(skillsDir, slug, 'SKILL.md');
      const raw = readFileSync(file, 'utf8');
      expect(raw).toMatch(/: red/);
    }
  });
});
