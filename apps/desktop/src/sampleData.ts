// Sample data for the v0.1 workspace shell. The Practices surface reads the real
// generated practices.json; the other surfaces use small, clearly-labelled prototype
// records that mirror the real file-backed shapes (charter.yaml, routine.yaml, etc.).

export type Charter = {
  slug: string;
  title: string;
  status: 'active' | 'proposed' | 'complete';
  intent: string;
  acceptance: { id: string; text: string; done: boolean }[];
  root: string;
  receipts: number;
};

export const sampleCharters: Charter[] = [
  {
    slug: 'otto-v01',
    title: 'Ship Otto v0.1 to a public repo',
    status: 'active',
    intent: 'Rename to Otto, prove every feature, demo it, keep it local until approved.',
    acceptance: [
      { id: 'AC1', text: 'Rename + repackage to @otto-haus; tests green', done: true },
      { id: 'AC2', text: 'Public README + 8 feature demos + receipts', done: true },
      { id: 'AC3', text: 'Sebastian tries the demos and approves', done: false },
    ],
    root: '~/.otto/charters/otto-v01/',
    receipts: 8,
  },
  {
    slug: 'desktop-shell',
    title: 'Otto Desktop — workspace shell',
    status: 'active',
    intent: 'A workspace over Otto: surfaces in a sidebar, chat-primary, file-backed panes.',
    acceptance: [
      { id: 'AC1', text: 'Sidebar surfaces + chat-primary frame', done: true },
      { id: 'AC2', text: 'Wire to the Letta runtime (SDK)', done: false },
    ],
    root: '~/.otto/charters/desktop-shell/',
    receipts: 1,
  },
];

export type StandardRow = { slug: string; name: string };
export const standards: StandardRow[] = [
  { slug: 'quality', name: 'Quality / No Fake Done' },
  { slug: 'judgment', name: 'Judgment' },
  { slug: 'candor-kindness', name: 'Candor + Kindness' },
  { slug: 'respect-attention', name: 'Respect Attention' },
  { slug: 'first-principles', name: 'First-Principles Reasoning' },
  { slug: 'winning', name: 'Winning / Outcomes Over Motion' },
];
export const precedents = [{ slug: '2026-06-13-candor-vs-kindness', name: 'Candor vs. Kindness' }];
export const antiPatterns = ['fake-progress', 'ceremony-without-signal', 'harsh-candor', 'vague-approval'];

export type Routine = {
  slug: string;
  name: string;
  status: 'active' | 'proposed';
  steps: { invocation: string; note: string }[];
  recurring: boolean;
};
export const sampleRoutines: Routine[] = [
  {
    slug: 'morning',
    name: 'Morning Routine',
    status: 'proposed',
    recurring: true,
    steps: [
      { invocation: '/charter status', note: 'active charters + pending gates' },
      { invocation: '/review brief', note: 'conflicts, missing data, stale receipts' },
      { invocation: '/decision frame', note: "today's priorities + tradeoffs" },
      { invocation: '/follow-up draft', note: 'relationship follow-ups' },
    ],
  },
  {
    slug: 'ai-frontier-review',
    name: 'AI Frontier Review',
    status: 'proposed',
    recurring: true,
    steps: [
      { invocation: 'knowledge refresh', note: 'update model-registry facts + receipts' },
      { invocation: 'curation propose', note: 'routing changes → Sebastian ratifies' },
    ],
  },
];

export type Zone = { tag: string; cls: 'g' | 'y' | 'r'; label: string; examples: string };
export const autonomyZones: Zone[] = [
  { tag: 'GREEN', cls: 'g', label: 'Owns — no prompt', examples: 'reads, local edits, workspace-write runs, tests, branch commits' },
  { tag: 'YELLOW', cls: 'y', label: 'One-time prompt', examples: 'package installs, external fetch, schema migrations, indexing' },
  { tag: 'RED', cls: 'r', label: 'Explicit approval', examples: 'send/publish, spend, deploy, merge to protected main, force-push, delete' },
];

// Honest agent state: the preview is NOT connected to a live runtime.
export const agent = {
  name: 'Otto',
  id: '— no agent selected —',
  backend: 'local',
  model: 'unset',
  connected: false,
  cwd: '~/Code/otto',
};

// Readiness / setup model. The preview is file-backed only; nothing is wired to a runtime,
// so required runtime items honestly read "not wired" / "missing".
export type ReadyStatus = 'connected' | 'configured' | 'file' | 'missing' | 'not-wired';

export type ReadyItem = {
  key: string;
  label: string;
  status: ReadyStatus;
  detail: string;
  source?: string;
  action: string;
  required: boolean;
};

export const readiness: ReadyItem[] = [
  { key: 'runtime', label: 'Letta runtime', status: 'not-wired', required: true, detail: 'SDK session not connected in this preview', action: 'Wire @letta-ai/letta-code-sdk (deferred from v0.1)' },
  { key: 'agent', label: 'Agent identity', status: 'missing', required: true, detail: 'No agent selected', action: 'Select or create an Otto agent' },
  { key: 'model', label: 'Model provider (BYOK)', status: 'missing', required: true, detail: 'No provider or API key configured', action: 'Add a provider + key (via 1Password)' },
  { key: 'memory', label: 'Memory / MemFS', status: 'not-wired', required: true, detail: 'Depends on a live runtime connection', source: '~/.otto', action: 'Available once the runtime connects' },
  { key: 'workspace', label: 'Workspace root', status: 'file', required: false, detail: 'Default ~/.otto', source: '~/.otto (OTTO_HOME)', action: 'Override with OTTO_HOME' },
  { key: 'skills', label: 'Skills', status: 'file', required: false, detail: 'Charter + Routine skill packages present', source: 'skill/SKILL.md · skill/routine/SKILL.md', action: 'Install into a live agent via scripts/install.sh' },
  { key: 'mcp', label: 'MCP servers', status: 'missing', required: false, detail: 'None configured', action: 'Add MCP servers (not wired yet)' },
  { key: 'functions', label: 'Functions', status: 'missing', required: false, detail: 'No local tools registered', action: 'Register local tools (not wired yet)' },
  { key: 'permissions', label: 'Permissions / autonomy', status: 'file', required: false, detail: 'Three-zone policy defined; not runtime-enforced', source: 'docs/autonomy.md', action: 'Enforced once Curation + runtime land' },
];

export const requiredMissing = readiness.filter(
  (r) => r.required && (r.status === 'missing' || r.status === 'not-wired'),
);
export const isReady = requiredMissing.length === 0;
