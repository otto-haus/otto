import type { Line } from "./components/Terminal";
import type { Status } from "./components/StatusCard";

export type Feature = {
  id: string; // Remotion composition id
  file: string; // output filename stem
  name: string;
  kicker: string;
  tagline: string;
  termTitle: string;
  lines: Line[];
  status: Status;
  proves: string;
};

// Timing (frames @ 30fps)
export const FPS = 30;
const INTRO = 135;
const OUTRO = 240;
const STEP = 40;
const TERM_START = 12;
const TAIL = 80;

export const introFrames = INTRO;
export const outroFrames = OUTRO;
export const termStart = TERM_START;
export const lineStep = STEP;

export const bodyFrames = (lineCount: number) =>
  TERM_START + lineCount * STEP + TAIL;
export const totalFrames = (lineCount: number) =>
  INTRO + bodyFrames(lineCount) + OUTRO;

// OttoV01DesktopWalkthrough (~44s @ 30fps)
export const walkthroughHeroFrames = 90;
export const walkthroughTitleFrames = 90;
export const walkthroughClosingFrames = 105;
export const walkthroughOutroFrames = 75;
export const walkthroughTermStart = 8;
export const walkthroughLineStep = 30;
export const walkthroughBeatTail = 55;

export const walkthroughBeatFrames = (lineCount: number) =>
  walkthroughTermStart + lineCount * walkthroughLineStep + walkthroughBeatTail;

/** Line counts must match OttoV01DesktopWalkthrough terminal beats. */
const WALKTHROUGH_CONNECT_LINES = 10;
const WALKTHROUGH_CHAT_LINES = 7;
const WALKTHROUGH_SURFACES_LINES = 9;

export const walkthroughTotalFrames =
  walkthroughHeroFrames +
  walkthroughTitleFrames +
  walkthroughBeatFrames(WALKTHROUGH_CONNECT_LINES) +
  walkthroughBeatFrames(WALKTHROUGH_CHAT_LINES) +
  walkthroughBeatFrames(WALKTHROUGH_SURFACES_LINES) +
  walkthroughClosingFrames +
  walkthroughOutroFrames;

const L = (kind: Line["kind"], text?: string): Line => ({ kind, text });

// v0.1 cutline (approved): which demos are ship candidates vs proposed vs deferred.
export const v01Cutline: Record<string, "ship" | "proposed" | "deferred"> = {
  OttoV01Charter: "proposed",
  OttoV01Practices: "ship",
  OttoV01Routines: "proposed",
  OttoV01Skills: "ship",
  OttoV01Standards: "proposed",
  OttoV01Autonomy: "deferred",
  OttoV01Desktop: "ship",
  OttoV01DesktopWalkthrough: "ship",
  OttoV01Knowledge: "deferred",
};

export const features: Feature[] = [
  {
    id: "OttoV01Charter",
    file: "otto-v01-charter",
    name: "Charter",
    kicker: "operating contracts",
    tagline:
      "Compile messy intent into a contract, run it autonomously, gate the one-way doors, prove done with receipts.",
    termTitle: "charter — otto",
    lines: [
      L("cmd", "/charter propose ship otto v0.1 to a public repo"),
      L("dim", "compiler · intent → compact contract …"),
      L("head", "Charter: Ship Otto v0.1"),
      L("out", "AC1  rename to Otto + repackage, tests green"),
      L("out", "AC2  public README + feature demos + receipts"),
      L("out", "Approve this charter?  (approve / edit / cancel)"),
      L("cmd", "approve"),
      L("good", "activated → ~/.otto/charters/otto-v01/"),
      L("file", "charter.yaml   state.yaml   ledger.md   receipts/"),
      L("cmd", "/charter step"),
      L("dim", "Scout → Judge → Worker → Receipt → Recorder"),
      L("good", "receipt: receipts/AC1-tests.txt — AC1 met"),
      L("cmd", "/charter step    # push to GitHub remote"),
      L("gate", "Charter Gate: 'push to remote' is a one-way door — approve?"),
      L("dim", "blocked → approvals/push-remote.yaml · no artifact, no progress"),
      L("cmd", "/charter complete"),
      L("good", "Auditor: AC1 + AC2 met — done. lessons → memory."),
    ],
    status: { built: true, tested: "manual", tried: false, approved: false },
    proves:
      "Charter turns intent into evidence-checked work and stops at one-way doors.",
  },
  {
    id: "OttoV01Practices",
    file: "otto-v01-practices",
    name: "Practices",
    kicker: "executable standards",
    tagline:
      "Repeatable workflows with a purpose, guardrails, an evidence standard, and a hard approval floor — validated as specs.",
    termTitle: "otto-practices",
    lines: [
      L("cmd", "bun otto-practices        # validate every Practice spec"),
      L("out", "slug        status  result"),
      L("dim", "----------  ------  ------"),
      L("good", "charter     active  ok"),
      L("out", "decision    draft   ok"),
      L("out", "field-note  draft   ok"),
      L("out", "follow-up   draft   ok"),
      L("out", "review      draft   ok"),
      L("rule"),
      L("cmd", "cat practices/charter/practice.yaml"),
      L("file", "name: Charter   ·   status: active"),
      L("out", "guardrails: approval gates outrank practice logic"),
      L("out", "evidence_standard: receipts mapped to acceptance criteria"),
      L("out", "approval_required_for: [enabling-globally,"),
      L("out", "  external-side-effects, permission-expansion]"),
      L("good", "5 Practice specs · all conform to packages/core/src/types.ts"),
    ],
    status: { built: true, tested: true, tried: false, approved: false },
    proves:
      "Every Practice is a validated spec with a hard approval floor — not vibes.",
  },
  {
    id: "OttoV01Routines",
    file: "otto-v01-routines",
    name: "Routines",
    kicker: "repeated bundles of practices",
    tagline:
      "Bundle Practices into a sequence. Recurring activation needs approval — attention is a one-way door.",
    termTitle: "routine — otto",
    lines: [
      L("cmd", "cat routines/morning/routine.yaml"),
      L("file", "slug: morning      status: proposed"),
      L("out", "steps:"),
      L("out", "  - /charter status    active charters + pending gates"),
      L("out", "  - /review brief      conflicts, missing data, stale receipts"),
      L("out", "  - /decision frame    today's priorities + tradeoffs"),
      L("out", "  - /follow-up draft   relationship follow-ups"),
      L("rule"),
      L("cmd", "/routine resume morning    # activate recurring schedule"),
      L("gate", "Routine Gate: recurring activation is a standing claim on attention — approve?"),
      L("dim", "requires_approval_to_activate: true → approvals/"),
      L("good", "one-off trials are autonomous; recurring schedules wait for the human."),
    ],
    status: { built: true, tested: "manual", tried: false, approved: false },
    proves:
      "Routines compose Practices and refuse to self-schedule without approval.",
  },
  {
    id: "OttoV01Skills",
    file: "otto-v01-skills",
    name: "Skills",
    kicker: "capability packages",
    tagline:
      "Reusable capability and context packages an agent loads to do a kind of work.",
    termTitle: "skills — otto",
    lines: [
      L("cmd", "ls skill/"),
      L("file", "SKILL.md          routine/SKILL.md"),
      L("cmd", "head skill/SKILL.md"),
      L("out", "name: charter"),
      L("out", "description: operating contract system for autonomous agents."),
      L("out", "  Use when the user invokes /charter or gives vague intent."),
      L("rule"),
      L("out", "Object model   Intent → Charter → State → Receipt"),
      L("out", "Loop           Scout → Judge → Worker (+ Auditor proves/rejects done)"),
      L("good", "a Skill packages the workflow + context the agent loads to run a Practice."),
    ],
    status: { built: true, tested: "manual", tried: false, approved: false },
    proves: "Skills are the loadable workflows behind Otto's commands.",
  },
  {
    id: "OttoV01Standards",
    file: "otto-v01-standards",
    name: "Standards",
    kicker: "the explicit canon",
    tagline:
      "What Otto rewards, refuses, and does under pressure. Precedents are the case law.",
    termTitle: "standards — otto",
    lines: [
      L("cmd", "cat standards/registry.yaml"),
      L("file", "authority_stack:"),
      L("out", "  Sebastian → Standards → Curation → [Practices, Routines, Charters, …]"),
      L("out", "ratification: standards_changes_require_human: true   auto_apply: false"),
      L("rule"),
      L("cmd", "ls standards/anti-patterns/"),
      L("file", "fake-progress.md   ceremony-without-signal.md"),
      L("file", "harsh-candor.md    vague-approval.md"),
      L("cmd", "ls standards/precedents/"),
      L("file", "2026-06-13-candor-vs-kindness.md     case law for a Standards conflict"),
      L("good", "in /review, a Standard can block a fake 'done'."),
    ],
    status: { built: true, tested: "manual", tried: false, approved: false },
    proves:
      "Standards are explicit, human-ratified canon that can block fake done.",
  },
  {
    id: "OttoV01Autonomy",
    file: "otto-v01-autonomy",
    name: "Autonomy",
    kicker: "own the reversible · gate the rest",
    tagline:
      "What Otto owns without a human in the loop — and how Ticketcraft compiles bounded worker slices.",
    termTitle: "autonomy — otto",
    lines: [
      L("cmd", "cat docs/autonomy.md     # the three-zone model"),
      L("out", "GREEN   reversible local work          → no prompt"),
      L("out", "YELLOW  installs · migrations · fetch   → one-time prompt"),
      L("out", "RED     send · spend · deploy · merge · push → explicit approval"),
      L("rule"),
      L("cmd", '/ticket compile "add OTTO_HOME env fallback"'),
      L("dim", "Ticketcraft · messy work → sharp ticket packet"),
      L("file", "ticket: allowed_files · acceptance · verify cmd · one-way-door list"),
      L("good", "Main Otto orchestrates; workers execute bounded slices; receipts prove it."),
    ],
    status: { built: true, tested: "manual", tried: false, approved: false },
    proves: "Otto runs autonomously inside green, and escalates one-way doors.",
  },
  {
    id: "OttoV01Desktop",
    file: "otto-v01-desktop",
    name: "otto desktop",
    kicker: "local-first app",
    tagline:
      "A source-install desktop app over a local Letta agent: chat first, honest setup, no fake operational data.",
    termTitle: "otto desktop — v0.1.1",
    lines: [
      L("cmd", "git clone https://github.com/otto-haus/otto.git"),
      L("cmd", "cd otto && bun install && task electron"),
      L("good", "desktop launches as lowercase otto"),
      L("out", "local-only v1 · provider auth stays in Letta"),
      L("rule"),
      L("head", "What works today"),
      L("good", "Chat connects through the real Letta local runtime"),
      L("good", "Markdown renders cleanly in assistant replies"),
      L("good", "Queued sends preserve follow-ups while otto is working"),
      L("good", "Model + reasoning effort controls are visible in the composer"),
      L("good", "Settings shows truthful runtime/agent/provider readiness"),
      L("rule"),
      L("head", "What changed in v0.1.1"),
      L("good", "Icons render as inline currentColor SVG paths — no square masks"),
      L("good", "Letta runtime URL is discovered before asking for overrides"),
      L("good", "Agent identity is discovered from Letta local settings when possible"),
      L("out", "manual URL / Agent ID fields are advanced overrides, not the default path"),
      L("rule"),
      L("head", "What stays honest"),
      L("file", "Charters · Standards · Practices · Routines"),
      L("file", "Curation · Receipts · Autonomy"),
      L("dim", "these surfaces are coming soon; no sample contracts, no fake receipts"),
      L("gate", "Chat unlocks only after session.initialize() succeeds against a live agent"),
      L("out", "connected means connected; missing means diagnosed"),
      L("rule"),
      L("cmd", "task release:gate"),
      L("good", "lint · typecheck · tests · verify:v0 · electron build"),
      L("good", "regression guard: no maskImage / dangerous icon injection"),
      L("good", "regression guard: manual connection fields remain advanced overrides"),
      L("rule"),
      L("out", "v0.1.1 is a source-install patch release"),
      L("out", "signed binary installer: not shipped yet"),
      L("good", "otto.haus → github.com/otto-haus/otto"),
    ],
    status: { built: true, tested: true, tried: true, approved: false },
    proves:
      "The public app is real and local-first, with honest placeholders and a release gate before tags.",
  },
  {
    id: "OttoV01Knowledge",
    file: "otto-v01-knowledge",
    name: "Knowledge",
    kicker: "maintained world model · proposed",
    tagline:
      "What Otto knows about the outside world — starting with how good AI models actually are right now.",
    termTitle: "knowledge — otto (proposed)",
    lines: [
      L("cmd", "cat knowledge/ai-frontier/model-registry.yaml"),
      L("file", "status: proposed     # active routing requires Curation ratification"),
      L("out", "FACTS (costs, notes, last_verified) → Knowledge updates + writes receipts"),
      L("out", "ROUTING (default_roles) → Knowledge may only PROPOSE; Sebastian ratifies"),
      L("gate", "HONESTY: capability ratings are qualitative, not freshly benchmarked"),
      L("rule"),
      L("cmd", "ls knowledge/ai-frontier/"),
      L("file", "model-registry.yaml  capability-notes.md  provider-costs.md"),
      L("dim", "routine: ai-frontier-review keeps assumptions current"),
      L("good", "Built, not Shipped — proposed surface; routing unratified."),
    ],
    status: { built: true, tested: false, tried: false, approved: false },
    proves:
      "Built, not Shipped: a proposed Knowledge surface, clearly marked, routing unratified.",
  },
];
