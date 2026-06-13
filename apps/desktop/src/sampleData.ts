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

export const agent = {
  name: 'Otto',
  id: 'agent-local-otto',
  backend: 'local',
  model: 'claude-opus-4-8',
  memfs: true,
  cwd: '~/Code/otto',
};
