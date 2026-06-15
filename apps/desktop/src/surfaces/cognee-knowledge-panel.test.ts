import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const panesSource = readFileSync(join(import.meta.dir, 'Panes.tsx'), 'utf8');
const copySource = readFileSync(join(import.meta.dir, '../copy/surfaces.ts'), 'utf8');

describe('CogneeKnowledgePanel (#70 / 044)', () => {
  it('renders a dedicated graph recall section in Knowledge', () => {
    expect(panesSource).toContain('const CogneeKnowledgePanel');
    expect(panesSource).toContain('<CogneeKnowledgePanel />');
    expect(copySource).toContain("cogneeTitle: 'Graph recall (Cognee)'");
  });

  it('shows honest disabled empty state without mock graph rows', () => {
    expect(panesSource).toContain("health?.status === 'disabled'");
    expect(panesSource).toContain('LabsBlockedShell');
    expect(copySource).toContain('no mock graph rows');
    expect(panesSource).not.toContain('entityCount');
    expect(panesSource).not.toContain('mockEntities');
  });

  it('surfaces last capture metadata, kinds, and unknown entity/doc fallbacks', () => {
    expect(panesSource).toContain('zoneLastCapture');
    expect(panesSource).toContain('zoneKinds');
    expect(panesSource).toContain('zoneEntities');
    expect(panesSource).toContain('zoneUnknown');
    expect(panesSource).toContain('capture.capturedAt');
  });

  it('does not fake ready when health reports error', () => {
    expect(panesSource).toContain('health.lastError');
    expect(panesSource).toContain("health.status !== 'ready'");
    expect(panesSource).toContain("disabled={busy || health.status !== 'ready'}");
  });

  it('wires recall smoke to cognee IPC with citation rows', () => {
    expect(panesSource).toContain('recallSmoke(');
    expect(panesSource).toContain('zoneCitation');
    expect(panesSource).toContain('recall.error');
  });
});
