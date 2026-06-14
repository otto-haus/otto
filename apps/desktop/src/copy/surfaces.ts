import type { SurfaceId } from '../components/Sidebar';

/** Canonical UI copy — builder wires data; UX owns strings. */
export type WebPreviewEmpty = {
  eyebrow: string;
  title: string;
  body: string;
  path?: string;
  next: string;
};

export type ListEmpty = {
  title: string;
  body: string;
};

export const webPreviewEmpty: Record<Exclude<SurfaceId, 'chat' | 'settings'>, WebPreviewEmpty> = {
  charters: {
    eyebrow: 'charters',
    title: 'Charters live in the desktop app.',
    body: 'Operating contracts link intent, acceptance criteria, runs, and receipts from ~/.otto/charters/.',
    path: '~/.otto/charters/',
    next: 'Open the packaged desktop app to create and track charters.',
  },
  standards: {
    eyebrow: 'standards',
    title: 'Standards load from canon files.',
    body: 'Explicit rules — what otto rewards, refuses, and does under pressure.',
    path: 'standards/',
    next: 'Open the desktop app to browse loaded Standards and precedents.',
  },
  practices: {
    eyebrow: 'practices',
    title: 'Practices are executable Standards.',
    body: 'Guardrails, invocations, and receipt requirements from practices/**/practice.yaml.',
    path: 'practices/',
    next: 'Open the desktop app to inspect practice specs and linked receipts.',
  },
  routines: {
    eyebrow: 'routines',
    title: 'Routines bundle repeated Practices.',
    body: 'Manual runs record receipts; recurring activation stays approval-gated.',
    path: 'routines/',
    next: 'Open the desktop app to run a routine manually.',
  },
  curation: {
    eyebrow: 'curation',
    title: 'Curation inbox is available in the desktop app.',
    body: 'Corrections become proposals. Accept ratifies canon; reject and defer leave canon unchanged.',
    path: '~/.otto/curation/proposals/',
    next: 'Open the packaged desktop app to inspect pending proposals.',
  },
  receipts: {
    eyebrow: 'receipts',
    title: 'Receipts prove what happened.',
    body: 'Durable proof records from ~/.otto/receipts/ — authority and evidence, not chat logs.',
    path: '~/.otto/receipts/',
    next: 'Open the desktop app to inspect receipt detail and blockers.',
  },
  autonomy: {
    eyebrow: 'autonomy',
    title: 'Autonomy policy loads locally.',
    body: 'Zones, doors, and Knowledge-informed routing — consequential actions stay gated.',
    path: '~/.otto/autonomy/',
    next: 'Open the desktop app to evaluate actions against policy.',
  },
  skills: {
    eyebrow: 'skills',
    title: 'Skills load from skill/**/SKILL.md.',
    body: 'Reusable capability packages — triggers and scope without secret sprawl.',
    path: 'skill/',
    next: 'Open the desktop app to browse loaded skills.',
  },
  knowledge: {
    eyebrow: 'knowledge',
    title: 'Knowledge registry is file-backed.',
    body: 'Model routing hints for Autonomy and ticket workers — not a second memory store.',
    path: '~/.otto/knowledge/',
    next: 'Open the desktop app to inspect registry entries.',
  },
  tickets: {
    eyebrow: 'tickets',
    title: 'Tickets orchestrate bounded worker slices.',
    body: 'Compile packets, spawn workers in worktrees, track status with receipts.',
    path: '~/.otto/tickets/',
    next: 'Open the desktop app to create and orchestrate tickets.',
  },
  channels: {
    eyebrow: 'channels',
    title: 'Channels are reachability surfaces.',
    body: 'Outbound sends stay approval-gated; inbound maps to proposals, not silent writes.',
    path: '~/.otto/channels/',
    next: 'Open the desktop app to configure channels.',
  },
};

export const listEmpty: Partial<Record<SurfaceId, ListEmpty>> = {
  charters: {
    title: 'No charters yet',
    body: 'Create a charter when a bet needs explicit acceptance criteria and linked receipts.',
  },
  standards: {
    title: 'No Standards loaded',
    body: 'Add standards under standards/ or check loader skipped files below.',
  },
  practices: {
    title: 'No practices loaded',
    body: 'Add practice.yaml files under practices/ with valid guardrails.',
  },
  routines: {
    title: 'No routines loaded',
    body: 'Add routine.yaml under routines/ to bundle repeated practice invocations.',
  },
  curation: {
    title: 'No proposals',
    body: 'Corrections routed through Correct this → Curation will appear as needs_approval.',
  },
  receipts: {
    title: 'No receipts yet',
    body: 'Receipts emit when otto completes, blocks, or fails an action with proof.',
  },
  skills: {
    title: 'No skills loaded',
    body: 'Add SKILL.md files under skill/ to register capabilities.',
  },
  tickets: {
    title: 'No tickets yet',
    body: 'Create a ticket when work needs a bounded worker slice and acceptance mapping.',
  },
  channels: {
    title: 'No channels configured',
    body: 'Add a channel when otto needs a reachability surface with approval gates.',
  },
};

export const toastCopy = {
  behaviorUpdated: 'Behavior updated',
  proposalAccepted: 'Proposal accepted',
  proposalRejected: 'Proposal rejected',
  proposalDeferred: 'Proposal deferred',
  decisionBlocked: 'Decision blocked',
  proposalCreated: 'Proposal created',
  openCuration: 'Open in Curation',
} as const;

export const chatCopy = {
  sessionEyebrow: 'Session',
  sessionTitle: 'Ready when you are.',
  sessionBody: 'Message otto to start a session. Corrections become proposals you ratify.',
  runtimeNotReadyEyebrow: 'runtime not ready',
  runtimeNotReadyTitle: "otto can't connect yet",
  runtimeNotReadyBody: 'Check Settings for Letta connection and required setup.',
  workingPulse: 'otto is working',
  correctThis: 'Correct this',
  correctThisHint: 'Turn this moment into changed future behavior',
  correctionDefault: 'This response should change — describe the behavior you want instead.',
  proposeFromCorrection: 'Propose from correction',
  proposeFromCorrectionHint: 'Describe the behavior you want next time. Canon stays unchanged until you ratify in Curation.',
  ticketCommandHint: 'Commands: compile ticket <slug> <objective> · orchestrate ticket <slug> · status workers',
  onboardingHint: 'Send your first message — otto writes a Receipt when work completes with proof.',
  onboardingReceiptHint: 'First turn recorded — open Receipts to inspect the proof record.',
  onboardingSkip: 'Skip setup',
  onboardingViewReceipts: 'View Receipts',
} as const;

export const permissionCopy = {
  modalTitle: 'Permission required',
  eyebrow: 'approval gate',
  allowOnce: 'Allow once',
  allowSession: 'Allow for session',
  deny: 'Deny',
  denyPlaceholder: 'Optional reason if you deny',
  deniedByUser: 'Denied by operator',
  interactiveNote: 'This tool needs a richer answer than yes/no — allow or deny for now; full interactive flow ships separately.',
} as const;

export const threadCopy = {
  groupLabel: 'Recent',
  empty: 'No prior chats yet.',
} as const;

export const commandStationCopy = {
  eyebrow: 'command station',
  title: 'What needs you',
  curation: { label: 'Curation', hint: 'Pending proposals' },
  receipts: { label: 'Recent proof', hint: 'Latest receipts' },
  tickets: { label: 'Tickets', hint: 'Open worker slices' },
  autonomy: { label: 'Doors', hint: 'Awaiting approval' },
  constitution: { label: 'Constitution', hint: 'Source of culture' },
  changelog: { label: 'Changelog', hint: 'What changed' },
} as const;
