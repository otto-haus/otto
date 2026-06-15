import { describe, expect, test } from 'bun:test';
import { resolveLettaOpenAction } from './letta-open-action';

describe('resolveLettaOpenAction', () => {
  test('embedded with base URL opens web UI', () => {
    expect(resolveLettaOpenAction('embedded', 'http://127.0.0.1:8283/')).toEqual({
      kind: 'open',
      label: 'Open Letta web UI',
    });
  });

  test('embedded without URL explains bundled runtime', () => {
    expect(resolveLettaOpenAction('embedded', '')).toEqual({
      kind: 'none',
      hint: 'Letta runs inside otto as a local web server — no separate Letta app install.',
    });
  });

  test('existing local without URL opens desktop app', () => {
    expect(resolveLettaOpenAction('existing', null)).toEqual({
      kind: 'open',
      label: 'Open Letta Desktop',
    });
  });
});
