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

export type StandardStatus = 'draft' | 'active' | 'deprecated';

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

/** File-backed Practice loaded from `practices/<slug>/practice.yaml`. */
export interface PracticeRecord extends PracticeSpec {
  file: string;
}

/** Practice identity attached to a Run or Receipt. */
export interface PracticeReference {
  slug: Slug;
  name: string;
  version: SemVer;
  status: PracticeStatus;
  /** Matched invocation, e.g. `/charter step`. */
  invocation: string;
  /** Absolute path to the canonical practice.yaml. */
  ref: string;
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
// Standard — file-backed canon
// ---------------------------------------------------------------------------

export interface StandardRatification {
  owner: string;
  standards_changes_require_human: boolean;
  auto_apply?: boolean;
}

export interface StandardPressure {
  do: string[];
  refuse: string[];
}

/**
 * Machine-readable Standard spec. Mirrors the fenced YAML block at the top of
 * `standards/standards/<slug>.md`; Markdown prose remains the human-readable canon.
 */
export interface StandardSpec {
  name: string;
  slug: Slug;
  version: SemVer;
  status: StandardStatus;
  meaning: string;
  under_pressure: StandardPressure;
  reward: string[];
  failure_modes: string[];
  conflicts_with: Slug[];
  tie_breakers: string[];
  related_practices: Slug[];
  related_curation_rules: string[];
  evidence: string[];
  related_anti_patterns?: Slug[];
  canon_refs?: Slug[];
  ratification: StandardRatification;
}

export interface StandardRef {
  slug: Slug;
  name: string;
  version: SemVer;
  status: StandardStatus;
  file: string;
  meaning: string;
}

export interface StandardConflict {
  between: Slug[];
  tie_breaker: string;
  precedent: string | null;
}

/** Enriched registry conflict for Standards UI (050) — precedent excerpt + tie-breaker. */
export interface StandardConflictResult {
  between: Slug[];
  message: string;
  tie_breaker?: string;
  precedent?: { excerpt?: string; file?: string };
}

export interface StandardsRegistry {
  version: SemVer;
  status: StandardStatus;
  authority_stack: unknown[];
  ratification: StandardRatification;
  standards: StandardRef[];
  conflicts: StandardConflict[];
  anti_patterns: Slug[];
  canon: Array<{ slug: Slug; file: string; role: string }>;
}

export interface StandardRecord extends StandardSpec {
  schema: 'otto.standard.v1';
  /** Absolute or stable path to the Markdown file that owns the Standard. */
  file: string;
  /** Path to the registry that listed this Standard. */
  registry_file: string;
  /** Human-readable Markdown body below the YAML block. */
  markdown: string;
}

/** Runtime proof path: Runs/Receipts cite Standards by slug plus file reference. */
export interface StandardCitation {
  slug: Slug;
  name: string;
  ref: string;
  reason: string;
  evidence?: string[];
}

// ---------------------------------------------------------------------------
// Run — an execution record
// ---------------------------------------------------------------------------

/** A single execution of a Practice (optionally as part of a Routine). */
export interface Run {
  id: Id;
  /** The Practice that ran. */
  practice: Slug;
  /** Optional operating contract this run is executing against. */
  charter?: Slug;
  /** Set when this Run is part of a Routine execution. */
  routine?: Slug;
  /** The exact invocation used, e.g. "/charter step". */
  invocation: string;
  status: RunStatus;
  inputs: Record<string, unknown>;
  /** Receipts produced by this Run. */
  receipts: Receipt[];
  /** Standards this Run claims to uphold or is accountable to. */
  standards?: StandardCitation[];
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

export type ReceiptStatus = 'success' | 'blocked' | 'failed';

export type ReceiptSubjectType =
  | 'chat'
  | 'run'
  | 'practice'
  | 'routine'
  | 'charter'
  | 'standard'
  | 'proposal'
  | 'check'
  | 'autonomy'
  | 'task'
  | 'worker'
  | 'constitution'
  | 'knowledge';

export type ReceiptEvidenceKind = 'file' | 'link' | 'log' | 'screenshot' | 'commit' | 'message' | 'status';

/** A proof artifact or status snapshot. Maps to acceptance criteria where applicable. */
export interface ReceiptEvidence {
  kind: ReceiptEvidenceKind;
  /** Path, URL, message id, status key, or other stable reference. */
  ref: string;
  /** Acceptance-criterion ids this evidence proves, e.g. ["AC1"]. */
  proves?: string[];
  note?: string;
  data?: unknown;
}

export interface ReceiptBlocker {
  code: string;
  message: string;
  recoverable: boolean;
  next_action?: string;
}

export interface ReceiptResult {
  summary: string;
  data?: Record<string, unknown>;
}

/** Durable proof record for a completed, blocked, or failed action/run. */
export interface Receipt {
  schema: 'otto.receipt.v1';
  id: Id;
  timestamp: ISO8601;
  status: ReceiptStatus;
  subject: {
    type: ReceiptSubjectType;
    id?: Id | null;
  };
  action: string;
  input: Record<string, unknown>;
  result: ReceiptResult;
  evidence: ReceiptEvidence[];
  /** File-backed Standards cited by this proof record. */
  standards?: StandardCitation[];
  /** Practice invoked for this action/run, when detectable from canon. */
  practice?: PracticeReference | null;
  /** Routine invoked for manual/scheduled runs. */
  routine?: RoutineReference | null;
  blocker: ReceiptBlocker | null;
}

/** Routine identity attached to a Run or Receipt. */
export interface RoutineReference {
  id: Id;
  slug: Slug;
  name: string;
  /** `manual` for explicit operator runs; `scheduled` reserved for future activation. */
  mode: 'manual' | 'scheduled';
  /** Absolute path to routine.yaml. */
  ref: string;
}

/** File-backed Routine loaded from `routines/<slug>/routine.yaml`. */
export interface RoutineRecord extends Routine {
  file: string;
}

// ---------------------------------------------------------------------------
// Curation — proposals & classification (no silent canon mutation)
// ---------------------------------------------------------------------------

export type ProposalSource =
  | 'user_correction'
  | 'receipt_failure'
  | 'intake'
  | 'run_review'
  | 'paperclip_event'
  | 'manual';

export type ProposalKind =
  | 'standard'
  | 'practice'
  | 'routine'
  | 'approval'
  | 'memory_writeback'
  | 'task'
  | 'receipt_requirement'
  | 'knowledge';

export type ProposalStatus =
  | 'proposed'
  | 'needs_approval'
  | 'deferred'
  | 'accepted'
  | 'rejected'
  | 'blocked'
  | 'applied';

export type ProposalCanonImpact = 'none' | 'memory' | 'standard' | 'practice' | 'routine' | 'knowledge';

export type ProposalReversibility = 'reversible' | 'hard_to_reverse' | 'irreversible';

export type ProposalScope = 'internal' | 'external' | 'public' | 'customer' | 'security' | 'spend' | 'legal';

export type ProposalRisk = 'low' | 'medium' | 'high';

export type ProposalRequiredGate = 'none' | 'human_ratification' | 'explicit_approval';

export type ProposalRoute = 'auto_apply' | 'ask' | 'block' | 'reject';

export interface ProposalEvidenceRef {
  kind: 'receipt' | 'run' | 'file' | 'message' | 'url' | 'other';
  ref: string;
  note?: string;
}

export interface ProposalTarget {
  kind: ProposalCanonImpact;
  /** Slug or id of the canon object this would touch if ratified. */
  id?: string;
  path?: string;
  action?: 'create' | 'update' | 'deprecate' | 'activate' | 'pause';
}

/** Consequence classification — routing decision for a Proposal. */
export interface ProposalClassification {
  reversibility: ProposalReversibility;
  scope: ProposalScope;
  canon_impact: ProposalCanonImpact;
  risk: ProposalRisk;
  required_gate: ProposalRequiredGate;
  route: ProposalRoute;
  reason: string;
}

/** A proposed durable change. Proposals never apply themselves. */
export interface CurationProposal {
  schema: 'otto.proposal.v1';
  id: Id;
  source: ProposalSource;
  kind: ProposalKind;
  summary: string;
  rationale: string;
  evidence: ProposalEvidenceRef[];
  target: ProposalTarget;
  classification: ProposalClassification;
  status: ProposalStatus;
  created_at: ISO8601;
  updated_at: ISO8601;
  created_by: 'user' | 'otto' | 'adapter';
  receipt_id?: Id;
  /** Receipt written when a human accepts/rejects/defers the proposal. */
  decision_receipt_id?: Id;
  applied_at?: ISO8601;
  decision_note?: string;
}

/** Proposal loaded from ~/.otto/curation/proposals/. */
export interface CurationProposalRecord extends CurationProposal {
  path: string;
}

export interface CreateProposalFromCorrectionInput {
  correction: string;
  rationale?: string;
  target: ProposalTarget;
  evidence?: ProposalEvidenceRef[];
  sourceReceiptId?: string;
  created_by?: CurationProposal['created_by'];
}

export type ProposalDecisionKind = 'accept' | 'reject' | 'defer';

export interface DecideProposalInput {
  decision: ProposalDecisionKind;
  note?: string;
  decided_by?: 'user' | 'otto';
}

// ---------------------------------------------------------------------------
// Autonomy — visible policy & action classification
// ---------------------------------------------------------------------------

export type AutonomyZoneId = 'green' | 'yellow' | 'red';

export interface AutonomyZone {
  id: AutonomyZoneId;
  label: string;
  requires_approval: boolean;
  prompt_kind?: 'none' | 'confirm_once' | 'explicit_approval';
  summary: string;
  examples: string[];
}

export interface AutonomyDoor {
  id: string;
  label: string;
  zone: AutonomyZoneId;
  requirement: ApprovalRequirement;
}

export interface AutonomyPolicySettings {
  worker_creation: 'allowed' | 'disabled';
  worktree_creation: 'allowed' | 'disabled';
  pr_creation: 'allowed' | 'disabled';
  safe_auto_merge: 'allowed' | 'disabled';
  require_receipts: boolean;
  max_parallel_workers: number;
}

/** File-backed autonomy policy loaded from `autonomy/policy.yaml`. */
export interface AutonomyPolicy {
  schema: 'otto.autonomy.policy.v1';
  version: SemVer;
  file: string;
  summary: string;
  doctrine: string;
  zones: AutonomyZone[];
  doors: AutonomyDoor[];
  settings: AutonomyPolicySettings;
  /** Honest scope limits — what this policy does NOT claim to automate. */
  limitations: string[];
}

export interface AutonomyPolicyResult {
  dir: string;
  policyPath: string;
  policy: AutonomyPolicy;
  storage: 'files' | 'default';
}

export interface EvaluateAutonomyActionInput {
  action: string;
  context?: string;
  /** Explicit human approval for one-way door checks (045 permission modal). */
  approved?: boolean;
  /** Session-scoped allow from permission modal (045). */
  session_allowed?: boolean;
}

export interface AutonomyActionEvaluation {
  action: string;
  zone: AutonomyZoneId;
  door_id: string | null;
  requires_approval: boolean;
  allowed_without_approval: boolean;
  reason: string;
  policy_path: string;
  /** Proposed or active model routing from Knowledge (does not override policy alone). */
  knowledge_routing?: KnowledgeRoutingHint | null;
}

export interface KnowledgeRoutingHint {
  role: string;
  provider: string;
  model: string;
  status: 'proposed' | 'active';
  registry_path: string;
}

export interface KnowledgeModelEntry {
  provider: string;
  model: string;
  handle_note?: string;
  cost_tier?: string;
  default_roles: string[];
  verified: boolean;
  last_verified?: string;
}

export interface KnowledgeRegistrySummary {
  schema: 'otto.knowledge.registry.v1';
  version: string;
  status: 'proposed' | 'active';
  last_reviewed?: string;
  next_review_due?: string;
  roles: string[];
  models: KnowledgeModelEntry[];
  routing: {
    status: 'proposed' | 'active';
    assignments: Record<string, string>;
  };
  provider_allowlist: {
    status: 'proposed' | 'active';
    providers: string[];
  };
  file: string;
}

export interface KnowledgeListResult {
  dir: string;
  registryPath: string;
  registry: KnowledgeRegistrySummary | null;
  capabilityNotesPath: string | null;
  providerCostsPath: string | null;
  observedPerformanceDir: string | null;
  storage: 'files';
}

export interface SkillRecord {
  slug: string;
  name: string;
  description: string;
  file: string;
  triggers: string[];
}

export interface SkillListResult {
  dir: string;
  skills: SkillRecord[];
  skipped: Array<{ slug: string; file: string; reason: string }>;
  storage: 'files';
}

export interface ChannelRecord extends Channel {
  file: string;
}

export interface ChannelSkip {
  index: number;
  reason: string;
  file: string;
}

export interface ChannelListResult {
  dir: string;
  configPath: string;
  channels: ChannelRecord[];
  skipped: ChannelSkip[];
  storage: 'files' | 'default';
}

export type TicketStatus = 'proposed' | 'active' | 'blocked' | 'review' | 'merged' | 'cancelled';

export interface TicketRecord {
  schema: 'otto.ticket.v1';
  ticket_id: string;
  status: TicketStatus;
  charter?: string;
  owner?: string;
  model?: string;
  worktree?: string;
  branch?: string;
  objective: string;
  why?: string;
  owned_paths: string[];
  shared_paths: string[];
  non_goals: string[];
  acceptance_criteria: Array<{ id: string; text: string; proof?: string }>;
  checks: string[];
  stop_conditions: string[];
  requires_approval_for: string[];
  receipt_path?: string;
  integration_notes?: string;
  root: string;
  ticketPath: string;
  packetPath?: string;
  updated_at: ISO8601;
}

export interface TicketCompileInput {
  slug: string;
  objective: string;
  why?: string;
  charter?: string;
  owned_paths?: string[];
  shared_paths?: string[];
  acceptance_criteria?: Array<{ id: string; text: string; proof?: string }>;
  checks?: string[];
}

export interface TicketListResult {
  dir: string;
  tickets: TicketRecord[];
  skipped: number;
  storage: 'files';
}

export type WorkerStatus = 'draft' | 'running' | 'blocked' | 'review' | 'done' | 'failed';

export interface WorkerRecord {
  schema: 'otto.worker.v1';
  id: string;
  ticket_id: string;
  status: WorkerStatus;
  model?: string;
  worktree?: string;
  branch?: string;
  started_at: ISO8601;
  updated_at: ISO8601;
  receipt_ids: string[];
  summary?: string;
  path: string;
}

export interface WorkerListResult {
  dir: string;
  workers: WorkerRecord[];
  skipped: number;
  storage: 'files';
}

export interface RunSummary {
  id: string;
  practice: string;
  charter?: string;
  routine?: string;
  status: RunStatus;
  started_at: ISO8601;
  ended_at: ISO8601 | null;
  summary?: string;
  receipt_count: number;
  path: string;
}

export interface RunListResult {
  dir: string;
  runs: RunSummary[];
  skipped: number;
  storage: 'files';
}

/** Legacy approval ledger name; records include approved, denied, and deferred Curation decisions. */
export interface ApprovalRecord {
  id: string;
  proposal_id: string;
  requirement: ApprovalRequirement;
  status: 'approved' | 'denied' | 'deferred';
  scope: string;
  decided_at: ISO8601;
  receipt_id: string;
  receipt_path: string;
}

export interface ApprovalListResult {
  dir: string;
  approvals: ApprovalRecord[];
  storage: 'files';
}

// ---------------------------------------------------------------------------
// Culture — constitution, changelog, export (121–122, 125)
// ---------------------------------------------------------------------------

export interface ConstitutionWritebackPolicy {
  mode: 'proposal_only';
  requires_curation_accept: boolean;
  silent_apply_forbidden: boolean;
}

export interface ConstitutionDocument {
  schema: 'otto.constitution.v1';
  version: string;
  values: string[];
  forbidden_actions: string[];
  approval_rules: string[];
  standards_refs: string[];
  writeback_policy: ConstitutionWritebackPolicy;
  ratification_requirements: string[];
  amended_at?: ISO8601;
  amended_by?: string;
}

export interface ConstitutionResult {
  dir: string;
  yamlPath: string;
  mdPath: string;
  document: ConstitutionDocument;
  rawYaml: string;
  storage: 'files';
}

export interface ConstitutionAmendResult {
  document: ConstitutionDocument;
  receipt: Receipt & { path: string };
}

export type BehaviorChangelogSource =
  | 'proposal_ratified'
  | 'constitution_amend'
  | 'autonomy_policy';

export interface BehaviorChangelogEntry {
  id: string;
  timestamp: ISO8601;
  what: string;
  why: string;
  authority: string;
  receipt_id: string;
  source: BehaviorChangelogSource;
}

export interface BehaviorChangelogResult {
  dir: string;
  entries: BehaviorChangelogEntry[];
  window_days: number;
  empty_message: string;
}

export interface CultureExportManifest {
  schema: 'otto.culture-export.v1';
  exported_at: ISO8601;
  workspace: string;
  includes: string[];
  excludes: string[];
  receipt_index_count: number;
  constitution_hash: string | null;
}

export interface CultureExportResult {
  bundlePath: string;
  manifest: CultureExportManifest;
  receipt: Receipt & { path: string };
}

export interface CultureImportPreview {
  valid: boolean;
  manifest: CultureExportManifest | null;
  diff: Array<{ path: string; action: 'add' | 'update'; note: string }>;
  blocked_reason?: string;
}

export interface DiagnosticsExportManifest {
  schema: 'otto.diagnostics-export.v1';
  exported_at: ISO8601;
  workspace: string;
  includes: string[];
  redacted: string[];
}

export interface DiagnosticsExportResult {
  bundlePath: string;
  manifest: DiagnosticsExportManifest;
  receipt: Receipt & { path: string };
}

// ---------------------------------------------------------------------------
// Cognee — local knowledge graph stubs (041–044)
// ---------------------------------------------------------------------------

export type CogneeHealthStatus = 'disabled' | 'ready' | 'stopped' | 'error';

export interface CogneeHealth {
  status: CogneeHealthStatus;
  baseUrl: string | null;
  lastError: string | null;
  lastCheckedAt: ISO8601 | null;
}

export interface CogneeCaptureReceipt {
  id: string;
  at: ISO8601;
  paths?: string[];
  count?: number;
  mode?: 'dry-run' | 'apply';
  [key: string]: unknown;
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

export type CharterStatus = 'proposed' | 'draft' | 'active' | 'blocked' | 'complete' | 'cancelled';

export interface AcceptanceCriterion {
  /** Stable id, e.g. "AC1". charter.yaml is the source of truth for these. */
  id: string;
  text: string;
  /** Receipt ids proving this AC. Empty => not done. */
  receipts: Receipt['id'][];
}

export type CharterChangeKind = 'created' | 'status-changed' | 'references-linked' | 'updated';

export interface CharterChange {
  id: Id;
  at: ISO8601;
  kind: CharterChangeKind;
  summary: string;
  from_status?: CharterStatus;
  to_status?: CharterStatus;
  run_ids?: Run['id'][];
  receipt_ids?: Receipt['id'][];
  approval_id?: Approval['id'] | null;
  receipt_id: Receipt['id'];
}

/** File-backed operating contract for a goal/run. */
export interface Charter {
  schema: 'otto.charter.v1';
  id: Id;
  slug: Slug;
  title: string;
  objective: string;
  status: CharterStatus;
  created_at: ISO8601;
  updated_at: ISO8601;
  acceptance_criteria: AcceptanceCriterion[];
  run_ids: Run['id'][];
  receipt_ids: Receipt['id'][];
  change_receipt_ids: Receipt['id'][];
  /** Charter mutation is explicit and auditable; risky activation still gates through approvals. */
  approval_required_for_changes: ApprovalRequirement[];
  changes: CharterChange[];
}

/**
 * A pointer to a Charter run on disk. Charter's full runtime is file-based under
 * $CHARTER_HOME/charters/<slug>/ (OUTSIDE memory); this is just the typed handle.
 */
export interface CharterRef {
  id: Id;
  slug: Slug;
  status: CharterStatus;
  /** Filesystem root for this charter's runtime. */
  root: string;
  acceptance_criteria: AcceptanceCriterion[];
  run_ids: Run['id'][];
  receipt_ids: Receipt['id'][];
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
