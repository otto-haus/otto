/**
 * GitHub issue/project workflow packet validation.
 * Used by local tests and the opt-in `github-issue-workflow-smoke` script.
 */

export const PRIORITY_LABELS = ['p0', 'p1', 'p2', 'p3'] as const;
export type PriorityLabel = (typeof PRIORITY_LABELS)[number];

export const PROJECT_STATUSES = [
  'Backlog',
  'Ready',
  'In progress',
  'In review',
  'Done',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type GitHubIssueWorkflowPacket = {
  title: string;
  body: string;
  labels: string[];
  projectStatus?: ProjectStatus | string;
};

export type WorkflowValidationFailure = {
  capability: string;
  message: string;
  nextAction: string;
};

const PRIVATE_BODY_PATTERNS: Array<{ pattern: RegExp; capability: string; nextAction: string }> = [
  {
    pattern: /\b(?:sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/,
    capability: 'public-safe issue body',
    nextAction: 'Remove API tokens or secrets from the issue body before creating the issue.',
  },
  {
    pattern: /\b(?:password|api[_-]?key|secret|token)\s*[:=]\s*\S+/i,
    capability: 'public-safe issue body',
    nextAction: 'Replace inline credentials with a redacted placeholder or link to a private store.',
  },
];

function failure(
  capability: string,
  message: string,
  nextAction: string,
): WorkflowValidationFailure {
  return { capability, message, nextAction };
}

export function countPriorityLabels(labels: string[]): number {
  const normalized = labels.map((label) => label.trim().toLowerCase());
  return PRIORITY_LABELS.filter((label) => normalized.includes(label)).length;
}

export function validatePublicSafeIssueBody(body: string): WorkflowValidationFailure[] {
  const failures: WorkflowValidationFailure[] = [];
  for (const rule of PRIVATE_BODY_PATTERNS) {
    if (rule.pattern.test(body)) {
      failures.push(failure(rule.capability, 'Issue body matched a private or secret pattern.', rule.nextAction));
    }
  }
  return failures;
}

export function validateProjectStatus(status: string | undefined): WorkflowValidationFailure[] {
  if (!status) return [];
  if ((PROJECT_STATUSES as readonly string[]).includes(status)) return [];
  return [
    failure(
      'project board status',
      `Unknown project status "${status}".`,
      `Use one of: ${PROJECT_STATUSES.join(', ')}.`,
    ),
  ];
}

export function validateGitHubIssueWorkflowPacket(
  packet: GitHubIssueWorkflowPacket,
): { ok: true } | { ok: false; failures: WorkflowValidationFailure[] } {
  const failures: WorkflowValidationFailure[] = [];

  if (!packet.title.trim()) {
    failures.push(
      failure('issue title', 'Title is required.', 'Provide a short, actionable issue title.'),
    );
  }

  if (!packet.body.trim()) {
    failures.push(
      failure('issue body', 'Body is required.', 'Include problem, evidence, and acceptance criteria.'),
    );
  } else if (!/##\s+problem/i.test(packet.body)) {
    failures.push(
      failure(
        'issue body shape',
        'Body is missing a "## Problem" section.',
        'Add a Problem section so triage and implementers share the same frame.',
      ),
    );
  } else if (!/acceptance criteria/i.test(packet.body)) {
    failures.push(
      failure(
        'issue body shape',
        'Body is missing acceptance criteria.',
        'Add an Acceptance criteria checklist reviewers can verify.',
      ),
    );
  }

  failures.push(...validatePublicSafeIssueBody(packet.body));
  failures.push(...validateProjectStatus(packet.projectStatus));

  const priorityCount = countPriorityLabels(packet.labels);
  if (priorityCount === 0) {
    failures.push(
      failure(
        'priority label',
        'Issue packet has no p-label.',
        'Add exactly one of p0, p1, p2, or p3 when creating the issue.',
      ),
    );
  } else if (priorityCount > 1) {
    failures.push(
      failure(
        'priority label',
        `Issue packet has ${priorityCount} p-labels.`,
        'Keep exactly one priority label on each issue.',
      ),
    );
  }

  if (failures.length) return { ok: false, failures };
  return { ok: true };
}

export function formatWorkflowFailures(failures: WorkflowValidationFailure[]): string {
  return failures
    .map(
      (item, index) =>
        `${index + 1}. [${item.capability}] ${item.message} Next: ${item.nextAction}`,
    )
    .join('\n');
}

export function buildDisposableIssuePacket(runId: string): GitHubIssueWorkflowPacket {
  return {
    title: `[smoke-disposable] github-issue-workflow ${runId}`,
    body: [
      '## Problem',
      'Disposable smoke issue validating the GitHub issue workflow packet.',
      '',
      '## Acceptance criteria',
      '- [ ] Exactly one priority label is present.',
      '- [ ] Body stays public-safe.',
      '- [ ] Issue is closed during smoke cleanup.',
      '',
      '## Suggested verification',
      '- `task smoke:github-issue-workflow`',
    ].join('\n'),
    labels: ['p3', 'enhancement', 'area: tests'],
    projectStatus: 'Backlog',
  };
}
