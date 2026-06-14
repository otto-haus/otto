import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');

describe('ModelProviders tab accessibility contract', () => {
  it('keeps the provider segmented control wired as an operable tablist', () => {
    expect(panesSource).toContain('role="tablist" aria-label="Provider type" onKeyDown={handleProviderTabKeyDown}');
    expect(panesSource).toContain('role="tab"');
    expect(panesSource).toContain('aria-selected={tab === providerTab.kind}');
    expect(panesSource).toContain('aria-controls={providerTab.panelId}');
    expect(panesSource).toContain('tabIndex={tab === providerTab.kind ? 0 : -1}');
    expect(panesSource).toContain('role="tabpanel"');
    expect(panesSource).toContain('aria-labelledby={activeProviderTab.tabId}');
  });

  it('supports keyboard navigation between Local and Cloud tabs', () => {
    expect(panesSource).toContain("event.key === 'ArrowRight'");
    expect(panesSource).toContain("event.key === 'ArrowLeft'");
    expect(panesSource).toContain("event.key === 'Home'");
    expect(panesSource).toContain("event.key === 'End'");
    expect(panesSource).toContain("querySelectorAll<HTMLButtonElement>('[role=\"tab\"]')");
  });
});
