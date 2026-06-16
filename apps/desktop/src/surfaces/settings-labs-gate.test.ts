import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');

describe('Settings Labs feature gates (#699)', () => {
  it('gates Memory observatory behind memory_observatory flag', () => {
    expect(panesSource).toContain("isFeatureEnabled('memory_observatory')");
    expect(panesSource).toContain('memoryObservatoryEnabled');
    expect(panesSource).toContain('settingsCopy.memoryLabsGate');
  });

  it('gates culture export/import behind culture_export flag', () => {
    expect(panesSource).toContain("isFeatureEnabled('culture_export')");
    expect(panesSource).toContain('cultureExportEnabled');
    expect(panesSource).toContain('cultureSettingsCopy.exportLabsGate');
  });

  it('gates optional recall sidecars behind knowledge_cognee and pgvector_recall', () => {
    expect(panesSource).toContain("isFeatureEnabled('knowledge_cognee')");
    expect(panesSource).toContain("isFeatureEnabled('pgvector_recall')");
    expect(panesSource).toContain('settingsCopy.optionalRecallLabsGate');
    expect(panesSource).toContain('optionalRecallVisible');
  });
});
