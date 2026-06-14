import type { SurfaceId } from './components/Sidebar';

export const META: Record<SurfaceId, { title: string; sub: string }> = {
  chat: { title: 'Chat', sub: '' },
  charters: { title: 'Charters', sub: 'Operating contracts — bets, acceptance criteria, linked runs and receipts.' },
  standards: { title: 'Standards', sub: 'Explicit canon — what we reward, refuse, and do under pressure.' },
  practices: { title: 'Practices', sub: 'Executable culture with guardrails and receipt requirements.' },
  routines: { title: 'Routines', sub: 'Repeated bundles of Practices; recurring activation is approval-gated.' },
  curation: { title: 'Curation', sub: 'Proposal-and-ratification queue; Approvals are decision receipts emitted here.' },
  receipts: { title: 'Receipts', sub: 'Proof of work — receipts and run summaries from ~/.otto.' },
  checks: { title: 'Checks', sub: 'Culture CI — compiled regressions from Standards; blocks surface in Chat.' },
  autonomy: { title: 'Autonomy', sub: 'Policy zones, doors, and Knowledge-informed model routing.' },
  skills: { title: 'Skills', sub: 'Reusable capability packages loaded from skill/**/SKILL.md.' },
  knowledge: { title: 'Knowledge', sub: 'AI Frontier model registry — routing Autonomy and ticket workers.' },
  tickets: { title: 'Tickets', sub: 'Bounded worker slices — compile, orchestrate in worktrees, track workers.' },
  channels: { title: 'Channels', sub: 'Reachability surfaces; outbound sends are approval-gated.' },
  settings: { title: 'Settings', sub: 'Connection, providers, and workspace defaults.' },
};

export const VALID_SURFACES: SurfaceId[] = [
  'chat', 'charters', 'standards', 'practices', 'routines', 'curation', 'receipts',
  'checks', 'autonomy', 'skills', 'knowledge', 'tickets', 'channels', 'settings',
];
