/**
 * Otto — v0 shared contract (core types).
 *
 * This file is the SINGLE SOURCE OF TRUTH for the primitives that every Otto
 * lane depends on (practices/core, routines, channels, desktop). Keep it small,
 * stable, and dependency-free. Changing a type here is a legitimacy change — it
 * affects shared meaning — so it goes through review, not a drive-by edit.
 *
 * Naming is LOCKED (2026-06-13):
 *   Charter   = operating contracts
 *   Practices = executable culture
 *   Routines  = repeated bundles of Practices
 *   Channels  = where Otto reaches you
 *   Runs      = execution records
 *   Receipts  = proof
 *
 * Substrate rule: Files = truth, Memory = lessons, UI = workspace.
 */

// ---------------------------------------------------------------------------
// Scalars
// ---------------------------------------------------------------------------

/** ISO-8601 timestamp, e.g. "2026-06-13T16:41:00Z". */
export type ISO8601 = string;

/** kebab-case identifier, e.g. "field-note". Matches a practice directory name. */
export type Slug = string;

/** Opaque unique id (uuid / nanoid / ksuid). */
export type Id = string;

/** Semantic version string, e.g. "0.1". */
export type SemVer = string;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type PracticeStatus = 'draft' | 'active' | 'deprecated';

export type RunStatus =
  | 'running'   // in progress
  | 'blocked'   // paused at an approval gate (NOT failed)
  | 'success'   // met the evidence standard
  | 'aborted'   // stopped before completion
  | 'failed';   // ended without meeting the evidence standard

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';

export type RoutineStatus = 'proposed' | 'trial' | 'active' | 'paused' | 'retired';

export type ChannelKind = 'discord' | 'imessage' | 'slack' | 'email' | 'desktop' | 'cli';

/**
 * The standing approval floor. Every Practice MUST require approval for at least
 * these. A Practice may ADD more, but may never remove one of these.
 */
export type ApprovalRequirement =
  | 'enabling-globally'
  | 'external-side-effects'
  | 'permission-expansion'
  // common additions (communication / money / infra one-way doors):
  | 'send-or-publish'
  | 'spend'
  | 'deploy'
  | 'delete-or-destroy'
  | 'credential-or-security-change';

export const APPROVAL_FLOOR: readonly ApprovalRequirement[] = [
  'enabling-globally',
  'external-side-effects',
  'permission-expansion',
] as const;

// ---------------------------------------------------------------------------
// Practice — the product concept
// ---------------------------------------------------------------------------

/** If a Practice is implemented as code (like Charter) rather than a draft spec. */
export interface PracticeImplementation {
  /** Repo-relative path to a Letta Code extension, e.g. "extension/charter.ts". */
  extension?: string;
  /** Repo-relative path to the agent skill, e.g. "skill/SKILL.md". */
  skill?: string;
  /** Repo-relative dir holding artifact templates, e.g. "templates/". */
  templates?: string;
}

/**
 * The machine-readable Practice spec. Mirrors `practices/<slug>/practice.yaml`.
 * The slash command is only the invocation layer; this is the workflow contract.
 */
export interface PracticeSpec {
  name: string;
  slug: Slug;
  version: SemVer;
  status: PracticeStatus;
  summary: string;
  /** Present only for Practices that ship as code. */
  implementation?: PracticeImplementation;
  /** Slash-command invocations, e.g. ["/charter propose", "/charter step"]. */
  invocations: string[];
  /** When Otto should recommend or invoke this Practice. */
  triggers: string[];
  /** What the user/environment must provide. */
  inputs: string[];
  /** Artifacts / decisions / drafts / receipts produced. */
  outputs: string[];
  /** Where durable records live (e.g. ["charters/"], ["decisions/"]). */
  state_paths: string[];
  /** What it must not do, or must ask before doing. */
  guardrails: string[];
  /** What counts as successful completion. */
  evidence_standard: string[];
  /** Names of metrics this Practice tracks (see PracticeMetrics). */
  metrics: string[];
  owner: string;
  /** MUST be a superset of APPROVAL_FLOOR. */
  approval_required_for: ApprovalRequirement[];
}

/** Runtime metrics for a Practice. Durable state, not memory. */
export interface PracticeMetrics {
  uses: number;
  last_used_at: ISO8601 | null;
  successful_runs: number;
  blocked_runs: number;
  user_edits_required: number;
  premature_done_prevented: number;
  avg_time_to_artifact_ms: number | null;
  notes: string[];
  /** Practice-specific extras, e.g. decision_quality_score, drafts_created. */
  [extra: string]: number | string | string[] | ISO8601 | null;
}

// ---------------------------------------------------------------------------
// Routine — a repeated bundle of Practices
// ---------------------------------------------------------------------------

/**
 * Routines are product/culture language; schedules/cron are the mechanism.
 * A standing recurring Routine spends the user's attention (a finite one-way-door
 * resource), so ACTIVATION of a recurring Routine requires the human's nod.
 */
export interface Routine {
  id: Id;
  slug: Slug;
  name: string;
  status: RoutineStatus;
  summary: string;
  /** Ordered Practice invocations this Routine bundles. */
  steps: RoutineStep[];
  /** Mechanism only. Absent => on-demand. */
  schedule?: Schedule;
  /** Honest accounting of the attention it costs the human. */
  attention_cost: 'none' | 'low' | 'medium' | 'high';
  /** Activating a recurring Routine always requires approval. */
  requires_approval_to_activate: boolean;
  created_at: ISO8601;
}

export interface RoutineStep {
  practice: Slug;
  invocation: string;
  /** Optional static inputs / args for this step. */
  inputs?: Record<string, unknown>;
}

export interface Schedule {
  /** cron expression or RRULE; interpretation is up to the runtime. */
  cron?: string;
  rrule?: string;
  timezone?: string;
}

// ---------------------------------------------------------------------------
// Channel — where Otto reaches you
// ---------------------------------------------------------------------------

export interface Channel {
  id: Id;
  kind: ChannelKind;
  /** Human label, e.g. "Discord #otto". */
  label: string;
  /** Opaque address (channel id, handle, email, etc.). */
  address: string;
  enabled: boolean;
  /** Outbound on a Channel is an external side effect => gated. */
  requires_approval_to_send: boolean;
}

// ---------------------------------------------------------------------------
// Run — an execution record
// ---------------------------------------------------------------------------

/** A single execution of a Practice (optionally as part of a Routine). */
export interface Run {
  id: Id;
  /** The Practice that ran. */
  practice: Slug;
  /** Set when this Run is part of a Routine execution. */
  routine?: Slug;
  /** The exact invocation used, e.g. "/charter step". */
  invocation: string;
  status: RunStatus;
  inputs: Record<string, unknown>;
  /** Receipts produced by this Run. */
  receipts: Receipt[];
  /** Gate decisions encountered (approve/deny/pending). */
  gate_decisions: GateDecision[];
  /** Channel a result was delivered to, if any. */
  delivered_to?: Channel['id'];
  started_at: ISO8601;
  ended_at: ISO8601 | null;
  /** Human-facing summary of what happened. */
  summary?: string;
}

// ---------------------------------------------------------------------------
// Receipt — proof
// ---------------------------------------------------------------------------

export type ReceiptKind = 'file' | 'link' | 'log' | 'screenshot' | 'commit' | 'message';

/** A proof artifact. Maps to acceptance criteria where applicable (Charter/Review). */
export interface Receipt {
  id: Id;
  kind: ReceiptKind;
  /** Path, URL, or reference to the proof. */
  ref: string;
  /** Acceptance-criterion ids this receipt proves, e.g. ["AC1"]. */
  proves?: string[];
  created_at: ISO8601;
  note?: string;
}

// ---------------------------------------------------------------------------
// Approval & gates — the hard rule
// ---------------------------------------------------------------------------

/**
 * A first-class, scoped, time-bound approval record. Chat approval is not enough;
 * persist it. Only act on an approval that is `approved`, not expired, and within
 * `scope`. Gates outrank Practice logic.
 */
export interface Approval {
  id: Id;
  requested_action: string;
  /** Narrow description of what this approval covers. */
  scope: string;
  requirement: ApprovalRequirement;
  evidence_required?: string;
  requested_at: ISO8601;
  expires_at: ISO8601;
  status: ApprovalStatus;
  decided_by?: string;
  decided_at?: ISO8601;
}

/** The record of a gate firing during a Run. */
export interface GateDecision {
  requirement: ApprovalRequirement;
  approval: Approval['id'] | null;
  status: ApprovalStatus;
  at: ISO8601;
}

// ---------------------------------------------------------------------------
// Charter — the flagship Practice (light references)
// ---------------------------------------------------------------------------

export type CharterStatus = 'draft' | 'active' | 'blocked' | 'complete' | 'cancelled';

export interface AcceptanceCriterion {
  /** Stable id, e.g. "AC1". charter.yaml is the source of truth for these. */
  id: string;
  text: string;
  /** Receipt ids proving this AC. Empty => not done. */
  receipts: Receipt['id'][];
}

/**
 * A pointer to a Charter run on disk. Charter's full runtime is file-based under
 * $CHARTER_HOME/charters/<slug>/ (OUTSIDE memory); this is just the typed handle.
 */
export interface CharterRef {
  slug: Slug;
  status: CharterStatus;
  /** Filesystem root for this charter's runtime. */
  root: string;
  acceptance_criteria: AcceptanceCriterion[];
}

// ---------------------------------------------------------------------------
// Object model (relationships)
// ---------------------------------------------------------------------------
//
//   Intent  -> Charter -> State -> Receipt        (Charter Practice)
//   Practice -> Run     -> Receipt                 (any Practice)
//   Routine  -> [Practice...] -> [Run...]          (bundle)
//   Run      -> Channel                            (delivery)
//   Gate     -> Approval                           (one-way doors)
//
// Invariants (see docs/architecture/v0-contract.md):
//   1. Files = truth, Memory = lessons, UI = workspace.
//   2. approval_required_for ⊇ APPROVAL_FLOOR for every Practice.
//   3. No artifact, no progress: a Run yields a Receipt or a block.
//   4. Done requires every AcceptanceCriterion mapped to a Receipt.
//   5. Gates outrank Practice logic; a fired gate blocks (not fails) until decided.
