import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
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
    const compiled = this.tickets.compile(input);
    return this.orchestrateExisting(compiled.ticket.ticket_id, {
      repoRoot: input.repoRoot,
      compileReceiptId: compiled.receipt.id,
    });
  }

  orchestrateExisting(
    ticketId: string,
    options: { repoRoot?: string; compileReceiptId?: string } = {},
  ): OrchestrateTicketResult {
    const policy = this.autonomy.getPolicy();
    if (policy.settings.worker_creation === 'disabled') {
      throw new Error('Worker creation is disabled in autonomy policy.');
    }
    if (policy.settings.worktree_creation === 'disabled') {
      throw new Error('Worktree creation is disabled in autonomy policy.');
    }

    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);

    const activeWorker = findActiveWorker(this.workers, ticket.ticket_id);
    if (activeWorker) {
      throw new Error(`Active worker already exists for ${ticket.ticket_id}: ${activeWorker.id} (${activeWorker.status}).`);
    }

    const repoRoot = resolveRepoRoot(options.repoRoot);
    const worktreeRel = ticket.worktree ?? `.letta/worktrees/${slugFromTicket(ticket)}`;
    const worktreePath = resolveWorktreePath(repoRoot, worktreeRel);
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
        compileReceiptId: options.compileReceiptId ?? null,
      },
      result: {
        summary: `Orchestrated ${ticket.ticket_id} in ${worktreeRel}`,
        data: {
          workerId: worker.id,
          runId: run.id,
          compileReceiptId: options.compileReceiptId ?? null,
        },
      },
      evidence: [
        { kind: 'file', ref: activeTicket.ticketPath, note: 'ticket.yaml' },
        { kind: 'file', ref: worktreePath, note: 'git worktree' },
      ],
      blocker: null,
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

const ACTIVE_WORKER_STATUSES = new Set(['running', 'blocked', 'review']);

function findActiveWorker(workers: WorkerStore, ticketId: string) {
  return workers.list().workers.find((w) => w.ticket_id === ticketId && ACTIVE_WORKER_STATUSES.has(w.status)) ?? null;
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

function resolveWorktreePath(repoRoot: string, worktreeRel: string): string {
  const root = resolve(repoRoot);
  const worktreePath = resolve(root, worktreeRel);
  const rel = relative(root, worktreePath);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`Invalid worktree path outside repo root: ${worktreeRel}`);
  }
  return worktreePath;
}

function ensureWorktree(repoRoot: string, worktreePath: string, branch: string): void {
  if (existsSync(worktreePath)) return;
  mkdirSync(join(worktreePath, '..'), { recursive: true });
  try {
    execFileSync('git', ['-C', repoRoot, 'worktree', 'add', '-B', branch, worktreePath, 'HEAD'], {
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
