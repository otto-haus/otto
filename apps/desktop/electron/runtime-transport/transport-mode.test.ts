import { describe, expect, test } from 'bun:test';
import { resolveTransportMode } from './transport-mode';

describe('resolveTransportMode', () => {
  const original = process.env.OTTO_RUNTIME_TRANSPORT;

  test('defaults to sdk', () => {
    delete process.env.OTTO_RUNTIME_TRANSPORT;
    expect(resolveTransportMode()).toBe('sdk');
  });

  test('parses ws mode', () => {
    process.env.OTTO_RUNTIME_TRANSPORT = 'ws';
    expect(resolveTransportMode()).toBe('ws');
  });

  test('parses auto mode', () => {
    process.env.OTTO_RUNTIME_TRANSPORT = 'auto';
    expect(resolveTransportMode()).toBe('auto');
  });

  test('unknown values fall back to sdk', () => {
    process.env.OTTO_RUNTIME_TRANSPORT = 'cloud';
    expect(resolveTransportMode()).toBe('sdk');
  });

  if (original === undefined) delete process.env.OTTO_RUNTIME_TRANSPORT;
  else process.env.OTTO_RUNTIME_TRANSPORT = original;
});
