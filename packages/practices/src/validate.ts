import { APPROVAL_FLOOR } from '@otto-haus/core';
import type { ApprovalRequirement, PracticeSpec, PracticeStatus } from '@otto-haus/core';
import { practiceSpecSchema } from './schema.js';

export interface PracticeValidationResult {
  errors: string[];
  warnings: string[];
}

const VALID_APPROVAL_REQUIREMENTS = new Set<ApprovalRequirement>([
  'enabling-globally',
  'external-side-effects',
  'permission-expansion',
  'send-or-publish',
  'spend',
  'deploy',
  'delete-or-destroy',
  'credential-or-security-change',
]);

const FIELD_ERROR_MESSAGES: Partial<Record<string, string>> = {
  name: 'name must be present and non-empty',
  slug: 'slug must be present and non-empty',
  version: 'version must be present and non-empty',
  status: 'status must be one of: draft, active, deprecated',
  summary: 'summary must be present and non-empty',
  owner: 'owner must be present and non-empty',
  invocations: 'invocations must be a non-empty array of strings',
  triggers: 'triggers must be a non-empty array of strings',
  inputs: 'inputs must be a non-empty array of strings',
  outputs: 'outputs must be a non-empty array of strings',
  state_paths: 'state_paths must be a non-empty array of strings',
  guardrails: 'guardrails must be a non-empty array of strings',
  evidence_standard: 'evidence_standard must be a non-empty array of strings',
  metrics: 'metrics must be a non-empty array of strings',
  approval_required_for: 'approval_required_for must be a non-empty array of strings',
};

function messageForIssue(path: PropertyKey[], code: string): string | null {
  const field = String(path[0] ?? '');
  if (FIELD_ERROR_MESSAGES[field]) {
    return FIELD_ERROR_MESSAGES[field]!;
  }
  if (field === 'status' && code === 'invalid_value') {
    return 'status must be one of: draft, active, deprecated';
  }
  return null;
}

function zodErrorsToMessages(issues: { path: PropertyKey[]; code: string; message: string }[]): string[] {
  const errors: string[] = [];
  for (const issue of issues) {
    const mapped = messageForIssue(issue.path, issue.code);
    if (mapped && !errors.includes(mapped)) {
      errors.push(mapped);
    }
  }
  return errors;
}

export function validatePracticeSpec(
  spec: Partial<PracticeSpec>,
  expectedSlug?: string,
): PracticeValidationResult {
  const parsed = practiceSpecSchema.safeParse(spec);
  const errors = parsed.success ? [] : zodErrorsToMessages(parsed.error.issues);
  const warnings: string[] = [];

  if (!parsed.success) {
    return { errors, warnings };
  }

  const validated = parsed.data;

  if (expectedSlug !== undefined && validated.slug !== expectedSlug) {
    errors.push(`slug must equal directory name: expected "${expectedSlug}", got "${validated.slug}"`);
  }

  for (const requirement of validated.approval_required_for) {
    if (!VALID_APPROVAL_REQUIREMENTS.has(requirement as ApprovalRequirement)) {
      errors.push(`approval_required_for contains unknown requirement "${requirement}"`);
    }
  }

  for (const requirement of APPROVAL_FLOOR) {
    if (!validated.approval_required_for.includes(requirement)) {
      errors.push(`approval_required_for must include approval floor requirement "${requirement}"`);
    }
  }

  if (validated.status === 'active' && validated.implementation === undefined) {
    errors.push('active practices must include implementation');
  }

  if (validated.status === 'draft' && validated.implementation !== undefined) {
    warnings.push('draft practices usually should not include implementation until active');
  }

  return { errors, warnings };
}
