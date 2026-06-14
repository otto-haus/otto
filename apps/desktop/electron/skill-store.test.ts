import { describe, expect, test } from 'bun:test';
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
});
