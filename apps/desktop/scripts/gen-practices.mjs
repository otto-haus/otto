import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const repoRoot = resolve(appRoot, '../..');
const practicesRoot = join(repoRoot, 'practices');
const outputPath = join(appRoot, 'src/data/practices.json');

const approvalRequirementMap = new Map([
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

const requiredFloor = ['enabling-globally', 'external-side-effects', 'permission-expansion'];

function normalizeApprovalRequirement(value) {
  const normalized = String(value).trim().toLowerCase();
  const mapped = approvalRequirementMap.get(normalized);

  if (!mapped) {
    throw new Error(`Unknown approval requirement: ${value}`);
  }

  return mapped;
}

function normalizeSpec(spec, slug) {
  const approvalRequirements = Array.from(
    new Set([
      ...requiredFloor,
      ...(spec.approval_required_for ?? []).map(normalizeApprovalRequirement),
    ]),
  );

  return {
    ...spec,
    slug: spec.slug ?? slug,
    version: String(spec.version),
    approval_required_for: approvalRequirements,
  };
}

const entries = await readdir(practicesRoot, { withFileTypes: true });
const specs = [];

for (const entry of entries) {
  if (!entry.isDirectory()) {
    continue;
  }

  const specPath = join(practicesRoot, entry.name, 'practice.yaml');
  const raw = await readFile(specPath, 'utf8');
  specs.push(normalizeSpec(YAML.parse(raw), entry.name));
}

specs.sort((a, b) => {
  if (a.status !== b.status) {
    return a.status === 'active' ? -1 : 1;
  }

  return a.name.localeCompare(b.name);
});

await writeFile(outputPath, `${JSON.stringify(specs, null, 2)}\n`);
console.log(`Wrote ${specs.length} Practice specs to ${outputPath}`);
