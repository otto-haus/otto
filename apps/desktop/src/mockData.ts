import type { Approval, Run } from '@otto-do/core';

export const mockRuns: Run[] = [
  {
    id: 'run-charter-001',
    practice: 'charter',
    invocation: '/charter step',
    status: 'success',
    inputs: { intent: 'scaffold desktop workspace' },
    receipts: [
      {
        id: 'receipt-charter-001',
        kind: 'file',
        ref: 'apps/desktop/src/App.tsx',
        proves: ['AC1'],
        created_at: '2026-06-13T17:12:00Z',
        note: 'Workspace shell created as a repo-backed view.',
      },
    ],
    gate_decisions: [],
    started_at: '2026-06-13T17:05:00Z',
    ended_at: '2026-06-13T17:12:00Z',
    summary: 'Generated the first Desktop shell from Practice specs.',
  },
  {
    id: 'run-follow-up-001',
    practice: 'follow-up',
    invocation: '/follow-up draft',
    status: 'blocked',
    inputs: { recipient: 'operator', source: 'field note' },
    receipts: [],
    gate_decisions: [
      {
        requirement: 'send-or-publish',
        approval: 'approval-follow-up-001',
        status: 'pending',
        at: '2026-06-13T17:18:00Z',
      },
    ],
    started_at: '2026-06-13T17:16:00Z',
    ended_at: null,
    summary: 'Draft is staged; outbound send is blocked until approval.',
  },
  {
    id: 'run-review-001',
    practice: 'review',
    invocation: '/review done',
    status: 'running',
    inputs: { claim: 'Practice data generated from YAML' },
    receipts: [],
    gate_decisions: [],
    started_at: '2026-06-13T17:20:00Z',
    ended_at: null,
    summary: 'Checking claims against receipts before marking done.',
  },
];

export const mockApprovals: Approval[] = [
  {
    id: 'approval-follow-up-001',
    requested_action: 'Send drafted follow-up through an external Channel',
    scope: 'follow-up:operator:single-message',
    requirement: 'send-or-publish',
    evidence_required: 'Draft, recipient, source context, and risk notes are visible.',
    requested_at: '2026-06-13T17:18:00Z',
    expires_at: '2026-06-14T17:18:00Z',
    status: 'pending',
  },
  {
    id: 'approval-routine-001',
    requested_action: 'Enable a weekly Review Routine',
    scope: 'routine:weekly-review:activation',
    requirement: 'enabling-globally',
    evidence_required: 'Attention cost and included Practices are listed.',
    requested_at: '2026-06-13T17:22:00Z',
    expires_at: '2026-06-20T17:22:00Z',
    status: 'pending',
  },
];
