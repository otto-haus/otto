import { APPROVAL_FLOOR } from '@otto-do/core';
import type { ApprovalRequirement, PracticeSpec, PracticeStatus } from '@otto-do/core';

export interface PracticeValidationResult {
  errors: string[];
  warnings: string[];
}

const VALID_STATUSES = new Set<PracticeStatus>(['draft', 'active', 'deprecated']);

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

const REQUIRED_NON_EMPTY_ARRAYS = [
  'invocations',
  'triggers',
  'inputs',
  'outputs',
  'state_paths',
  'guardrails',
  'evidence_standard',
  'metrics',
] as const satisfies readonly (keyof PracticeSpec)[];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

export function validatePracticeSpec(
  spec: Partial<PracticeSpec>,
  expectedSlug?: string,
): PracticeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isNonEmptyString(spec.slug)) {
    errors.push('slug must be present and non-empty');
  } else if (expectedSlug !== undefined && spec.slug !== expectedSlug) {
    errors.push(`slug must equal directory name: expected "${expectedSlug}", got "${spec.slug}"`);
  }

  if (!isNonEmptyString(spec.status) || !VALID_STATUSES.has(spec.status as PracticeStatus)) {
    errors.push('status must be one of: draft, active, deprecated');
  }

  for (const field of REQUIRED_NON_EMPTY_ARRAYS) {
    if (!isNonEmptyStringArray(spec[field])) {
      errors.push(`${field} must be a non-empty array of strings`);
    }
  }

  if (!isNonEmptyStringArray(spec.approval_required_for)) {
    errors.push('approval_required_for must be a non-empty array of strings');
  } else {
    for (const requirement of spec.approval_required_for) {
      if (!VALID_APPROVAL_REQUIREMENTS.has(requirement as ApprovalRequirement)) {
        errors.push(`approval_required_for contains unknown requirement "${requirement}"`);
      }
    }

    for (const requirement of APPROVAL_FLOOR) {
      if (!spec.approval_required_for.includes(requirement)) {
        errors.push(`approval_required_for must include approval floor requirement "${requirement}"`);
      }
    }
  }

  if (spec.status === 'active' && spec.implementation === undefined) {
    errors.push('active practices must include implementation');
  }

  if (spec.status === 'draft' && spec.implementation !== undefined) {
    warnings.push('draft practices usually should not include implementation until active');
  }

  return { errors, warnings };
}
