import { describe, expect, test } from 'bun:test';
import { LETTA_APP_PATH, LETTA_DOCS_URL, planOpenLettaTarget } from './open-letta';

describe('planOpenLettaTarget (#607)', () => {
  test('embedded reveals the otto-owned runtime home, never Letta.app', () => {
    const plan = planOpenLettaTarget({
      connectionMode: 'embedded',
      lettaStateDir: '/Users/test/.otto/letta',
      // Even when Letta.app is installed, embedded must not launch it.
      lettaAppExists: true,
    });
    expect(plan.kind).toBe('reveal');
    expect(plan.target).toBe('/Users/test/.otto/letta');
    expect(plan.target).not.toBe(LETTA_APP_PATH);
  });

  test('existing mode opens installed Letta Desktop when present', () => {
    const plan = planOpenLettaTarget({
      connectionMode: 'existing',
      lettaStateDir: '/Users/test/.otto/letta',
      lettaAppExists: true,
    });
    expect(plan.kind).toBe('open-app');
    expect(plan.target).toBe(LETTA_APP_PATH);
  });

  test('existing mode falls back to docs when Letta Desktop is absent', () => {
    const plan = planOpenLettaTarget({
      connectionMode: 'existing',
      lettaStateDir: '/Users/test/.otto/letta',
      lettaAppExists: false,
    });
    expect(plan.kind).toBe('open-external');
    expect(plan.target).toBe(LETTA_DOCS_URL);
  });

  test('cloud mode without Letta Desktop opens docs (no blind Letta.app launch)', () => {
    const plan = planOpenLettaTarget({
      connectionMode: 'cloud',
      lettaStateDir: '/Users/test/.otto/letta',
      lettaAppExists: false,
    });
    expect(plan.kind).toBe('open-external');
    expect(plan.target).toBe(LETTA_DOCS_URL);
  });
});
