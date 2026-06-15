import { describe, expect, test } from 'bun:test';
import { buildCommandStationCounts } from './command-station-counts';

describe('buildCommandStationCounts', () => {
  test('omits zero counts so cards show honest dashes', () => {
    expect(buildCommandStationCounts({
      proposals: [{ status: 'accepted' }],
      receipts: [],
      tickets: [{ status: 'merged' }],
      approvals: [],
    })).toEqual({});
  });

  test('includes non-zero ops counts from live stores', () => {
    expect(buildCommandStationCounts({
      proposals: [{ status: 'proposed' }, { status: 'needs_approval' }],
      receipts: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
      tickets: [{ status: 'active' }, { status: 'cancelled' }],
      approvals: [{ id: 'a' }, { id: 'b' }],
    })).toEqual({
      curationPending: 2,
      recentReceipts: 3,
      openTickets: 1,
      autonomyDoors: 2,
    });
  });
});
