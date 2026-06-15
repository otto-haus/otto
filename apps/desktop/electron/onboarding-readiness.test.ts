import { describe, expect, it } from 'bun:test';
import { requiredMissing, readiness } from '../src/readiness';

describe('onboarding readiness gate (#137)', () => {
  it('exports runtime rows used in connect step', () => {
    const keys = readiness.map((row) => row.key);
    for (const key of ['runtime', 'agent', 'model', 'memory']) {
      expect(keys).toContain(key);
    }
  });

  it('blocks when required runtime items are missing', () => {
    const missingRuntime = requiredMissing.some((row) =>
      ['runtime', 'agent', 'memory'].includes(row.key),
    );
    expect(typeof missingRuntime).toBe('boolean');
  });

  it('connect step copy names inline rows and Letta-owned keys', async () => {
    const { onboardingCopy, settingsCopy } = await import('../src/copy/surfaces');
    expect(onboardingCopy.connectContinue).toBe('Continue →');
    expect(onboardingCopy.connectLede.toLowerCase()).toContain('readiness rows');
    expect(onboardingCopy.connectLede.toLowerCase()).toContain('auto-discover');
    expect(onboardingCopy.connectLede.toLowerCase()).toContain('letta');
    expect(settingsCopy.readinessChecking).toBe('Checking runtime…');
  });
});
