import { describe, expect, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AutonomyStore } from './autonomy-store';
import { KnowledgeStore } from './knowledge-store';
import { ReceiptWriter } from './receipt-writer';
import { RunStore } from './run-store';
import { TicketOrchestrator } from './ticket-orchestrator';
import { TicketStore } from './ticket-store';
import { WorkerStore } from './worker-store';

describe('TicketOrchestrator', () => {
  test('orchestrateExisting reuses compiled ticket without re-compile', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-orchestrator-test-'));
    try {
      execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
      execFileSync('git', ['config', 'user.email', 'otto@test.local'], { cwd: tmp, stdio: 'ignore' });
      execFileSync('git', ['config', 'user.name', 'Otto Test'], { cwd: tmp, stdio: 'ignore' });
      execFileSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: tmp, stdio: 'ignore' });

      const tickets = new TicketStore(join(tmp, 'tickets'), new ReceiptWriter(join(tmp, 'receipts')));
      const workers = new WorkerStore(join(tmp, 'workers'));
      const runs = new RunStore(join(tmp, 'runs'));
      const knowledge = new KnowledgeStore(join(tmp, 'knowledge'));
      const autonomy = new AutonomyStore(join(tmp, 'autonomy'), new ReceiptWriter(join(tmp, 'receipts')), knowledge);
      const orchestrator = new TicketOrchestrator(tickets, workers, runs, knowledge, autonomy, new ReceiptWriter(join(tmp, 'receipts')));

      const compiled = tickets.compile({
        slug: 'reuse-slice',
        objective: 'Prove orchestrateExisting does not overwrite ticket.yaml.',
      });
      const ticketPath = compiled.ticket.ticketPath;

      const first = orchestrator.orchestrateExisting(compiled.ticket.ticket_id, { repoRoot: tmp });
      expect(first.worker.ticket_id).toBe(compiled.ticket.ticket_id);
      expect(existsSync(ticketPath)).toBe(true);

      expect(() => orchestrator.orchestrateExisting(compiled.ticket.ticket_id, { repoRoot: tmp })).toThrow(/Active worker already exists/i);

      workers.updateStatus(first.worker.id, 'done');
      const second = orchestrator.orchestrateExisting(compiled.ticket.ticket_id, { repoRoot: tmp });
      expect(second.worker.id).not.toBe(first.worker.id);

      const afterCompile = tickets.get(compiled.ticket.ticket_id);
      expect(afterCompile?.objective).toBe(compiled.ticket.objective);
      expect(afterCompile?.status).toBe('active');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
