import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');
const copySource = readFileSync(join(import.meta.dir, '../copy/surfaces.ts'), 'utf8');

describe('Diagnostics embedded state path (#674)', () => {
  it('shows This Mac runtime data copy when embedded mode is active', () => {
    expect(copySource).toContain('Runtime data for This Mac lives in ~/.otto/letta/');
    expect(panesSource).toContain('settingsCopy.diagnosticsEmbeddedStateTitle');
    expect(panesSource).toContain('settingsCopy.diagnosticsEmbeddedStateBody');
    expect(panesSource).toContain('connectionMode === \'embedded\'');
    expect(panesSource).toContain('workspaceCtx.lettaStateDir');
    expect(panesSource).toContain('api.workspace.context()');
  });
});
