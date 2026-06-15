import { describe, expect, test } from 'bun:test';
import { resolveLettaOpenAction } from './letta-open-action';

describe('resolveLettaOpenAction', () => {
  test('embedded with http URL offers web UI', () => {
    expect(resolveLettaOpenAction('embedded', 'http://127.0.0.1:8283')).toEqual({
      kind: 'open',
      label: 'Open Letta web UI',
    });
  });

  test('embedded without URL explains no separate app', () => {
    expect(resolveLettaOpenAction('embedded', null).kind).toBe('none');
  });

  test('existing without URL offers desktop app', () => {
    expect(resolveLettaOpenAction('existing', null)).toEqual({
      kind: 'open',
      label: 'Open Letta Desktop',
    });
  });
});
