import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');

describe('settings section deep-link (#613)', () => {
  it('Settings listens for section navigation while mounted', () => {
    expect(panesSource).toContain('readPendingSettingsSection');
    expect(panesSource).toContain('SETTINGS_SECTION_EVENT');
    expect(panesSource).toContain('window.addEventListener(SETTINGS_SECTION_EVENT, applyPendingSection)');
  });
});
