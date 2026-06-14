import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type {
  ApprovalRequirement,
  AutonomyActionEvaluation,
  AutonomyDoor,
  AutonomyPolicy,
  AutonomyPolicyResult,
  AutonomyPolicySettings,
  AutonomyZone,
  AutonomyZoneId,
  EvaluateAutonomyActionInput,
} from '@otto-haus/core';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import { KnowledgeStore } from './knowledge-store';

export interface EvaluateAutonomyActionResult {
  evaluation: AutonomyActionEvaluation;
  receipt: WrittenReceipt;
}

const DEFAULT_POLICY: Omit<AutonomyPolicy, 'file'> = {
  schema: 'otto.autonomy.policy.v1',
  version: '0.1',
  summary: 'Built-in conservative policy (autonomy/policy.yaml missing).',
  doctrine: 'Own reversible work. Gate consequential work.',
  zones: [
    {
      id: 'green',
      label: 'Reversible local work',
      requires_approval: false,
      prompt_kind: 'none',
      summary: 'Internal reversible work may proceed without approval.',
      examples: ['run tests', 'update receipts', 'draft docs'],
    },
    {
      id: 'yellow',
      label: 'Prompt once',
      requires_approval: true,
      prompt_kind: 'confirm_once',
      summary: 'Limited blast-radius operations require a one-time prompt.',
      examples: ['install dependencies', 'run migrations locally'],
    },
    {
      id: 'red',
      label: 'One-way doors',
      requires_approval: true,
      prompt_kind: 'explicit_approval',
      summary: 'Consequential actions require explicit approval.',
      examples: ['send email', 'deploy', 'merge main'],
    },
  ],
  doors: [
    { id: 'send', label: 'Send / post / publish', zone: 'red', requirement: 'send-or-publish' },
    { id: 'spend', label: 'Spend / charge / transfer', zone: 'red', requirement: 'spend' },
    { id: 'deploy', label: 'Deploy / publish live', zone: 'red', requirement: 'deploy' },
    { id: 'merge', label: 'Merge protected main / force-push', zone: 'red', requirement: 'external-side-effects' },
    { id: 'delete', label: 'Delete / destroy', zone: 'red', requirement: 'delete-or-destroy' },
    { id: 'security', label: 'Credential / security change', zone: 'red', requirement: 'credential-or-security-change' },
    { id: 'permission', label: 'Permission expansion', zone: 'red', requirement: 'permission-expansion' },
    { id: 'recurring', label: 'Recurring routine activation', zone: 'red', requirement: 'enabling-globally' },
  ],
  settings: {
    worker_creation: 'allowed',
    worktree_creation: 'allowed',
    pr_creation: 'allowed',
    safe_auto_merge: 'disabled',
    require_receipts: true,
    max_parallel_workers: 3,
  },
  limitations: ['Default policy only — autonomy/policy.yaml not found.'],
};

const DOOR_MATCHERS: Array<{ doorId: string; pattern: RegExp }> = [
  { doorId: 'send', pattern: /\b(send|post|publish|email|slack|discord|tweet|broadcast)\b/i },
  { doorId: 'spend', pattern: /\b(spend|charge|payment|wire|transfer funds|purchase)\b/i },
  { doorId: 'deploy', pattern: /\b(deploy|production|release live|ship to prod)\b/i },
  { doorId: 'merge', pattern: /\b(merge|force[- ]?push|push --force|protected main)\b/i },
  { doorId: 'delete', pattern: /\b(delete|destroy|drop table|rm -rf|truncate)\b/i },
  { doorId: 'security', pattern: /\b(credential|secret|api key|password|\.env|security change)\b/i },
  { doorId: 'permission', pattern: /\b(permission|allowlist|autonomy expansion|enable globally)\b/i },
  { doorId: 'recurring', pattern: /\b(recurring|schedule routine|activate routine|cron)\b/i },
];

const YELLOW_MATCHERS = [
  /\b(install|npm install|bun install|migration|migrate|fetch|download)\b/i,
  /\b(rebase|npm publish locally)\b/i,
];

const GREEN_MATCHERS = [
  /\b(test|typecheck|lint|receipt|worktree|draft|open pr|retry check)\b/i,
];

export class AutonomyStore {
  constructor(
    private dir = resolveAutonomyDir(),
    private receipts = new ReceiptWriter(),
    private knowledge = new KnowledgeStore(),
  ) {}

  loadResult(): AutonomyPolicyResult {
    const policyPath = join(this.dir, 'policy.yaml');
    if (!existsSync(policyPath)) {
      return {
        dir: this.dir,
        policyPath,
        policy: { ...DEFAULT_POLICY, file: policyPath },
        storage: 'default',
      };
    }

    const raw = parse(readFileSync(policyPath, 'utf8')) as Record<string, unknown>;
    return {
      dir: this.dir,
      policyPath,
      policy: normalizePolicy(raw, policyPath),
      storage: 'files',
    };
  }

  getPolicy(): AutonomyPolicy {
    return this.loadResult().policy;
  }

  evaluateAction(input: EvaluateAutonomyActionInput): EvaluateAutonomyActionResult {
    const loaded = this.loadResult();
    const evaluation = withKnowledgeRouting(
      classifyAction(input.action, loaded.policy, loaded.policyPath),
      input.context,
      this.knowledge,
    );
    const receipt = this.receipts.write({
      status: evaluation.requires_approval ? 'blocked' : 'success',
      subject: { type: 'autonomy', id: evaluation.door_id ?? evaluation.zone },
      action: 'autonomy.action.evaluate',
      input: {
        action: input.action,
        context: input.context ?? null,
        policy_path: loaded.policyPath,
        policy_storage: loaded.storage,
      },
      result: {
        summary: evaluation.requires_approval
          ? `Approval required (${evaluation.zone}): ${evaluation.reason}`
          : `Autonomous (${evaluation.zone}): ${evaluation.reason}`,
        data: {
          zone: evaluation.zone,
          door_id: evaluation.door_id,
          requires_approval: evaluation.requires_approval,
          allowed_without_approval: evaluation.allowed_without_approval,
          knowledge_routing: evaluation.knowledge_routing ?? null,
        },
      },
      evidence: [
        {
          kind: 'file',
          ref: loaded.policyPath,
          note: 'Autonomy policy source used for classification.',
        },
      ],
      blocker: evaluation.requires_approval
        ? {
            code: 'approval_required',
            message: evaluation.reason,
            recoverable: true,
            next_action: 'Request explicit approval before executing this action.',
          }
        : null,
    });

    return { evaluation, receipt };
  }
}

function withKnowledgeRouting(
  evaluation: AutonomyActionEvaluation,
  context: string | undefined,
  knowledge: KnowledgeStore,
): AutonomyActionEvaluation {
  const role = inferKnowledgeRole(evaluation.action, context);
  const resolved = knowledge.resolveModelForRole(role);
  const registryPath = knowledge.listResult().registryPath;
  if (!resolved) return evaluation;
  return {
    ...evaluation,
    knowledge_routing: {
      role,
      provider: resolved.provider,
      model: resolved.model,
      status: resolved.status,
      registry_path: registryPath,
    },
  };
}

function inferKnowledgeRole(action: string, context?: string): string {
  const haystack = `${action} ${context ?? ''}`.toLowerCase();
  if (/standard|review|fake done|quality/.test(haystack)) return 'standards_review';
  if (/curat|proposal|ratif/.test(haystack)) return 'curation_decisions';
  if (/autonomy|policy|door/.test(haystack)) return 'autonomy_policy';
  if (/doc|spec|write|readme/.test(haystack)) return 'docs_worker';
  if (/code|implement|refactor|typescript|test/.test(haystack)) return 'code_worker';
  if (/orchestr|ticket|worker|worktree/.test(haystack)) return 'ticket_worker';
  return 'main_otto';
}

export function classifyAction(action: string, policy: AutonomyPolicy, policyPath: string): AutonomyActionEvaluation {
  const text = action.trim();
  const lower = text.toLowerCase();

  for (const matcher of DOOR_MATCHERS) {
    if (!matcher.pattern.test(lower)) continue;
    const door = policy.doors.find((entry) => entry.id === matcher.doorId);
    if (!door) continue;
    const zone = policy.zones.find((entry) => entry.id === door.zone) ?? zoneForId(door.zone, policy);
    return {
      action: text,
      zone: door.zone,
      door_id: door.id,
      requires_approval: true,
      allowed_without_approval: false,
      reason: `${door.label} is a consequential door (${door.requirement}).`,
      policy_path: policyPath,
    };
  }

  if (YELLOW_MATCHERS.some((pattern) => pattern.test(lower))) {
    return {
      action: text,
      zone: 'yellow',
      door_id: null,
      requires_approval: true,
      allowed_without_approval: false,
      reason: zoneForId('yellow', policy).summary,
      policy_path: policyPath,
    };
  }

  if (GREEN_MATCHERS.some((pattern) => pattern.test(lower))) {
    return {
      action: text,
      zone: 'green',
      door_id: null,
      requires_approval: false,
      allowed_without_approval: true,
      reason: zoneForId('green', policy).summary,
      policy_path: policyPath,
    };
  }

  return {
    action: text,
    zone: 'yellow',
    door_id: null,
    requires_approval: true,
    allowed_without_approval: false,
    reason: 'Unclassified actions default to prompt-once until policy maps them explicitly.',
    policy_path: policyPath,
  };
}

function zoneForId(id: AutonomyZoneId, policy: AutonomyPolicy): AutonomyZone {
  return policy.zones.find((zone) => zone.id === id) ?? DEFAULT_POLICY.zones.find((zone) => zone.id === id)!;
}

function normalizePolicy(raw: Record<string, unknown>, file: string): AutonomyPolicy {
  const zonesRaw = (raw.zones ?? {}) as Record<string, Record<string, unknown>>;
  const zones: AutonomyZone[] = (['green', 'yellow', 'red'] as AutonomyZoneId[]).map((id) => {
    const entry = zonesRaw[id] ?? {};
    return {
      id,
      label: String(entry.label ?? id),
      requires_approval: entry.requires_approval !== false && id !== 'green',
      prompt_kind:
        id === 'green'
          ? 'none'
          : ((entry.prompt_kind as AutonomyZone['prompt_kind']) ??
            (id === 'yellow' ? 'confirm_once' : 'explicit_approval')),
      summary: String(entry.summary ?? ''),
      examples: Array.isArray(entry.examples) ? entry.examples.map(String) : [],
    };
  });

  const doors: AutonomyDoor[] = Array.isArray(raw.doors)
    ? raw.doors.map((entry) => {
        const door = entry as Record<string, unknown>;
        return {
          id: String(door.id),
          label: String(door.label ?? door.id),
          zone: (door.zone as AutonomyZoneId) ?? 'red',
          requirement: (door.requirement as ApprovalRequirement) ?? 'external-side-effects',
        };
      })
    : DEFAULT_POLICY.doors;

  const settingsRaw = (raw.settings ?? {}) as Record<string, unknown>;
  const settings: AutonomyPolicySettings = {
    worker_creation: settingsRaw.worker_creation === 'disabled' ? 'disabled' : 'allowed',
    worktree_creation: settingsRaw.worktree_creation === 'disabled' ? 'disabled' : 'allowed',
    pr_creation: settingsRaw.pr_creation === 'disabled' ? 'disabled' : 'allowed',
    safe_auto_merge: settingsRaw.safe_auto_merge === 'allowed' ? 'allowed' : 'disabled',
    require_receipts: settingsRaw.require_receipts !== false,
    max_parallel_workers: Number(settingsRaw.max_parallel_workers ?? 3),
  };

  return {
    schema: 'otto.autonomy.policy.v1',
    version: String(raw.version ?? '0.1'),
    file,
    summary: String(raw.summary ?? 'Autonomy policy'),
    doctrine: String(raw.doctrine ?? '').trim(),
    zones,
    doors,
    settings,
    limitations: Array.isArray(raw.limitations) ? raw.limitations.map(String) : [],
  };
}

export function resolveAutonomyDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.OTTO_AUTONOMY_DIR,
    process.env.OTTO_ROOT ? join(process.env.OTTO_ROOT, 'autonomy') : null,
    resolve(process.cwd(), 'autonomy'),
    resolve(process.cwd(), '../../autonomy'),
    resourcesPath ? join(resourcesPath, 'autonomy') : null,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'policy.yaml'))) return candidate;
  }

  return candidates[0] ?? resolve(process.cwd(), 'autonomy');
}
