import { describe, expect, test } from 'bun:test';
import type { StandardRecord } from '@otto-haus/core';
import { domainForStandard, filterStandards, groupStandardsByDomain } from './standards-filter';

function sample(slug: string, overrides: Partial<StandardRecord> = {}): StandardRecord {
  return {
    schema: 'otto.standard.v1',
    name: slug,
    slug,
    version: '0.1',
    status: 'active',
    meaning: `meaning for ${slug}`,
    under_pressure: { do: [], refuse: [] },
    reward: [],
    failure_modes: [],
    conflicts_with: [],
    tie_breakers: [],
    related_practices: [],
    related_curation_rules: [],
    evidence: [],
    ratification: { owner: 'Sebastian', standards_changes_require_human: true },
    file: `standards/standards/${slug}.md`,
    registry_file: 'standards/registry.yaml',
    markdown: `# ${slug}\nCanon body for ${slug}.`,
    ...overrides,
  };
}

describe('standards-filter', () => {
  test('filters by status and query', () => {
    const standards = [
      sample('quality', { status: 'active' }),
      sample('judgment', { status: 'draft', meaning: 'other' }),
    ];
    expect(filterStandards(standards, { query: '', status: 'active', domain: 'all' })).toHaveLength(1);
    expect(filterStandards(standards, { query: 'canon body', status: 'all', domain: 'all' })).toHaveLength(2);
    expect(filterStandards(standards, { query: 'missing', status: 'all', domain: 'all' })).toHaveLength(0);
  });

  test('filters by explicit domain metadata', () => {
    const standards = [
      sample('quality', { domain: 'brand' }),
      sample('judgment'),
    ];
    expect(filterStandards(standards, { query: '', status: 'all', domain: 'brand' })).toHaveLength(1);
    expect(domainForStandard(standards[0]!)).toBe('brand');
    expect(domainForStandard(standards[1]!)).toBe('agent-behavior');
  });

  test('groups standards by domain in stable order', () => {
    const grouped = groupStandardsByDomain([
      sample('earned-semver'),
      sample('quality'),
      sample('respect-attention'),
    ]);
    expect(grouped.map((g) => g.domain)).toEqual(['product', 'agent-behavior', 'release']);
  });
});
