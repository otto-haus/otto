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

  test('parses YAML frontmatter scalars instead of leaking syntax markers', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-skill-store-'));
    try {
      writeFileSync(join(tmp, 'SKILL.md'), `---
name: "quoted skill"
description: |
  First line.
  Second line.
---
# Quoted Skill

Run \`/quoted-skill\` when a quoted skill is needed.
`);

      const store = new SkillStore(tmp);
      const skill = store.get('otto');

      expect(skill?.name).toBe('quoted skill');
      expect(skill?.description).toBe('First line.\nSecond line.\n');
      expect(skill?.triggers).toContain('/quoted-skill');
    } finally {
      rmSync(tmp, { force: true, recursive: true });
    }
  });

  test('skips malformed YAML frontmatter without blocking other skills', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-skill-store-'));
    try {
      writeFileSync(join(tmp, 'SKILL.md'), `---
name: [unterminated
---
# Broken Skill
`);

      const validDir = join(tmp, 'valid');
      mkdirSync(validDir);
      writeFileSync(join(validDir, 'SKILL.md'), `---
name: valid skill
description: usable neighboring skill
---
# Valid Skill
`);

      const result = new SkillStore(tmp).listResult();

      expect(result.skills.some((skill) => skill.slug === 'valid')).toBe(true);
      expect(result.skills.some((skill) => skill.slug === 'otto')).toBe(false);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]?.slug).toBe('otto');
      expect(result.skipped[0]?.reason).toContain('YAML');
    } finally {
      rmSync(tmp, { force: true, recursive: true });
    }
  });
});
