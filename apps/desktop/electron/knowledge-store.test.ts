import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KnowledgeStore } from './knowledge-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const knowledgeDir = join(repoRoot, 'knowledge');

describe('KnowledgeStore', () => {
  test('loads AI Frontier model registry from file-backed canon', () => {
    const store = new KnowledgeStore(knowledgeDir);
    const result = store.listResult();

    expect(result.storage).toBe('files');
    expect(result.registryPath).toContain('model-registry.yaml');
    expect(result.registry?.schema).toBe('otto.knowledge.registry.v1');
    expect(result.registry?.routing.assignments.ticket_worker).toBeTruthy();
    expect(result.registry?.models.length).toBeGreaterThan(0);
  });

  test('resolveModelForRole returns provider/model for ticket workers', () => {
    const store = new KnowledgeStore(knowledgeDir);
    const resolved = store.resolveModelForRole('ticket_worker');
    expect(resolved?.provider).toBeTruthy();
    expect(resolved?.model).toBeTruthy();
  });

  test('malformed model registry does not crash knowledge listing', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-knowledge-'));
    try {
      const frontierDir = join(tmp, 'ai-frontier');
      mkdirSync(frontierDir, { recursive: true });
      writeFileSync(join(frontierDir, 'model-registry.yaml'), 'models: [unterminated\n');

      const store = new KnowledgeStore(tmp);
      const result = store.listResult();

      expect(result.registryPath).toBe(join(frontierDir, 'model-registry.yaml'));
      expect(result.registry).toBeNull();
      expect(result.storage).toBe('files');
      expect(store.routingForRole('ticket_worker')).toBeNull();
      expect(store.resolveModelForRole('ticket_worker')).toBeNull();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
