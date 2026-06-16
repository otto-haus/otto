import { describe, expect, it } from 'bun:test';
import {
  nextActionFor,
  runtimeSetupBody,
  runtimeSetupTitle,
} from './runtime-status-ui';

describe('runtime-status-ui (#585)', () => {
  it('maps StatusCode to distinct setup titles', () => {
    expect(runtimeSetupTitle('no-agent')).toMatch(/Set up a local Letta agent/i);
    expect(runtimeSetupTitle('unreachable')).toMatch(/Can't reach Letta/i);
    expect(runtimeSetupTitle('stale')).toMatch(/stale/i);
    expect(runtimeSetupTitle('usage-limit')).toMatch(/usage limit/i);
    expect(runtimeSetupTitle(undefined)).toMatch(/can't connect yet/i);
  });

  it('prefers friendly reason over generic body except no-agent', () => {
    const fallbacks = { noAgentBody: 'no-agent copy', defaultBody: 'default copy' };
    expect(runtimeSetupBody('no-agent', 'raw path', fallbacks)).toBe('no-agent copy');
    expect(runtimeSetupBody('unreachable', 'Letta is down', fallbacks)).toBe('Letta is down');
    expect(runtimeSetupBody('error', undefined, fallbacks)).toBe('default copy');
  });

  it('nextActionFor varies by connection mode for embedded unreachable', () => {
    expect(nextActionFor('unreachable', { connectionMode: 'embedded' })).toMatch(/Retry Connect/i);
    expect(nextActionFor('unreachable', { connectionMode: 'existing' })).toMatch(/URL override/i);
  });
});
