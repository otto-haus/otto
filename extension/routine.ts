/**
 * Routine — repeated bundles of Practices for Otto.
 *
 * Model:      Routine -> [Practice...] -> [Run...] -> Receipts
 * Substrate:  Files = truth, Letta cron = execution backend, UI = workspace
 * Contract:   docs/architecture/v0-contract.md + packages/core/src/types.ts
 * Autonomy:   proposals + low-risk one-off trials can be autonomous.
 *             RECURRING ACTIVATION belongs to the human — attention is a one-way door.
 *
 * This single-file Letta Code extension provides:
 *   1. /routine command — a thin launcher for the `routine` skill workflow.
 *   2. routine-gates — approval before enabling recurring schedules.
 *
 * Disable gates: ROUTINE_GATES=off
 * Runtime home:  ROUTINE_HOME, else OTTO_HOME, else VINNY_HOME (back-compat); default ~/.otto
 */

type CommandResult =
  | { type: "prompt"; content: string; systemReminder?: boolean }
  | { type: "output"; output: string; success?: boolean }
  | { type: "handled" };

const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "~";
const RUNTIME_HOME = process.env.ROUTINE_HOME ?? process.env.OTTO_HOME ?? process.env.VINNY_HOME ?? `${HOME}/.otto`;
const ROUTINES_DIR = `${RUNTIME_HOME}/routines`;
const RUNS_DIR = `${RUNTIME_HOME}/runs`;
const RECEIPTS_DIR = `${RUNTIME_HOME}/receipts`;

const KNOWN_SUBCOMMANDS = new Set([
  "list", "show", "run", "pause", "resume", "propose", "mine", "receipt", "help",
]);

const SKILL_HINT =
  `Use the "routine" skill workflow. Contract: Routine = repeated bundle of ` +
  `canonical Practices (charter, decision, review, field-note, follow-up). ` +
  `Runtime root (Files = truth, NOT Letta memory): ${RUNTIME_HOME}/. ` +
  `Routine specs live in ${ROUTINES_DIR}/<slug>/routine.yaml and conform to ` +
  `packages/core/src/types.ts. Runs and Receipts live in ${RUNS_DIR}/ and ` +
  `${RECEIPTS_DIR}/. Recurring activation is a standing claim on attention and ` +
  `requires human approval.`;

function usage(): string {
  return [
    "Routine — repeated bundles of Practices",
    "",
    "Commands:",
    "  /routine list              list Routines and attention costs",
    "  /routine show <slug>       show a Routine spec + recent Runs",
    "  /routine run <slug>        run one low-risk trial now (does not schedule)",
    "  /routine pause <slug>      pause a Routine and disable backend schedule",
    "  /routine resume <slug>     ask to activate recurring schedule",
    "  /routine propose <intent>  draft a Routine proposal/spec",
    "  /routine mine              mine repeated bundles of Practices",
    "  /routine receipt <run-id>  render a Run receipt",
    "",
    `Runtime: ${RUNTIME_HOME}/ (Files = truth, Memory = lessons, UI = workspace)`,
  ].join("\n");
}

function buildPrompt(sub: string, rest: string): CommandResult {
  const arg = rest.trim();

  switch (sub) {
    case "list":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/routine list] ${SKILL_HINT}\n\n` +
          `List every Routine under ${ROUTINES_DIR}/. For each, read routine.yaml and ` +
          `show slug, status, schedule, attention_cost, requires_approval_to_activate, ` +
          `last Run if available, and whether activation is approved. Flag any recurring ` +
          `Routine without approval as blocked, not active.`,
      };

    case "show":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/routine show] ${SKILL_HINT}\n\n` +
          `Show Routine "${arg || "(slug required)"}": render its Routine fields ` +
          `(id, slug, name, status, summary, steps, schedule, attention_cost, ` +
          `requires_approval_to_activate, created_at), then list recent Runs and Receipts ` +
          `if present. Verify every step references a canonical Practice slug.`,
      };

    case "run":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/routine run] ${SKILL_HINT}\n\n` +
          `Execute exactly one on-demand Run for Routine "${arg || "(slug required)"}". ` +
          `Do NOT schedule anything. Read routine.yaml, run its Practice steps in order, ` +
          `honor all Practice gates, label missing data, and produce a Run record plus at ` +
          `least one Receipt or a block. If a step needs external side effects, new ` +
          `permissions, or a one-way door, block and ask.`,
      };

    case "pause":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/routine pause] ${SKILL_HINT}\n\n` +
          `Pause Routine "${arg || "(slug required)"}": set status: paused in ` +
          `routine.yaml and disable the backend schedule. Pausing is reversible. Confirm ` +
          `what changed and how to resume.`,
      };

    case "resume":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/routine resume] ${SKILL_HINT}\n\n` +
          `Resume / activate recurring Routine "${arg || "(slug required)"}". This is ` +
          `recurring activation, a standing claim on attention. Do NOT enable the schedule ` +
          `autonomously. First show the Routine spec and attention cost, then ask exactly: ` +
          `"Activate '${arg || "<slug>"}' on its recurring schedule? (approve / trial-once / cancel)". ` +
          `Only after approval set status: active and register the schedule.`,
      };

    case "propose":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/routine propose] ${SKILL_HINT}\n\n` +
          `Compose a Routine from this intent: "${arg || "(none — infer from recent work, then ask if unclear)"}". ` +
          `Use only canonical Practice slugs in steps[]. Draft routines/<slug>/routine.yaml ` +
          `with status: proposed, a short README, and a proposal using templates/routine-proposal.md. ` +
          `You may offer one low-risk trial, but you may not activate a recurring schedule.`,
      };

    case "mine":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/routine mine] ${SKILL_HINT}\n\n` +
          `Mine Routines from repeated work: inspect recent Runs, receipts, and conversation ` +
          `for canonical Practices that keep firing together. Draft proposals only; activate ` +
          `nothing. Include attention cost and why a one-off trial is low-risk.`,
      };

    case "receipt":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/routine receipt] ${SKILL_HINT}\n\n` +
          `Render the Receipt for Run "${arg || "(run-id required)"}". If a completed Run ` +
          `is missing a Receipt, reconstruct it from the Run record and artifacts, then write it.`,
      };

    case "help":
      return { type: "output", output: usage() };

    default:
      return { type: "output", output: usage() };
  }
}

function runRoutine(args: string): CommandResult {
  const trimmed = (args ?? "").trim();
  if (!trimmed) {
    return {
      type: "prompt",
      systemReminder: true,
      content:
        `[/routine] ${SKILL_HINT}\n\n` +
        `Give the workspace view: list Routines under ${ROUTINES_DIR}/ with status, ` +
        `schedule, attention cost, last Run, and blocked approvals. If none exist, invite ` +
        `"/routine propose <intent>".`,
    };
  }

  const [first, ...restParts] = trimmed.split(/\s+/);
  const firstLower = first.toLowerCase();

  if (KNOWN_SUBCOMMANDS.has(firstLower)) {
    return buildPrompt(firstLower, restParts.join(" "));
  }
  return buildPrompt("show", trimmed);
}

type PermissionEvent = {
  agentId: string | null;
  conversationId: string | null;
  toolCallId: string | null;
  toolName: string;
  args: Record<string, unknown>;
  cwd: string;
  workingDirectory: string;
  permissionMode: string | null;
  phase: "approval" | "execution";
};

const RECURRING_ACTIVATION_GATES: { re: RegExp; cls: string }[] = [
  { re: /\bletta\s+cron\s+(add|create|enable)\b/i, cls: "recurring activation (letta cron)" },
  { re: /\bcrontab\b[^|;&\n]*(-e|<|install)/i, cls: "recurring activation (crontab)" },
  { re: /\blaunchctl\s+(load|bootstrap|enable)\b/i, cls: "recurring activation (launchd)" },
  { re: /\bsystemctl\s+(--user\s+)?(enable|start)\b[^|;&\n]*\.timer/i, cls: "recurring activation (systemd timer)" },
];

function firstString(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === "string" && v) return v;
  return "";
}

function classify(event: PermissionEvent): string | null {
  const tool = (event.toolName ?? "").toLowerCase();
  const args = event.args ?? {};
  if (tool === "bash" || tool === "shell" || tool === "run" || tool === "exec") {
    const cmd = firstString((args as any).command, (args as any).cmd, (args as any).script);
    if (cmd) {
      for (const gate of RECURRING_ACTIVATION_GATES) if (gate.re.test(cmd)) return gate.cls;
    }
  }
  return null;
}

export default function activate(letta: any) {
  const disposers: Array<() => void> = [];

  if (letta.capabilities?.commands) {
    disposers.push(
      letta.commands.register({
        id: "routine",
        description: "Routine: repeated bundles of Practices; recurring activation is human-gated",
        args: "[subcommand] [text]",
        run(ctx: { args: string }) {
          return runRoutine(ctx.args);
        },
      }),
    );
  }

  if (letta.capabilities?.permissions && process.env.ROUTINE_GATES !== "off") {
    disposers.push(
      letta.permissions.register({
        id: "routine-gates",
        description:
          "Routine Gates: recurring activation (letta cron / crontab / launchd / systemd timer) is an attention one-way door and requires human approval.",
        check(event: PermissionEvent) {
          if (event.phase !== "approval") return;
          const cls = classify(event);
          if (!cls) return;
          return {
            decision: "ask",
            reason: `Routine Gate: '${cls}' is a standing claim on attention. Recurring activation requires human approval; propose or run a one-off trial instead.`,
          };
        },
      }),
    );
  }

  return () => {
    for (const dispose of disposers.reverse()) dispose();
  };
}
