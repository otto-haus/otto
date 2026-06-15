import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillStore } from './skill-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const skillsDir = join(repoRoot, 'skill');

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
});
