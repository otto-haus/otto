import type { StandardRecord, StandardStatus } from '@otto-haus/core';

export const STANDARD_DOMAINS = [
  'product',
  'design',
  'engineering',
  'agent-behavior',
  'release',
  'brand',
] as const;

export type StandardDomain = (typeof STANDARD_DOMAINS)[number];

export type StandardStatusFilter = 'all' | StandardStatus;

export type StandardsFilterState = {
  query: string;
  status: StandardStatusFilter;
  domain: 'all' | StandardDomain;
};

export function domainForStandard(standard: StandardRecord): StandardDomain | 'uncategorized' {
  if (standard.domain && isStandardDomain(standard.domain)) return standard.domain;
  return inferDomain(standard.slug);
}

export function filterStandards(
  standards: StandardRecord[],
  state: StandardsFilterState,
): StandardRecord[] {
  const q = state.query.trim().toLowerCase();
  return standards.filter((standard) => {
    if (state.status !== 'all' && standard.status !== state.status) return false;
    const domain = domainForStandard(standard);
    if (state.domain !== 'all' && domain !== state.domain) return false;
    if (!q) return true;
    const haystack = [
      standard.name,
      standard.slug,
      standard.meaning,
      standard.markdown,
      ...(standard.failure_modes ?? []),
      ...(standard.reward ?? []),
    ]
      .join('\n')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function groupStandardsByDomain(
  standards: StandardRecord[],
): Array<{ domain: StandardDomain | 'uncategorized'; items: StandardRecord[] }> {
  const buckets = new Map<StandardDomain | 'uncategorized', StandardRecord[]>();
  for (const standard of standards) {
    const domain = domainForStandard(standard);
    const list = buckets.get(domain) ?? [];
    list.push(standard);
    buckets.set(domain, list);
  }
  const ordered: Array<StandardDomain | 'uncategorized'> = [...STANDARD_DOMAINS, 'uncategorized'];
  return ordered
    .filter((domain) => buckets.has(domain))
    .map((domain) => ({
      domain,
      items: (buckets.get(domain) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

function inferDomain(slug: string): StandardDomain | 'uncategorized' {
  switch (slug) {
    case 'quality':
    case 'judgment':
    case 'candor-kindness':
    case 'winning':
      return 'agent-behavior';
    case 'respect-attention':
      return 'product';
    case 'first-principles':
      return 'engineering';
    case 'earned-semver':
      return 'release';
    default:
      return 'uncategorized';
  }
}

function isStandardDomain(value: string): value is StandardDomain {
  return (STANDARD_DOMAINS as readonly string[]).includes(value);
}
