import { z } from 'zod';

const practiceStatusSchema = z.enum(['draft', 'active', 'deprecated']);

const approvalRequirementSchema = z.enum([
  'enabling-globally',
  'external-side-effects',
  'permission-expansion',
  'send-or-publish',
  'spend',
  'deploy',
  'delete-or-destroy',
  'credential-or-security-change',
]);

const practiceImplementationSchema = z.object({
  extension: z.string().optional(),
  skill: z.string().optional(),
  templates: z.string().optional(),
});

const nonEmptyString = z.string().trim().min(1);

const nonEmptyStringArray = z.array(nonEmptyString).min(1);

export const practiceSpecSchema = z.object({
  name: nonEmptyString,
  slug: nonEmptyString,
  version: nonEmptyString,
  status: practiceStatusSchema,
  summary: nonEmptyString,
  implementation: practiceImplementationSchema.optional(),
  invocations: nonEmptyStringArray,
  triggers: nonEmptyStringArray,
  inputs: nonEmptyStringArray,
  outputs: nonEmptyStringArray,
  state_paths: nonEmptyStringArray,
  guardrails: nonEmptyStringArray,
  evidence_standard: nonEmptyStringArray,
  metrics: nonEmptyStringArray,
  owner: nonEmptyString,
  approval_required_for: z.array(z.union([approvalRequirementSchema, z.string()])).min(1),
});

export type PracticeSpecInput = z.input<typeof practiceSpecSchema>;
