import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';
import type { RunSummary, TicketCompileInput, TicketRecord, WorkerRecord } from '@otto-haus/core';
import { AutonomyStore } from './autonomy-store';
import { KnowledgeStore } from './knowledge-store';
import { ReceiptWriter, type WrittenReceipt } from './receipt-writer';
import { RunStore } from './run-store';
import { TicketStore } from './ticket-store';
import { WorkerStore } from './worker-store';

export interface OrchestrateTicketInput extends TicketCompileInput {
  repoRoot?: string;
}

export interface OrchestrateTicketResult {
  ticket: TicketRecord;
  worker: WorkerRecord;
  run: RunSummary;
  worktreePath: string;
  receipt: WrittenReceipt;
}

export class TicketOrchestrator {
  constructor(
    private tickets = new TicketStore(),
    private workers = new WorkerStore(),
    private runs = new RunStore(),
    private knowledge = new KnowledgeStore(),
    private autonomy = new AutonomyStore(),
    private receipts = new ReceiptWriter(),
  ) {}

  orchestrate(input: OrchestrateTicketInput): OrchestrateTicketResult {
    const policy = this.autonomy.getPolicy();
    if (policy.settings.worker_creation === 'disabled') {
      throw new Error('Worker creation is disabled in autonomy policy.');
    }
    if (policy.settings.worktree_creation === 'disabled') {
      throw new Error('Worktree creation is disabled in autonomy policy.');
    }

    const compiled = this.tickets.compile(input);
    const ticket = compiled.ticket;
    const repoRoot = resolveRepoRoot(input.repoRoot);
    const worktreeRel = ticket.worktree ?? `.letta/worktrees/${slugFromTicket(ticket)}`;
    const worktreePath = join(repoRoot, worktreeRel);
    const branch = ticket.branch ?? `feat/${slugFromTicket(ticket)}`;

    ensureWorktree(repoRoot, worktreePath, branch);

    const routing = this.knowledge.resolveModelForRole('ticket_worker');
    const modelHandle = routing ? `${routing.provider}/${routing.model}` : undefined;

    const worker = this.workers.spawn({
      ticket_id: ticket.ticket_id,
      model: modelHandle,
      worktree: worktreeRel,
      branch,
      summary: `Orchestrated worker for ${ticket.ticket_id}`,
    });

    const activeTicket = this.tickets.updateStatus(ticket.ticket_id, {
      status: 'active',
      owner: 'main_otto',
      model: modelHandle,
    });

    const run = this.runs.record({
      id: `run_${worker.id}`,
      practice: 'ticketcraft',
      charter: ticket.charter,
      status: 'running',
      summary: ticket.objective,
      worker_id: worker.id,
      ticket_id: ticket.ticket_id,
    });

    const receipt = this.receipts.write({
      status: 'success',
      subject: { type: 'task', id: ticket.ticket_id },
      action: 'ticket.orchestrate',
      input: {
        slug: slugFromTicket(ticket),
        objective: ticket.objective,
        worktree: worktreeRel,
        branch,
        model: modelHandle ?? null,
      },
      result: {
        summary: `Orchestrated ${ticket.ticket_id} in ${worktreeRel}`,
        data: {
          workerId: worker.id,
          runId: run.id,
          compileReceiptId: compiled.receipt.id,
        },
      },
      evidence: [
        { kind: 'file', ref: activeTicket.ticketPath, note: 'ticket.yaml' },
        { kind: 'file', ref: worktreePath, note: 'git worktree' },
      ],
    });

    this.workers.updateStatus(worker.id, 'running', receipt.id);

    return {
      ticket: activeTicket,
      worker,
      run,
      worktreePath,
      receipt,
    };
  }
}

function slugFromTicket(ticket: TicketRecord): string {
  const fromId = ticket.ticket_id.replace(/^ticket_/, '');
  if (fromId) return fromId;
  return ticket.ticketPath.split('/').slice(-2, -1)[0] ?? 'slice';
}

function resolveRepoRoot(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.OTTO_ROOT,
    resolve(process.cwd(), '../..'),
    resolve(process.cwd(), '../../..'),
    resolve(process.cwd(), '..'),
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (existsSync(join(candidate, '.git'))) return candidate;
  }

  return candidates[0] ?? process.cwd();
}

function ensureWorktree(repoRoot: string, worktreePath: string, branch: string): void {
  if (existsSync(worktreePath)) return;
  mkdirSync(join(worktreePath, '..'), { recursive: true });
  try {
    execFileSync('git', ['-C', repoRoot, 'worktree', 'add', '-B', branch, worktreePath, branch], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/already exists/i.test(message) || existsSync(worktreePath)) return;
    throw new Error(`git worktree add failed: ${message}`);
  }
}

export function patchTicketFile(ticketPath: string, patch: Record<string, unknown>): void {
  const raw = parse(readFileSync(ticketPath, 'utf8')) as Record<string, unknown>;
  const next = { ...raw, ...patch, updated_at: new Date().toISOString() };
  writeFileSync(ticketPath, stringify(next), 'utf8');
}
