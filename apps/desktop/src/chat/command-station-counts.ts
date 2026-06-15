import type { CommandStationCounts } from '../components/ui';

const PENDING_PROPOSAL_STATUSES = new Set(['proposed', 'needs_approval']);
const CLOSED_TICKET_STATUSES = new Set(['merged', 'cancelled']);

/** Build ops dashboard counts from live stores; omits zeroes so UI shows honest dashes. */
export function buildCommandStationCounts(input: {
  proposals: Array<{ status: string }>;
  receipts: unknown[];
  tickets: Array<{ status: string }>;
  approvals: unknown[];
}): CommandStationCounts {
  const curationPending = input.proposals.filter((p) => PENDING_PROPOSAL_STATUSES.has(p.status)).length;
  const openTickets = input.tickets.filter((t) => !CLOSED_TICKET_STATUSES.has(t.status)).length;
  const recentReceipts = input.receipts.length > 0 ? Math.min(input.receipts.length, 3) : 0;
  const autonomyDoors = input.approvals.length;

  return {
    curationPending: curationPending > 0 ? curationPending : undefined,
    recentReceipts: recentReceipts > 0 ? recentReceipts : undefined,
    openTickets: openTickets > 0 ? openTickets : undefined,
    autonomyDoors: autonomyDoors > 0 ? autonomyDoors : undefined,
  };
}
