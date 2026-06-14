import { describe, expect, test } from 'bun:test';
import type { OttoBridge } from '../src/runtime';
import { parseTicketCommand, runTicketCommand } from '../src/chat/ticket-commands';

describe('parseTicketCommand', () => {
  test('parses compile with objective', () => {
    expect(parseTicketCommand('compile ticket 034 Fix permission modal')).toEqual({
      kind: 'compile',
      slug: '034',
      objective: 'Fix permission modal',
    });
  });

  test('parses slash orchestrate', () => {
    expect(parseTicketCommand('/orchestrate ticket 035')).toEqual({
      kind: 'orchestrate',
      slug: '035',
    });
  });

  test('parses status workers', () => {
    expect(parseTicketCommand('status workers')).toEqual({ kind: 'status-workers' });
  });

  test('returns null for normal chat', () => {
    expect(parseTicketCommand('hello otto')).toBeNull();
  });
});

function mockTicketApi(overrides: Partial<OttoBridge> = {}): OttoBridge {
  const base: OttoBridge = {
    tickets: {
      compile: async () => ({
        ticket: {
          ticket_id: 'ticket_034',
          slug: '034',
          objective: 'Fix permission modal',
          status: 'proposed',
          acceptance_criteria: [],
        },
        receipt: { id: 'receipt-compile-1' },
      }),
      get: async () => null,
      list: async () => ({ tickets: [] }),
      updateStatus: async () => ({ ticket_id: 'ticket_034', status: 'merged' }),
      orchestrateExisting: async () => ({
        ticket: { ticket_id: 'ticket_035', status: 'active' },
        worker: { id: 'worker-1', status: 'running', ticket_id: 'ticket_035', worktree: '/tmp/wt' },
        run: { id: 'run-1' },
        worktreePath: '/tmp/wt',
        receipt: { id: 'receipt-orch-1' },
      }),
    },
    workers: {
      list: async () => ({
        workers: [{ id: 'worker-1', status: 'running', ticket_id: 'ticket_035', worktree: '/tmp/wt' }],
      }),
    },
    autonomy: {
      evaluateAction: async () => ({
        evaluation: { allowed_without_approval: true, zone: 'local', reason: 'allowed' },
        receipt: { id: 'receipt-gate-1' },
      }),
    },
    checks: {
      evaluateDoneClaim: async () => [],
      get: async () => null,
    },
  } as unknown as OttoBridge;
  return { ...base, ...overrides };
}

describe('runTicketCommand', () => {
  test('compile ticket returns receipt line in transcript', async () => {
    const reply = await runTicketCommand(mockTicketApi(), 'compile ticket 034 Fix permission modal');
    expect(reply?.handled).toBe(true);
    expect(reply?.lines.join('\n')).toContain('Compiled ticket_034');
    expect(reply?.lines.join('\n')).toContain('receipt-compile-1');
  });

  test('orchestrate ticket returns worker run and receipt lines', async () => {
    const api = mockTicketApi({
      tickets: {
        ...mockTicketApi().tickets,
        get: async () => ({
          ticket_id: 'ticket_035',
          slug: '035',
          objective: 'Orchestrate slice',
          status: 'proposed',
          acceptance_criteria: [],
        }),
      },
    } as Partial<OttoBridge>);
    const reply = await runTicketCommand(api, 'orchestrate ticket 035');
    expect(reply?.handled).toBe(true);
    const text = reply?.lines.join('\n') ?? '';
    expect(text).toContain('Orchestrated ticket_035');
    expect(text).toContain('worker-1');
    expect(text).toContain('run-1');
    expect(text).toContain('receipt-orch-1');
  });

  test('status workers lists worker records', async () => {
    const reply = await runTicketCommand(mockTicketApi(), 'status workers');
    expect(reply?.handled).toBe(true);
    expect(reply?.lines.join('\n')).toContain('worker-1');
    expect(reply?.lines.join('\n')).toContain('ticket_035');
  });

  test('orchestrate blocked when autonomy denies', async () => {
    const api = mockTicketApi({
      autonomy: {
        evaluateAction: async () => ({
          evaluation: { allowed_without_approval: false, zone: 'blast', reason: 'needs approval' },
          receipt: { id: 'receipt-blocked-1' },
        }),
      },
      tickets: {
        ...mockTicketApi().tickets,
        get: async () => ({
          ticket_id: 'ticket_035',
          slug: '035',
          objective: 'Orchestrate slice',
          status: 'proposed',
          acceptance_criteria: [],
        }),
      },
    } as Partial<OttoBridge>);
    const reply = await runTicketCommand(api, 'orchestrate ticket 035');
    expect(reply?.lines.join('\n')).toContain('Orchestration blocked');
    expect(reply?.lines.join('\n')).toContain('receipt-blocked-1');
  });
});
