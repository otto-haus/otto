// Generates apps/desktop/src/data/readiness.json from REAL local state.
//
// Checks are file-backed and low-risk only — this never wires the Letta runtime/chat.
// Repo state (workspace, skills, practices, permissions) is read directly. Runtime/agent/
// model/MCP/functions come from an OPTIONAL machine-local config that is NOT committed:
//
//     ~/.otto/config.json   { agent?: {id}, model?: {provider, model}, runtime?: {connected},
//                             mcpServers?: [...], functions?: [...] }
//
// We do NOT read API keys from the environment — only the config file — so the committed
// readiness.json is a deterministic fresh-clone baseline (no secrets, no machine leakage).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const repoRoot = resolve(appRoot, '../..');
const outputPath = join(appRoot, 'src/data/readiness.json');

const has = (...p) => existsSync(join(...p));
// Home-relativize so the committed readiness.json never leaks an absolute /Users/... path.
const tilde = (p) => (p && p.startsWith(homedir()) ? '~' + p.slice(homedir().length) : p);

// optional, machine-local, never committed
let cfg = {};
const configPath = join(homedir(), '.otto', 'config.json');
const hasConfig = existsSync(configPath);
if (hasConfig) {
  try { cfg = JSON.parse(readFileSync(configPath, 'utf8')); } catch { cfg = {}; }
}

// --- real repo checks ---
let isOttoRepo = false;
try { isOttoRepo = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).name === 'otto'; } catch {}

const skillMain = has(repoRoot, 'skill', 'SKILL.md');
const skillRoutine = has(repoRoot, 'skill', 'routine', 'SKILL.md');
const skillsPresent = [skillMain && 'SKILL.md', skillRoutine && 'routine/SKILL.md'].filter(Boolean);

let practiceCount = 0;
try {
  practiceCount = JSON.parse(readFileSync(join(appRoot, 'src/data/practices.json'), 'utf8')).length;
} catch {
  try {
    const pdir = join(repoRoot, 'practices');
    practiceCount = readdirSync(pdir).filter((d) => has(pdir, d, 'practice.yaml')).length;
  } catch {}
}

const permissionsDoc = has(repoRoot, 'docs', 'autonomy.md');

// --- config-derived (absent in a fresh clone → honestly missing/not-wired) ---
const runtimeConnected = cfg.runtime?.connected === true;
const agentId = cfg.agent?.id;
const modelProvider = cfg.model?.provider || cfg.model?.model;
const mcpCount = Array.isArray(cfg.mcpServers) ? cfg.mcpServers.length : 0;
const fnCount = Array.isArray(cfg.functions) ? cfg.functions.length : 0;
const cfgSrc = hasConfig ? '~/.otto/config.json' : null;

const items = [
  { key: 'runtime', label: 'Letta runtime', required: true,
    status: runtimeConnected ? 'connected' : 'not-wired',
    detail: runtimeConnected ? 'connected' : 'SDK session not connected in this preview',
    source: cfgSrc, action: 'Wire @letta-ai/letta-code-sdk (deferred from v0.1)' },
  { key: 'agent', label: 'Agent identity', required: true,
    status: agentId ? 'configured' : 'missing',
    detail: agentId ? `agent ${agentId}` : 'No agent selected',
    source: agentId ? cfgSrc : null, action: 'Set agent.id in ~/.otto/config.json' },
  { key: 'model', label: 'Model provider (BYOK)', required: true,
    status: modelProvider ? 'configured' : 'missing',
    detail: modelProvider ? `provider: ${cfg.model.provider ?? 'set'}` : 'No provider configured',
    source: modelProvider ? cfgSrc : null, action: 'Add model.provider in ~/.otto/config.json (key never stored)' },
  { key: 'memory', label: 'Memory / MemFS', required: true,
    status: runtimeConnected ? 'connected' : 'not-wired',
    detail: 'Depends on a live runtime connection', source: '~/.otto',
    action: 'Available once the runtime connects' },
  { key: 'workspace', label: 'Workspace root', required: false,
    status: isOttoRepo ? 'configured' : (existsSync(repoRoot) ? 'file' : 'missing'),
    detail: isOttoRepo ? 'Otto repo detected' : 'repo root', source: tilde(repoRoot),
    action: 'Override with OTTO_HOME' },
  { key: 'skills', label: 'Skills', required: false,
    status: skillsPresent.length ? 'file' : 'missing',
    detail: skillsPresent.length ? skillsPresent.join(' · ') : 'none found', source: 'skill/',
    action: 'Install into a live agent via scripts/install.sh' },
  { key: 'practices', label: 'Practices', required: false,
    status: practiceCount > 0 ? 'configured' : 'missing',
    detail: `${practiceCount} practice spec${practiceCount === 1 ? '' : 's'}`,
    source: 'apps/desktop/src/data/practices.json',
    action: practiceCount ? 'validated via otto-practices' : 'run gen:practices' },
  { key: 'mcp', label: 'MCP servers', required: false,
    status: mcpCount > 0 ? 'configured' : 'missing',
    detail: mcpCount > 0 ? `${mcpCount} configured` : 'None configured',
    source: mcpCount > 0 ? cfgSrc : null, action: 'Add mcpServers in ~/.otto/config.json' },
  { key: 'functions', label: 'Functions', required: false,
    status: fnCount > 0 ? 'configured' : 'missing',
    detail: fnCount > 0 ? `${fnCount} registered` : 'No local tools registered',
    source: fnCount > 0 ? cfgSrc : null, action: 'Register functions in ~/.otto/config.json' },
  { key: 'permissions', label: 'Permissions / autonomy', required: false,
    status: permissionsDoc ? 'file' : 'missing',
    detail: 'Three-zone policy defined; not runtime-enforced', source: 'docs/autonomy.md',
    action: 'Enforced once Curation + runtime land' },
];

const requiredMissing = items.filter((i) => i.required && (i.status === 'missing' || i.status === 'not-wired'));
const out = { ready: requiredMissing.length === 0, configSource: cfgSrc, items };
writeFileSync(outputPath, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote readiness (${items.length} items, ${requiredMissing.length} required missing, ready=${out.ready}) to ${outputPath}`);
