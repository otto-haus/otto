export { loadPracticeSpec, normalizeApprovalRequirement } from './load.js';
export { validatePracticeSpec } from './validate.js';
export type { PracticeValidationResult } from './validate.js';

/** Practices wired for desktop Run + Receipt (053). */
export const RUNTIME_PRACTICE_SLUGS = ['charter', 'review', 'field-note'] as const;
export type RuntimePracticeSlug = (typeof RUNTIME_PRACTICE_SLUGS)[number];
