import type { OttoBridge } from '../runtime';

export type TicketCommandReply = {
  handled: true;
  lines: string[];
};

export type ParsedTicketCommand =
  | { kind: 'compile'; slug: string; objective?: string }
  | { kind: 'orchestrate'; slug: string }
  | { kind: 'status-workers' };

const SLUG = String.raw`[\w.-]+`;

export function parseTicketCommand(text: string): ParsedTicketCommand | null {
  const trimmed = text.trim();
  const compile = trimmed.match(new RegExp(`^(?:/)?compile\\s+ticket\\s+(${SLUG})(?:\\s+(.+))?$`, 'i'));
  if (compile) {
    return {
      kind: 'compile',
      slug: compile[1],
      objective: compile[2]?.trim() || undefined,
    };
  }
  const orchestrate = trimmed.match(new RegExp(`^(?:/)?orchestrate\\s+ticket\\s+(${SLUG})$`, 'i'));
  if (orchestrate) {
    return { kind: 'orchestrate', slug: orchestrate[1] };
  }
  if (/^(?:\/)?status\s+workers$/i.test(trimmed)) {
    return { kind: 'status-workers' };
  }
  return null;
}

function ticketIdForSlug(slug: string): string {
  return slug.startsWith('ticket_') ? slug : `ticket_${slug}`;
}

export async function runTicketCommand(api: OttoBridge, text: string): Promise<TicketCommandReply | null> {
  const parsed = parseTicketCommand(text);
  if (!parsed) return null;

  if (parsed.kind === 'status-workers') {
    const workers = await api.workers.list();
    if (!workers.workers.length) {
      return { handled: true, lines: ['No workers recorded yet.'] };
    }
    const lines = workers.workers.map((w) =>
      `${w.id} · ${w.status} · ticket ${w.ticket_id}${w.worktree ? ` · ${w.worktree}` : ''}`,
    );
    return { handled: true, lines: ['Worker status:', ...lines] };
  }

  if (parsed.kind === 'compile') {
    const ticketId = ticketIdForSlug(parsed.slug);
    const existing = await api.tickets.get(ticketId);
    if (existing && !parsed.objective) {
      return {
        handled: true,
        lines: [
          `${ticketId} already exists (${existing.status}).`,
          `Objective: ${existing.objective}`,
          `Use \`orchestrate ticket ${parsed.slug}\` to spawn a worker, or \`compile ticket ${parsed.slug} <new objective>\` to overwrite via re-compile.`,
        ],
      };
    }
    const objective = parsed.objective ?? existing?.objective;
    if (!objective?.trim()) {
      return {
        handled: true,
        lines: [`compile ticket ${parsed.slug} needs an objective. Example: compile ticket ${parsed.slug} Fix permission modal timeout`],
      };
    }
    const result = await api.tickets.compile({ slug: parsed.slug, objective: objective.trim() });
    return {
      handled: true,
      lines: [
        `Compiled ${result.ticket.ticket_id}.`,
        `Receipt: ${result.receipt.id}`,
        `Packet: ${result.ticket.packetPath ?? 'worker-packet.md'}`,
      ],
    };
  }

  const ticketId = ticketIdForSlug(parsed.slug);
  const ticket = await api.tickets.get(ticketId);
  if (!ticket) {
    return {
      handled: true,
      lines: [`Ticket ${ticketId} not found. Compile first: compile ticket ${parsed.slug} <objective>`],
    };
  }

  const gate = await api.autonomy.evaluateAction({
    action: `orchestrate ${ticketId}`,
    context: 'chat-ticket-command',
  });
  if (!gate.evaluation.allowed_without_approval) {
    return {
      handled: true,
      lines: [
        `Orchestration blocked by autonomy policy (${gate.evaluation.zone}).`,
        gate.evaluation.reason,
        `Receipt: ${gate.receipt.id}`,
      ],
    };
  }

  const result = await api.tickets.orchestrateExisting(ticketId);
  return {
    handled: true,
    lines: [
      `Orchestrated ${result.ticket.ticket_id}.`,
      `Worker: ${result.worker.id} (${result.worker.status})`,
      `Run: ${result.run.id}`,
      `Worktree: ${result.worktreePath}`,
      `Receipt: ${result.receipt.id}`,
    ],
  };
}
