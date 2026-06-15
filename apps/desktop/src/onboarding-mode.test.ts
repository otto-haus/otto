import { describe, expect, mock, test } from 'bun:test';
import { MODE_SAVE_ERROR, persistOnboardingMode } from './onboarding-mode';

function deps(overrides: Partial<Parameters<typeof persistOnboardingMode>[1]> = {}) {
  return {
    setConfig: mock(async () => {}),
    saveConnection: mock(async () => {}),
    commitDraft: mock(() => {}),
    onSuccess: mock(() => {}),
    onError: mock(() => {}),
    ...overrides,
  };
}

describe('persistOnboardingMode (#696)', () => {
  test('commits the draft only after config + connection succeed', async () => {
    const d = deps();
    await persistOnboardingMode('embedded', d);
    expect(d.setConfig).toHaveBeenCalledWith('embedded');
    expect(d.saveConnection).toHaveBeenCalledTimes(1);
    expect(d.commitDraft).toHaveBeenCalledWith('embedded');
    expect(d.onSuccess).toHaveBeenCalledTimes(1);
    expect(d.onError).not.toHaveBeenCalled();
  });

  test('does NOT commit the draft when config.set fails', async () => {
    const d = deps({ setConfig: mock(async () => { throw new Error('ipc down'); }) });
    await persistOnboardingMode('existing', d);
    expect(d.commitDraft).not.toHaveBeenCalled();
    expect(d.saveConnection).not.toHaveBeenCalled();
    expect(d.onSuccess).not.toHaveBeenCalled();
    expect(d.onError).toHaveBeenCalledWith(MODE_SAVE_ERROR);
  });

  test('does NOT commit the draft when connection.save fails', async () => {
    const d = deps({ saveConnection: mock(async () => { throw new Error('save failed'); }) });
    await persistOnboardingMode('existing', d);
    expect(d.setConfig).toHaveBeenCalledTimes(1);
    expect(d.commitDraft).not.toHaveBeenCalled();
    expect(d.onSuccess).not.toHaveBeenCalled();
    expect(d.onError).toHaveBeenCalledWith(MODE_SAVE_ERROR);
  });
});
