export type SettingsSectionId =
  | 'general'
  | 'display'
  | 'providers'
  | 'memory'
  | 'culture'
  | 'diagnostics';

export const SETTINGS_SECTION_KEY = 'otto.settings.section';
export const SETTINGS_SECTION_EVENT = 'otto:settings-section';

const VALID_SECTIONS = new Set<SettingsSectionId>([
  'general',
  'display',
  'providers',
  'memory',
  'culture',
  'diagnostics',
]);

/** Map legacy `labs` deep-link to diagnostics (Labs tab removed). */
export function normalizeSettingsSection(raw: string | null): SettingsSectionId | null {
  if (!raw) return null;
  const section = raw === 'labs' ? 'diagnostics' : raw;
  return VALID_SECTIONS.has(section as SettingsSectionId)
    ? (section as SettingsSectionId)
    : null;
}

export function readPendingSettingsSection(): SettingsSectionId | null {
  try {
    const pending = sessionStorage.getItem(SETTINGS_SECTION_KEY);
    const section = normalizeSettingsSection(pending);
    if (section) sessionStorage.removeItem(SETTINGS_SECTION_KEY);
    return section;
  } catch {
    return null;
  }
}

/** Request a Settings sub-tab; works when Settings is already mounted (#613). */
export function openSettingsSection(section: SettingsSectionId | 'labs'): void {
  try {
    sessionStorage.setItem(SETTINGS_SECTION_KEY, section);
  } catch { /* best effort */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SETTINGS_SECTION_EVENT));
  }
}

export function openLabsSettings(onNavigate: (surface: 'settings') => void): void {
  openSettingsSection('labs');
  onNavigate('settings');
}
