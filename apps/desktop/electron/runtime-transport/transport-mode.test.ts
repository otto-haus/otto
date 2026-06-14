import { describe, expect, test } from 'bun:test';
import { resolveTransportMode } from './transport-mode';

describe('resolveTransportMode', () => {
  const original = process.env.OTTO_RUNTIME_TRANSPORT;

  test('defaults to ws', () => {
    delete process.env.OTTO_RUNTIME_TRANSPORT;
    expect(resolveTransportMode()).toBe('ws');
  });

  test('parses ws mode', () => {
    process.env.OTTO_RUNTIME_TRANSPORT = 'ws';
    expect(resolveTransportMode()).toBe('ws');
  });

  test('parses auto mode', () => {
    process.env.OTTO_RUNTIME_TRANSPORT = 'auto';
    expect(resolveTransportMode()).toBe('auto');
  });

  test('parses sdk mode for explicit diagnostics', () => {
    process.env.OTTO_RUNTIME_TRANSPORT = 'sdk';
    expect(resolveTransportMode()).toBe('sdk');
  });

  test('unknown values fall back to ws', () => {
    process.env.OTTO_RUNTIME_TRANSPORT = 'cloud';
    expect(resolveTransportMode()).toBe('ws');
  });

  if (original === undefined) delete process.env.OTTO_RUNTIME_TRANSPORT;
  else process.env.OTTO_RUNTIME_TRANSPORT = original;
});
