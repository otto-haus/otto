/** Ephemeral chat content — not durable canon. */
export const CHAT_EPHEMERAL_KINDS = ['transcript', 'queued_unsent', 'command_echo'] as const;

export type ChatEphemeralKind = (typeof CHAT_EPHEMERAL_KINDS)[number];

export type PromotionTargetId =
  | 'issues'
  | 'charters'
  | 'standards'
  | 'practices'
  | 'routines'
  | 'receipts';

export type PromotionTarget = {
  id: PromotionTargetId;
  label: string;
  wired: boolean;
};

/** Durable promotion paths from chat; `wired` reflects today's product hooks only. */
export const PROMOTION_TARGETS = [
  { id: 'issues', label: 'Issues', wired: false },
  { id: 'charters', label: 'Charters', wired: false },
  { id: 'standards', label: 'Standards', wired: true },
  { id: 'practices', label: 'Practices', wired: true },
  { id: 'routines', label: 'Routines', wired: true },
  { id: 'receipts', label: 'Receipts', wired: true },
] as const satisfies readonly PromotionTarget[];

export const CHAT_NON_CANONICAL_DISCLAIMER =
  '_Chat is working memory in otto. Ratified proof lives in Receipts, Tickets, and Curation — not this export._';

const HANDOFF_SECTIONS = ['## State', '## Open questions', '## Next action'] as const;

export function formatHandoffFooter(): string {
  const body = HANDOFF_SECTIONS.map((heading) => `${heading}\n\n_None recorded._`).join('\n\n');
  return `\n---\n\n${CHAT_NON_CANONICAL_DISCLAIMER}\n\n${body}\n`;
}
