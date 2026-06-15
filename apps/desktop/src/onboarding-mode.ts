import type { OnboardingConnectionMode } from './onboarding-storage';

export const MODE_SAVE_ERROR = 'Could not save that choice. Check your connection and try again.';

export interface ModePersistDeps {
  /** Write the chosen connection mode to config (no-op when there is no runtime bridge). */
  setConfig: (mode: OnboardingConnectionMode) => Promise<void>;
  /** Re-resolve the connection after the config write (no-op without a bridge). */
  saveConnection: () => Promise<void>;
  /** Commit the session-scoped mode draft + local picker state. */
  commitDraft: (mode: OnboardingConnectionMode) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Persist a connection mode, committing the session draft ONLY after the config write succeeds.
 * Previously the draft was committed first, so a failed `config.set` hid the mode picker while
 * persisted config still held the previous mode — users advanced believing the mode was saved (#696).
 */
export async function persistOnboardingMode(
  mode: OnboardingConnectionMode,
  deps: ModePersistDeps,
): Promise<void> {
  try {
    await deps.setConfig(mode);
    await deps.saveConnection();
  } catch {
    deps.onError(MODE_SAVE_ERROR);
    return;
  }
  deps.commitDraft(mode);
  deps.onSuccess();
}
