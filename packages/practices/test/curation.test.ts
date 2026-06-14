import { describe, expect, test, afterAll, beforeAll } from 'bun:test';
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CurationEngine } from '../src/index.js';
import type { CurationProposal } from '@otto-haus/core';

const testRoot = resolve(fileURLToPath(import.meta.url), '../../test-sandbox');

beforeAll(async () => {
  await fs.mkdir(testRoot, { recursive: true });
});

afterAll(async () => {
  await fs.rm(testRoot, { recursive: true, force: true });
});

describe('CurationEngine', () => {
  test('propose, list, ratify, apply lifecycle', async () => {
    const engine = new CurationEngine({ rootPath: testRoot });
    await engine.init();

    // 1. Propose
    const propPayload = {
      classification: 'standard' as const,
      risk_level: 'reversible' as const,
      trigger_reason: 'Testing curation engine',
      proposed_name: 'Test Standard',
      proposed_content: '# Test Standard\n\nThis is a standard for testing.',
    };

    const proposal = await engine.propose(propPayload);
    expect(proposal.id).toBeDefined();
    expect(proposal.status).toBe('pending');
    expect(proposal.created_at).toBeDefined();

    // 2. Get
    const retrieved = await engine.getProposal(proposal.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.proposed_name).toBe('Test Standard');

    // 3. List
    const list = await engine.listProposals();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(proposal.id);

    // 4. Ratify
    const ratified = await engine.ratify(proposal.id, 'approved');
    expect(ratified.status).toBe('ratified');
    expect(ratified.ratified_at).toBeDefined();

    // 5. Apply
    // We need to mock the directory structure for apply to succeed
    const standardsDir = join(testRoot, 'standards', 'standards');
    const registryPath = join(testRoot, 'standards', 'registry.yaml');
    await fs.mkdir(standardsDir, { recursive: true });
    // Write a skeleton registry
    await fs.writeFile(registryPath, 'standards: []', 'utf8');

    const applied = await engine.apply(proposal.id);
    expect(applied.status).toBe('applied');
    expect(applied.applied_at).toBeDefined();

    // Verify file got written
    const standardFile = join(standardsDir, 'test-standard.md');
    const content = await fs.readFile(standardFile, 'utf8');
    expect(content).toBe('# Test Standard\n\nThis is a standard for testing.');
  });
});
