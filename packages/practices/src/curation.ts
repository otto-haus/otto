import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { CurationProposal } from '@otto-haus/core';

// Helper to generate a random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export interface CurationEngineOptions {
  rootPath: string;
}

export class CurationEngine {
  private rootPath: string;
  private proposalsDir: string;

  constructor(options: CurationEngineOptions) {
    this.rootPath = options.rootPath;
    this.proposalsDir = join(this.rootPath, 'proposals');
  }

  async init(): Promise<void> {
    await fs.mkdir(this.proposalsDir, { recursive: true });
  }

  async propose(proposal: Omit<CurationProposal, 'id' | 'status' | 'created_at'>): Promise<CurationProposal> {
    await this.init();
    const id = generateId();
    const created_at = new Date().toISOString();
    const newProposal: CurationProposal = {
      ...proposal,
      id,
      status: 'pending',
      created_at,
    };

    const filePath = join(this.proposalsDir, `${id}.yaml`);
    await fs.writeFile(filePath, stringify(newProposal), 'utf8');
    return newProposal;
  }

  async getProposal(id: string): Promise<CurationProposal | null> {
    await this.init();
    const filePath = join(this.proposalsDir, `${id}.yaml`);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return parse(content) as CurationProposal;
    } catch {
      return null;
    }
  }

  async listProposals(): Promise<CurationProposal[]> {
    await this.init();
    try {
      const files = await fs.readdir(this.proposalsDir);
      const proposals: CurationProposal[] = [];
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.json')) {
          const id = file.replace(/\.(yaml|json)$/, '');
          const prop = await this.getProposal(id);
          if (prop) {
            proposals.push(prop);
          }
        }
      }
      return proposals;
    } catch {
      return [];
    }
  }

  async ratify(id: string, decision: 'approved' | 'rejected'): Promise<CurationProposal> {
    const proposal = await this.getProposal(id);
    if (!proposal) {
      throw new Error(`Proposal not found: ${id}`);
    }

    if (proposal.status !== 'pending') {
      throw new Error(`Proposal is not pending: ${id} is ${proposal.status}`);
    }

    proposal.status = decision === 'approved' ? 'ratified' : 'rejected';
    proposal.ratified_at = new Date().toISOString();

    const filePath = join(this.proposalsDir, `${id}.yaml`);
    await fs.writeFile(filePath, stringify(proposal), 'utf8');
    return proposal;
  }

  async apply(id: string): Promise<CurationProposal> {
    const proposal = await this.getProposal(id);
    if (!proposal) {
      throw new Error(`Proposal not found: ${id}`);
    }

    if (proposal.status !== 'ratified') {
      throw new Error(`Proposal must be ratified before applying: current status is ${proposal.status}`);
    }

    if (proposal.classification === 'standard') {
      const standardsDir = join(this.rootPath, 'standards', 'standards');
      await fs.mkdir(standardsDir, { recursive: true });
      const fileName = `${proposal.proposed_name.toLowerCase().replace(/\s+/g, '-')}.md`;
      await fs.writeFile(join(standardsDir, fileName), proposal.proposed_content, 'utf8');

      const registryPath = join(this.rootPath, 'standards', 'registry.yaml');
      try {
        const registryContent = await fs.readFile(registryPath, 'utf8');
        const registry = parse(registryContent) as any;
        if (registry && Array.isArray(registry.standards)) {
          const slug = proposal.proposed_name.toLowerCase().replace(/\s+/g, '-');
          const exists = registry.standards.some((s: any) => s.slug === slug);
          if (!exists) {
            registry.standards.push({
              slug,
              name: proposal.proposed_name,
              status: 'active',
              version: '0.1',
              file: `standards/${fileName}`,
              meaning: 'Added via curation proposal',
            });
            await fs.writeFile(registryPath, stringify(registry), 'utf8');
          }
        }
      } catch (e) {
        console.warn('Could not update registry.yaml:', e);
      }

    } else if (proposal.classification === 'practice') {
      const slug = proposal.proposed_name.toLowerCase().replace(/\s+/g, '-');
      const practiceDir = join(this.rootPath, 'practices', slug);
      await fs.mkdir(practiceDir, { recursive: true });
      await fs.writeFile(join(practiceDir, 'practice.yaml'), proposal.proposed_content, 'utf8');

      const readmePath = join(practiceDir, 'README.md');
      try {
        await fs.writeFile(readmePath, `# ${proposal.proposed_name}\n\nGenerated via Curation Proposal.`, { flag: 'wx' });
      } catch {}

    } else if (proposal.classification === 'routine') {
      const slug = proposal.proposed_name.toLowerCase().replace(/\s+/g, '-');
      const routineDir = join(this.rootPath, 'routines', slug);
      await fs.mkdir(routineDir, { recursive: true });
      await fs.writeFile(join(routineDir, 'routine.yaml'), proposal.proposed_content, 'utf8');

      const readmePath = join(routineDir, 'README.md');
      try {
        await fs.writeFile(readmePath, `# ${proposal.proposed_name}\n\nGenerated via Curation Proposal.`, { flag: 'wx' });
      } catch {}
    }

    proposal.status = 'applied';
    proposal.applied_at = new Date().toISOString();

    const filePath = join(this.proposalsDir, `${id}.yaml`);
    await fs.writeFile(filePath, stringify(proposal), 'utf8');

    return proposal;
  }
}
