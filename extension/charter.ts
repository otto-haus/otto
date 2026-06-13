/**
 * Charter — an open-source operating contract system for autonomous agents.
 * Turn intent into evidence-checked autonomous work.
 *
 * Object model:   Intent -> Charter -> State -> Receipt
 * Roles (loop):   Scout -> Judge -> Worker   (+ Auditor proves/rejects done,
 *                 Recorder keeps files current)
 * Substrate:      Files = truth, Memory = lessons, UI = workspace
 * Principle:      The human owns charter legitimacy; the agent owns operations.
 *
 * This single-file Letta Code extension provides:
 *
 *   1. Charter command  (/charter, compat alias /goal)
 *      A thin launcher that routes subcommands to the `charter` skill workflow.
 *
 *   2. Charter Gates  (permission overlay)
 *      One-way doors require human approval. Forces an approval prompt on
 *      irreversible / external / high-stakes tool calls even in unrestricted
 *      ("yolo") mode.
 *
 * Runtime (Files = truth) lives under: $CHARTER_HOME/charters/<slug>/
 *   (default $CHARTER_HOME = ~/.charter ; NOT inside Letta memory)
 *     charter.md     human contract
 *     charter.yaml   machine contract (source of truth for AC ids, gates, plan ids)
 *     state.yaml     mutable runtime state
 *     ledger.md      append-only history
 *     approvals/     first-class scoped, time-bound approval records
 *     notes/         detailed companion notes
 *     receipts/      proof artifacts
 *     traces/        raw tool/exec traces
 *
 * Disable gates (escape hatch):  CHARTER_GATES=off
 * Override runtime home:         CHARTER_HOME=/path
 */

type CommandResult =
  | { type: "prompt"; content: string; systemReminder?: boolean }
  | { type: "output"; output: string; success?: boolean }
  | { type: "handled" };

const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "~";
const CHARTER_HOME = process.env.CHARTER_HOME ?? `${HOME}/.charter`;
const CHARTERS_DIR = `${CHARTER_HOME}/charters`;

// ---------------------------------------------------------------------------
// Charter command
// ---------------------------------------------------------------------------

const KNOWN_SUBCOMMANDS = new Set([
  "propose", "compile", "approve", "status", "step", "update", "receipt",
  "block", "sharpen", "split", "resume", "audit", "complete", "cancel", "help",
]);

const SKILL_HINT =
  `Use the "charter" skill workflow. Object model: Intent -> Charter -> State -> Receipt. ` +
  `Runtime root (Files = truth, NOT Letta memory): ${CHARTERS_DIR}/<slug>/. ` +
  `Memory = lessons only. Doctrine: the human owns charter legitimacy; you (Otto) own ` +
  `operations. Contract is charter.yaml (machine source of truth) + charter.md (human ` +
  `render); keep them in sync (Recorder). Operational updates need no approval; ` +
  `legitimacy changes (objective, scope, acceptance criteria, gates, budget/time, ` +
  `one-way doors) require approval. Anti-fake-progress: no artifact, no progress.`;

function usage(): string {
  return [
    "Charter — an operating contract system for autonomous agents",
    "Turn intent into evidence-checked autonomous work.",
    "",
    "Primary commands:",
    "  /charter propose <intent>   compile messy intent into a proposed charter (Compiler)",
    "  /charter approve            activate the proposed charter",
    "  /charter status             re-entry: where / changed / blocked / next / approvals",
    "  /charter step               run ONE atomic loop: read state -> choose slice ->",
    "                              execute/block -> receipt -> update state",
    "  /charter receipt <ref>      attach a proof artifact to the active charter",
    "  /charter resume             re-enter and run steps until a gate or stop condition",
    "  /charter complete           Auditor: prove done AC-by-AC, then mark complete",
    "",
    "Also:",
    "  /charter <intent>           shorthand for propose",
    "  /charter update             record operational progress (no approval)",
    "  /charter block              record a blocker + one precise question + best-guess fix",
    "  /charter audit              run the Auditor without completing (AC-by-AC proof check)",
    "  /charter sharpen            tighten the charter (objective change needs approval)",
    "  /charter split              split into sub-charters",
    "  /charter cancel             cancel the active/proposed charter",
    "",
    "Compatibility: /goal maps to /charter. Prefer /charter in product language.",
    `Runtime: ${CHARTERS_DIR}/<slug>/   (Files = truth, Memory = lessons, UI = workspace)`,
  ].join("\n");
}

function buildPrompt(sub: string, rest: string): CommandResult {
  const intent = rest.trim();

  switch (sub) {
    case "propose":
    case "compile":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter ${sub}] ${SKILL_HINT}\n\n` +
          `Run the Charter Compiler: convert this Intent into a compact, structured ` +
          `PROPOSED Charter (do NOT activate yet). Use your superior local context ` +
          `(repo state, blockers, prior decisions, tool/runtime constraints) to draft a ` +
          `sharp contract the human might not write well themselves.\n\n` +
          `Intent: ${intent || "(none given — infer from recent conversation, then ask if unclear)"}\n\n` +
          `Draft both contract faces: charter.md (Objective, Why now, Scope, Non-goals, ` +
          `Acceptance criteria with stable ids AC1.., Approval gates, Plan with step ids, ` +
          `Stop conditions, First next action) and charter.yaml (machine mirror). Then ask ` +
          `exactly: "Approve this charter? (approve / edit / cancel)". Do not write to ` +
          `${CHARTERS_DIR}/ until approved.`,
      };

    case "approve":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter approve] ${SKILL_HINT}\n\n` +
          `Activate the most recently proposed charter. Create ${CHARTERS_DIR}/<slug>/ with ` +
          `charter.md, charter.yaml (status: active), state.yaml (current_phase: scout, ` +
          `plan, completed_steps, open_loops, blockers, approval_gates, receipt_paths, ` +
          `next_action, no_evidence_loops: 0), ledger.md (first entry = activation), and ` +
          `empty approvals/, receipts/, traces/, notes/ dirs. Point ${CHARTERS_DIR}/active.json ` +
          `at the slug. Confirm crisply; state the first next action. Then suggest /charter step.`,
      };

    case "status":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter status] ${SKILL_HINT}\n\n` +
          `Read the active charter (${CHARTERS_DIR}/active.json -> slug -> charter.yaml + ` +
          `state.yaml + ledger.md tail) and answer crisply, in order: Where are we? ` +
          `(phase + % plan done) / What changed? / What is blocked? / What is next? / ` +
          `What needs my approval? (open approval records + gates). If no active charter, ` +
          `say so and invite /charter <intent>.`,
      };

    case "step":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter step] ${SKILL_HINT}\n\n` +
          `Run ONE atomic Charter loop on the active charter:\n` +
          `1. Scout: read state.yaml + charter.yaml; pick the next thin slice toward an AC.\n` +
          `2. Judge: check acceptance criteria + Charter Gates before acting.\n` +
          `3. Worker: execute the slice — OR if a one-way door is required, write a scoped ` +
          `approval record under approvals/ and BLOCK with a precise question + best guess.\n` +
          `4. Receipt: write a proof artifact under receipts/ (Anti-fake-progress: NO ` +
          `artifact => NO progress).\n` +
          `5. Recorder: update state.yaml (completed_steps, plan, next_action, ` +
          `receipt_paths) and append ledger.md. Keep charter.md/charter.yaml in sync.\n\n` +
          `If this slice produced no artifact, increment state.yaml no_evidence_loops. ` +
          `If no_evidence_loops >= 2, STOP and force a block or sharpen instead of looping.` +
          (intent ? `\n\nFocus this step on: ${intent}` : ""),
      };

    case "update":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter update] ${SKILL_HINT}\n\n` +
          `Record an OPERATIONAL update (no approval needed): update state.yaml ` +
          `(completed_steps, plan, open_loops, blockers, next_action, receipt_paths, ` +
          `risk_notes) and append a timestamped ledger.md entry. ` +
          (intent ? `Update: ${intent}\n` : "") +
          `Do NOT change objective, scope, acceptance criteria, gates, or budget without ` +
          `explicit approval.`,
      };

    case "receipt":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter receipt] ${SKILL_HINT}\n\n` +
          `Attach a Receipt to the active charter: save/link the artifact under ` +
          `${CHARTERS_DIR}/<slug>/receipts/, map it to the AC id(s) it proves, add its path ` +
          `to state.yaml receipt_paths, and note it in ledger.md.\n\n` +
          `Receipt: ${intent || "(describe or path the proof artifact + which AC it proves)"}`,
      };

    case "block":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter block] ${SKILL_HINT}\n\n` +
          `Record a blocker (state.yaml blockers + ledger.md). If the blocker is a one-way ` +
          `door, also write a scoped approval record under approvals/<id>.yaml ` +
          `(requested_action, scope, evidence_required, expires_at, status: pending). Then ` +
          `ask ONE precise question with best-guess fix: "Blocked: <what>. Best guess: ` +
          `<fix>. Approve?".\n` +
          (intent ? `Blocker context: ${intent}` : ""),
      };

    case "audit":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter audit] ${SKILL_HINT}\n\n` +
          `Run the Auditor WITHOUT completing: for each acceptance criterion in ` +
          `charter.yaml, map it to a concrete receipt and mark pass/fail. Output the ` +
          `AC-by-AC table and the list of missing proofs. Do not change status.`,
      };

    case "sharpen":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter sharpen] ${SKILL_HINT}\n\n` +
          `Sharpen the active charter: tighten plan, acceptance clarity, stop conditions, ` +
          `next action. Clarifications are operational. If sharpening changes objective, ` +
          `scope, definition of done, or gates, treat it as a legitimacy change and ask ` +
          `for approval before applying. Keep charter.md and charter.yaml in sync.`,
      };

    case "split":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter split] ${SKILL_HINT}\n\n` +
          `Propose splitting the active charter into focused sub-charters (each with its ` +
          `own objective, acceptance criteria, and next action). Show the split and ask ` +
          `for approval before creating sub-charter directories.`,
      };

    case "resume":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter resume] ${SKILL_HINT}\n\n` +
          `Re-enter the active charter: give the crisp re-entry summary (where / changed / ` +
          `blocked / next / approvals), then run /charter step repeatedly (autonomously) ` +
          `until you hit a Charter Gate, a stop condition, or no_evidence_loops >= 2 — then ` +
          `ask. Each step must produce a receipt or a block.`,
      };

    case "complete":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter complete] ${SKILL_HINT}\n\n` +
          `Run the Auditor, then complete ONLY if: every acceptance criterion in ` +
          `charter.yaml maps to a real receipt (AC-by-AC proof), no required work remains, ` +
          `and a user-facing summary is prepared. If any AC lacks proof, do NOT complete — ` +
          `report the gap and keep status active. On success: set charter.yaml/state.yaml ` +
          `status=complete, append ledger.md, clear active.json, write a lessons note to ` +
          `memory, and output the completion summary: Done / Proof / Receipts / Remaining ` +
          `optional follow-ups.`,
      };

    case "cancel":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/charter cancel] ${SKILL_HINT}\n\n` +
          `Cancel the active/proposed charter: set status=cancelled with a reason, append ` +
          `ledger.md, clear active.json. Briefly confirm.` +
          (intent ? ` Reason: ${intent}` : ""),
      };

    case "help":
      return { type: "output", output: usage() };

    default:
      return { type: "output", output: usage() };
  }
}

function runCharter(args: string): CommandResult {
  const trimmed = (args ?? "").trim();
  if (!trimmed) {
    return {
      type: "prompt",
      systemReminder: true,
      content:
        `[/charter] ${SKILL_HINT}\n\n` +
        `If an active charter exists (${CHARTERS_DIR}/active.json), give the crisp ` +
        `re-entry status (where / changed / blocked / next / approvals). Otherwise show ` +
        `there is no active charter and invite: "/charter <intent>" to propose one.`,
    };
  }

  const [first, ...restParts] = trimmed.split(/\s+/);
  const firstLower = first.toLowerCase();

  if (KNOWN_SUBCOMMANDS.has(firstLower)) {
    return buildPrompt(firstLower, restParts.join(" "));
  }
  return buildPrompt("propose", trimmed);
}

// ---------------------------------------------------------------------------
// Charter Gates (permission overlay)
// ---------------------------------------------------------------------------

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

const BASH_GATES: { re: RegExp; cls: string }[] = [
  { re: /\bgit\s+push\b[^\n]*(--force|-f\b)/i, cls: "force-push" },
  { re: /\bgit\s+push\b/i, cls: "git push (external)" },
  { re: /\bgh\s+pr\s+merge\b/i, cls: "merge PR" },
  { re: /\bgh\s+repo\s+create\b/i, cls: "publish (new public repo)" },
  { re: /\bgh\s+(pr|issue|release|gist)\s+create\b/i, cls: "publish/post" },
  { re: /\b(npm|pnpm|yarn|bun)\s+publish\b/i, cls: "package publish" },
  { re: /\b(vercel|netlify|fly|flyctl|heroku|wrangler|eas|expo|railway|render|surge)\b[^|;&\n]*\bdeploy/i, cls: "deploy" },
  { re: /\bgit\s+reset\s+--hard\b/i, cls: "destructive git (reset --hard)" },
  { re: /\bgit\s+clean\s+-[a-z]*f/i, cls: "destructive git (clean -f)" },
  { re: /\bgit\s+branch\s+-D\b/i, cls: "destructive git (branch -D)" },
  { re: /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*|--force)\b/i, cls: "delete (rm -f/-rf)" },
  { re: /\b(drop\s+(database|table)|truncate\s+table)\b/i, cls: "destructive db" },
  { re: /\bkubectl\s+delete\b/i, cls: "destructive infra (kubectl delete)" },
  { re: /\bterraform\s+(apply|destroy)\b/i, cls: "infra apply/destroy" },
  { re: /\baws\b[^|;&\n]*\b(delete|terminate|rm|remove)\b/i, cls: "cloud delete" },
  { re: /\bgcloud\b[^|;&\n]*\bdelete\b/i, cls: "cloud delete" },
  { re: /\b(op)\s+(item\s+)?(create|edit|delete)\b/i, cls: "credential change (1password)" },
  { re: /\b(gog|gmail)\b[^|;&\n]*\bsend\b/i, cls: "send (email)" },
  { re: /\b(slack|agent-slack)\b[^|;&\n]*\bsend\b/i, cls: "send (slack)" },
  { re: /\bdiscord\b[^|;&\n]*\bsend\b/i, cls: "send (discord)" },
  { re: /\bimsg\b[^|;&\n]*\bsend\b/i, cls: "send (imessage)" },
  { re: /\bcurl\b[^|;&\n]*-X\s*['"]?(POST|PUT|DELETE|PATCH)/i, cls: "external write (http)" },
];

const SECRET_PATH = /(^|\/)(\.env(\.|$)|.*secret|.*credential|.*\.pem$|.*\.key$|id_rsa|.*\.p12$|service-account.*\.json)/i;

const TOOL_NAME_GATE = /(^|[_-])(delete|destroy|remove|drop|deploy|publish|send|post|email|merge|transfer|payment|charge|refund|wire)([_-]|$)/i;

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
      for (const g of BASH_GATES) if (g.re.test(cmd)) return g.cls;
    }
    return null;
  }

  if (tool === "write" || tool === "edit" || tool === "multiedit" || tool === "create") {
    const fp = firstString((args as any).file_path, (args as any).path, (args as any).filename);
    if (fp && SECRET_PATH.test(fp)) return "credential/secret file change";
    return null;
  }

  if (TOOL_NAME_GATE.test(tool)) return `external/irreversible tool (${event.toolName})`;

  return null;
}

// ---------------------------------------------------------------------------
// activate
// ---------------------------------------------------------------------------

export default function activate(letta: any) {
  const disposers: Array<() => void> = [];

  if (letta.capabilities?.commands) {
    disposers.push(
      letta.commands.register({
        id: "charter",
        description: "Charter: operating contract system — propose/own/step/prove long-running goals",
        args: "[subcommand] [text]",
        run(ctx: { args: string }) {
          return runCharter(ctx.args);
        },
      }),
    );

    // Compatibility alias: /goal -> /charter.
    disposers.push(
      letta.commands.register({
        id: "goal",
        description: "Compatibility alias for /charter",
        args: "[subcommand] [text]",
        run(ctx: { args: string }) {
          return runCharter(ctx.args);
        },
      }),
    );
  }

  if (letta.capabilities?.permissions && process.env.CHARTER_GATES !== "off") {
    disposers.push(
      letta.permissions.register({
        id: "charter-gates",
        description:
          "Charter Gates: one-way doors (deploy, publish, force-push, merge, delete/destroy, credential changes, send/post, external writes) require human approval.",
        check(event: PermissionEvent) {
          if (event.phase !== "approval") return;
          const cls = classify(event);
          if (!cls) return;
          return {
            decision: "ask",
            reason: `Charter Gate: '${cls}' is a one-way door / external side effect. Sebastian must approve (record it under approvals/).`,
          };
        },
      }),
    );
  }

  return () => {
    for (const dispose of disposers.reverse()) dispose();
  };
}
