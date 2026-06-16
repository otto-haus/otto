// Generates apps/desktop/src/data/readiness.json from REAL local state.
//
// Checks are file-backed and low-risk only — this never wires the Letta runtime/chat.
// Repo state (workspace, skills, practices, permissions) is read directly. Runtime/agent/
// MCP/functions can come from an OPTIONAL machine-local config that is NOT committed:
//
//     ~/.otto/config.json   { agent?: {id}, runtime?: {connected},
//                             mcpServers?: [...], functions?: [...] }
//
// v1 is local-only: Otto does not store model provider keys. Letta owns provider auth.
// By default this writes the committed preview baseline. Set
// OTTO_READINESS_INCLUDE_LOCAL_CONFIG=1 for a machine-local diagnostic render.
// We never read API keys here.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const repoRoot = resolve(appRoot, '../..');
const outputPath = process.env.OTTO_READINESS_OUTPUT_PATH
  ? resolve(process.env.OTTO_READINESS_OUTPUT_PATH)
  : join(appRoot, 'src/data/readiness.json');
const electronDir = join(appRoot, 'electron');

const has = (...p) => existsSync(join(...p));
const storePresent = (name) => has(electronDir, `${name}-store.ts`);
// Keep committed output source-neutral; only local diagnostic renders may expose a home-relative repo path.
const tilde = (p) => (p && p.startsWith(homedir()) ? '~' + p.slice(homedir().length) : p);

// optional, machine-local, never committed
let cfg = {};
const customConfigPath = process.env.OTTO_READINESS_CONFIG_PATH;
const configPath = customConfigPath ? resolve(customConfigPath) : join(homedir(), '.otto', 'config.json');
const includeLocalConfig =
  process.env.OTTO_READINESS_INCLUDE_LOCAL_CONFIG === '1' &&
  process.env.OTTO_READINESS_IGNORE_LOCAL_CONFIG !== '1';
const hasConfig = includeLocalConfig && existsSync(configPath);
if (hasConfig) {
  try { cfg = JSON.parse(readFileSync(configPath, 'utf8')); } catch { cfg = {}; }
}
const repoSource = includeLocalConfig ? tilde(repoRoot) : 'repo root';

// --- real repo checks ---
let isOttoRepo = false;
try { isOttoRepo = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).name === 'otto'; } catch {}

const skillMain = has(repoRoot, 'skill', 'SKILL.md');
const skillRoutine = has(repoRoot, 'skill', 'routine', 'SKILL.md');
const skillsPresent = [skillMain && 'SKILL.md', skillRoutine && 'routine/SKILL.md'].filter(Boolean);

const permissionsDoc = has(repoRoot, 'docs', 'autonomy.md');
const practicesBundled = has(appRoot, 'src/data/practices.json');

const surface = (key, label, storeName, detail, source = '~/.otto') => ({
  key,
  label,
  required: false,
  status: storePresent(storeName) ? 'file' : 'missing',
  detail: storePresent(storeName) ? detail : 'IPC store not present in desktop build',
  source: storePresent(storeName) ? source : null,
  action: storePresent(storeName) ? 'Open the surface in the desktop app' : 'Ship the store before marking ready',
});

// --- config-derived (absent in a fresh clone → honestly missing/not-wired) ---
const runtimeConnected = cfg.runtime?.connected === true;
const agentId = cfg.agentId ?? cfg.agent?.id; // ConfigStore writes flat agentId; accept nested too
const mcpCount = Array.isArray(cfg.mcpServers) ? cfg.mcpServers.length : 0;
const fnCount = Array.isArray(cfg.functions) ? cfg.functions.length : 0;
const labsEnabled = cfg.labs?.enabled === true;
const labsFeatureCount = cfg.labs?.features && typeof cfg.labs.features === 'object'
  ? Object.values(cfg.labs.features).filter(Boolean).length
  : 0;
const cfgSrc = hasConfig ? (customConfigPath ? 'local readiness config' : '~/.otto/config.json') : null;

const items = [
  { key: 'runtime', label: 'Letta runtime', required: true,
    status: runtimeConnected ? 'connected' : 'not-wired',
    detail: runtimeConnected ? 'connected' : 'SDK session not connected in this preview',
    source: cfgSrc, action: 'Connect Letta in Settings → General' },
  { key: 'agent', label: 'Agent identity', required: true,
    status: agentId ? 'configured' : 'missing',
    detail: agentId ? `agent ${agentId}` : 'No agent selected',
    source: agentId ? cfgSrc : null, action: 'Set the agent in Settings → Connect Letta' },
  { key: 'model', label: 'Model provider', required: false,
    status: runtimeConnected ? 'connected' : 'not-wired',
    detail: runtimeConnected ? 'owned by local Letta runtime' : 'Provider auth lives in Letta, not otto',
    source: cfgSrc, action: 'Configure providers in Letta Desktop / Letta local runtime' },
  { key: 'memory', label: 'Memory / MemFS', required: true,
    status: runtimeConnected ? 'connected' : 'not-wired',
    detail: 'Depends on a live runtime connection', source: '~/.otto',
    action: 'Available once the runtime connects' },
  { key: 'workspace', label: 'Workspace root', required: false,
    status: isOttoRepo ? 'configured' : (existsSync(repoRoot) ? 'file' : 'missing'),
    detail: isOttoRepo ? 'otto repo detected' : 'repo root', source: repoSource,
    action: 'Override with OTTO_HOME' },
  { key: 'skills', label: 'Skills', required: false,
    status: skillsPresent.length ? 'file' : 'missing',
    detail: skillsPresent.length ? skillsPresent.join(' · ') : 'none found', source: 'skill/',
    action: 'Run bun run install-extension; set MEMORY_DIR for automatic skill copy' },
  { key: 'practices', label: 'Practices', required: false,
    status: storePresent('practice') && practicesBundled ? 'file' : 'missing',
    detail: storePresent('practice') && practicesBundled
      ? 'Practice store + bundled catalog wired in desktop IPC'
      : 'Practice loader missing',
    source: storePresent('practice') ? '~/.otto/practices' : 'src/data/practices.json',
    action: 'Open Practices surface in the desktop app' },
  { key: 'mcp', label: 'MCP servers', required: false,
    status: mcpCount > 0 ? 'configured' : 'missing',
    detail: mcpCount > 0 ? `${mcpCount} configured` : 'None configured',
    source: mcpCount > 0 ? cfgSrc : null, action: 'Add mcpServers in ~/.otto/config.json' },
  { key: 'functions', label: 'Functions', required: false,
    status: fnCount > 0 ? 'configured' : 'missing',
    detail: fnCount > 0 ? `${fnCount} registered` : 'No local tools registered',
    source: fnCount > 0 ? cfgSrc : null, action: 'Register functions in ~/.otto/config.json' },
  { key: 'labs', label: 'Labs master', required: false,
    status: hasConfig ? (labsEnabled ? 'enabled' : 'off') : 'missing',
    detail: hasConfig
      ? (labsEnabled
        ? `master on · ${labsFeatureCount} feature${labsFeatureCount === 1 ? '' : 's'} enabled`
        : 'master off (Ship default)')
      : 'Labs gate not in local config snapshot',
    source: hasConfig ? cfgSrc : null,
    action: 'Toggle in Settings → Labs or window.otto.labs.set' },
  { key: 'permissions', label: 'Permissions / autonomy', required: false,
    status: permissionsDoc && storePresent('autonomy') ? 'file' : (permissionsDoc ? 'file' : 'missing'),
    detail: storePresent('autonomy')
      ? 'Autonomy policy store + docs/autonomy.md'
      : 'Three-zone policy defined; not runtime-enforced',
    source: storePresent('autonomy') ? '~/.otto/autonomy' : 'docs/autonomy.md',
    action: 'Open Autonomy surface; runtime permission modal ships separately' },
  surface('charters', 'Charters', 'charter', 'Charter store + AC gate wired'),
  surface('standards', 'Standards', 'standard', 'Standards catalog + citation resolver'),
  surface('routines', 'Routines', 'routine', 'Routine catalog + manual run gate'),
  surface('curation', 'Curation', 'proposal', 'Proposal + approval stores'),
  surface('receipts', 'Receipts', 'receipt', 'Receipt index under ~/.otto/receipts'),
  surface('autonomy', 'Autonomy', 'autonomy', 'Three-zone policy evaluator'),
  surface('knowledge', 'Knowledge', 'knowledge', 'Role → model routing table'),
  surface('tickets', 'Tickets', 'ticket', 'Compile + orchestrate in worktrees'),
  surface('channels', 'Channels', 'channel', 'Channel contract file store'),
];

const requiredMissing = items.filter((i) => i.required && (i.status === 'missing' || i.status === 'not-wired'));
const out = { ready: requiredMissing.length === 0, configSource: cfgSrc, items };
writeFileSync(outputPath, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote readiness (${items.length} items, ${requiredMissing.length} required missing, ready=${out.ready}) to ${outputPath}`);
