/**
 * Review — prevent fake done by mapping claims to evidence.
 *
 * Model:       Claim -> AC map -> pass/fail recommendation -> Receipt
 * Substrate:   Files = truth; desktop PracticeRunner writes receipts under OTTO_HOME
 * Companion:   practice.yaml + templates/review.md
 *
 * Disable gates: REVIEW_GATES=off (none yet — parity with charter/routine extensions)
 */

type CommandResult =
  | { type: "prompt"; content: string; systemReminder?: boolean }
  | { type: "output"; output: string; success?: boolean }
  | { type: "handled" };

const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "~";
const RUNTIME_HOME = process.env.OTTO_HOME ?? process.env.VINNY_HOME ?? `${HOME}/.otto`;
const REVIEWS_DIR = `${RUNTIME_HOME}/reviews`;

const KNOWN_SUBCOMMANDS = new Set(["done", "risk", "help"]);

const SKILL_HINT =
  `Use the "review" skill workflow. Practice slug: review. ` +
  `Runtime root: ${REVIEWS_DIR}/. Desktop Run + Receipt path: practice.review.* ` +
  `under ${RUNTIME_HOME}/receipts/. The Practice recommends; the human (or Charter gate) decides. ` +
  `Done requires every acceptance criterion mapped to proof.`;

function usage(): string {
  return [
    "Review — prevent fake done",
    "",
    "Commands:",
    "  /review done   map acceptance criteria to evidence; pass/fail recommendation",
    "  /review risk   list remaining risks before handoff",
    "  /review help   show this help",
    "",
    `Runtime: ${REVIEWS_DIR}/`,
  ].join("\n");
}

function buildPrompt(sub: string, rest: string): CommandResult {
  const arg = rest.trim();
  switch (sub) {
    case "done":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/review done] ${SKILL_HINT}\n\n` +
          `Before marking done: list each acceptance criterion, map it to concrete ` +
          `evidence (receipt, test log, artifact), and output pass/fail per AC. If any AC ` +
          `lacks proof, recommend fail and block done. Write a review receipt or link to ` +
          `desktop practice run.\n` +
          (arg ? `\nContext: ${arg}` : ""),
      };
    case "risk":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/review risk] ${SKILL_HINT}\n\n` +
          `List remaining risks, cleanup notes, and unverified assumptions before handoff.` +
          (arg ? `\nContext: ${arg}` : ""),
      };
    case "help":
      return { type: "output", output: usage() };
    default:
      return { type: "output", output: usage() };
  }
}

function runReview(args: string): CommandResult {
  const trimmed = (args ?? "").trim();
  if (!trimmed) {
    return {
      type: "prompt",
      systemReminder: true,
      content: `[/review] ${SKILL_HINT}\n\nInvite: /review done before any done claim.`,
    };
  }
  const [first, ...restParts] = trimmed.split(/\s+/);
  const sub = first.toLowerCase();
  if (KNOWN_SUBCOMMANDS.has(sub)) return buildPrompt(sub, restParts.join(" "));
  return buildPrompt("done", trimmed);
}

export default function activate(letta: any) {
  const disposers: Array<() => void> = [];
  if (letta.capabilities?.commands) {
    disposers.push(
      letta.commands.register({
        id: "review",
        description: "Review: map done claims to evidence before completion",
        args: "[done|risk] [context]",
        run(ctx: { args: string }) {
          return runReview(ctx.args);
        },
      }),
    );
  }
  return () => {
    for (const dispose of disposers.reverse()) dispose();
  };
}
