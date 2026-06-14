import type { SurfaceId } from './components/Sidebar';

/** One-pager "The test:" lines — compressed canon aligned to docs/onepagers/*.html */
export const SURFACE_TESTS: Partial<Record<SurfaceId, string>> = {
  charters: 'Does this charter link intent, acceptance criteria, runs, and receipts?',
  standards: 'When two Standards conflict, can Otto cite a precedent instead of improvising?',
  practices: 'Would this Practice be missed if it vanished after a week?',
  routines: 'Would Sebastian miss this Routine if it vanished?',
  curation: 'Can one proposal schema handle memory, routines, practices, and approval cards?',
  receipts: 'Can Desktop show what was proven — not just what was attempted?',
  checks: 'When a done claim fails, does the operator see the check name, receipt, and source Standard?',
  autonomy: 'Can Otto choose the next operational move without asking unless a door appears?',
  skills: 'Does this Skill reduce repeated setup mistakes or safety footguns?',
  knowledge: 'Did a Knowledge update change model routing, ticket sizing, or Autonomy policy?',
  tickets: 'Can Main Otto orchestrate worker tickets, write receipts, and ask only for consequential gates?',
  channels: 'Can a Discord reply map to a pending Curation proposal without becoming the database?',
  settings: 'Can Desktop show what Otto is managing, what needs Sebastian, and what was proven?',
};
