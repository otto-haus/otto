import { describe, expect, test } from 'bun:test';
import { parseTicketCommand } from '../src/chat/ticket-commands';

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
