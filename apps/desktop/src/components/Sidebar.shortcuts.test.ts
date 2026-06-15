import { describe, expect, test } from 'bun:test';
import { NUMERIC_SURFACE_SHORTCUTS } from './Sidebar';

describe('NUMERIC_SURFACE_SHORTCUTS (#612)', () => {
  test('maps the bare ⌘<digit> hints to their surfaces', () => {
    expect(NUMERIC_SURFACE_SHORTCUTS).toMatchObject({
      '1': 'chat',
      '2': 'charters',
      '3': 'standards',
      '4': 'practices',
      '5': 'routines',
      '6': 'curation',
      '7': 'receipts',
      '8': 'autonomy',
      '9': 'checks',
      '0': 'skills',
    });
  });

  test('every entry is a single-digit key (modified shortcuts like ⌘⌥0 excluded)', () => {
    for (const key of Object.keys(NUMERIC_SURFACE_SHORTCUTS)) {
      expect(key).toMatch(/^[0-9]$/);
    }
    // knowledge uses ⌘⌥0 and must not be reachable via a bare digit.
    expect(Object.values(NUMERIC_SURFACE_SHORTCUTS)).not.toContain('knowledge');
  });
});
