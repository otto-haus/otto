#!/usr/bin/env bun
/**
 * Mechanical audit for docs/v1/ship-tier-matrix.md (ticket 136 / issue #129).
 * Ensures code tier registries match the matrix and every Ship row names a proof path.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function parseSurfaceTierRecord(source) {
  const block = source.match(/export const SURFACE_TIER[^=]*=\s*\{([\s\S]*?)\};/);
  if (!block) {
    fail('Could not parse SURFACE_TIER from surface-tiers.ts');
    return {};
  }
  const tiers = {};
  for (const match of block[1].matchAll(/(\w+):\s*'(ship|labs|cut)'/g)) {
    tiers[match[1]] = match[2];
  }
  return tiers;
}

function parseLabFeatureIds(source) {
  const block = source.match(/export type LabFeatureId\s*=\s*([\s\S]*?);/);
  if (!block) {
    fail('Could not parse LabFeatureId from types.ts');
    return [];
  }
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function parseLabFeatureMeta(source) {
  const block = source.match(/export const LAB_FEATURE_META[^=]*=\s*\{([\s\S]*?)\};/);
  if (!block) return [];
  return [...block[1].matchAll(/^\s{2}(\w+):\s*\{/gm)].map((m) => m[1]);
}

function surfaceLabelToId(label) {
  return label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
}

/** Map matrix Surface column labels to SurfaceId keys. */
const SURFACE_LABEL_TO_ID = {
  chat: 'chat',
  settings: 'settings',
  onboarding: null,
  charters: 'charters',
  standards: 'standards',
  practices: 'practices',
  routines: 'routines',
  curation: 'curation',
  receipts: 'receipts',
  checks: 'checks',
  autonomy: 'autonomy',
  skills: 'skills',
  knowledge: 'knowledge',
  tickets: 'tickets',
  terminal: 'terminal',
  channels: 'channels',
};

function parseMarkdownTable(section, heading) {
  const re = new RegExp(`## ${heading}[\\s\\S]*?\\n\\|[^\\n]+\\|\\n\\|[-| ]+\\|\\n([\\s\\S]*?)(?=\\n---|\\n## |$)`);
  const match = section.match(re);
  if (!match) {
    fail(`Missing ## ${heading} table in ship-tier-matrix.md`);
    return [];
  }
  const rows = [];
  for (const line of match[1].trim().split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length === 0) continue;
    rows.push(cells);
  }
  return rows;
}

function normalizeTier(cell) {
  return cell.trim().toLowerCase();
}

function hasProofPath(cell) {
  const text = cell.trim();
  if (text.length < 4) return false;
  if (/^n\/a$/i.test(text)) return false;
  if (/^tbd$/i.test(text)) return false;
  return true;
}

const matrixPath = 'docs/v1/ship-tier-matrix.md';
const matrix = read(matrixPath);
const surfaceTiers = parseSurfaceTierRecord(read('apps/desktop/src/surface-tiers.ts'));
const labFeatureIds = parseLabFeatureIds(read('apps/desktop/electron/shared/types.ts'));
const labFeatureMeta = parseLabFeatureMeta(read('apps/desktop/src/surface-tiers.ts'));

const sidebarRows = parseMarkdownTable(matrix, 'Sidebar surfaces');
const chatRows = parseMarkdownTable(matrix, 'Chat sub-flows');
const labsRows = parseMarkdownTable(matrix, 'Labs features \\(not always a sidebar row\\)');

const matrixSurfaceIds = new Set();
const matrixLabIds = new Set();

for (const cells of sidebarRows) {
  const [surface, tier, , , proof] = cells;
  const id = SURFACE_LABEL_TO_ID[surfaceLabelToId(surface)] ?? surfaceLabelToId(surface);
  if (id) matrixSurfaceIds.add(id);

  if (normalizeTier(tier) === 'ship' && !hasProofPath(proof ?? '')) {
    fail(`Sidebar Ship row "${surface}" lacks proof command/path`);
  }

  if (id && surfaceTiers[id] && normalizeTier(tier) !== surfaceTiers[id]) {
    fail(
      `Tier mismatch for ${id}: matrix="${tier}" vs SURFACE_TIER="${surfaceTiers[id]}"`,
    );
  }
}

for (const cells of chatRows) {
  const [flow, tier, , proof] = cells;
  if (normalizeTier(tier) === 'ship' && !hasProofPath(proof ?? '')) {
    fail(`Chat sub-flow Ship row "${flow}" lacks proof path`);
  }
}

for (const cells of labsRows) {
  const featureCell = cells[0] ?? '';
  const idMatch = featureCell.match(/`([^`]+)`/);
  const id = idMatch?.[1] ?? featureCell.replace(/`/g, '').trim();
  if (id) matrixLabIds.add(id);
}

for (const id of Object.keys(surfaceTiers)) {
  if (!matrixSurfaceIds.has(id)) {
    fail(`SurfaceId "${id}" in SURFACE_TIER missing from matrix sidebar table`);
  }
}

for (const id of labFeatureIds) {
  if (!matrixLabIds.has(id)) {
    fail(`LabFeatureId "${id}" missing from matrix Labs features table`);
  }
}

for (const id of labFeatureMeta) {
  if (!labFeatureIds.includes(id)) {
    fail(`LAB_FEATURE_META key "${id}" not in LabFeatureId type`);
  }
}

for (const id of labFeatureIds) {
  if (!labFeatureMeta.includes(id)) {
    fail(`LabFeatureId "${id}" missing from LAB_FEATURE_META`);
  }
}

const cutRequired = [
  'Otto Cloud live stack',
  'Cathedral control plane',
  'Paperclip write integration',
  'Extension `/ticket` CLI',
];
for (const item of cutRequired) {
  if (!matrix.includes(item)) {
    fail(`Cut section missing "${item}"`);
  }
}

if (!matrix.includes('Reopen list')) {
  fail('Matrix missing Reopen list section');
}

if (failures.length > 0) {
  console.error('ship-tier-matrix check failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(
  `ship-tier-matrix OK: ${Object.keys(surfaceTiers).length} surfaces, ${labFeatureIds.length} lab features, Ship rows have proof paths`,
);
