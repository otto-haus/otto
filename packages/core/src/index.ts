/**
 * @otto-haus/core — the v0 shared contract.
 * Re-exports the core primitives every lane depends on.
 */
export * from './types.js';
export * from './check.js';
export * from './github-issue-workflow.js';

// CI gate break probe (#129) — revert in next commit
export const __ciGateBreakProbe: number = 'break';
