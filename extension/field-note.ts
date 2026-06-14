/**
 * Field Note — capture messy notes into durable structured state.
 *
 * Model:       Raw note -> verbatim quotes -> insights -> staged follow-up (never auto-send)
 * Substrate:   ${OTTO_HOME}/field-notes/ + receipts
 * Companion:   practice.yaml + templates/field-note.md
 */

type CommandResult =
  | { type: "prompt"; content: string; systemReminder?: boolean }
  | { type: "output"; output: string; success?: boolean }
  | { type: "handled" };

const HOME = process.env.HOME ?? process.env.USERPROFILE ?? "~";
const RUNTIME_HOME = process.env.OTTO_HOME ?? process.env.VINNY_HOME ?? `${HOME}/.otto`;
const FIELD_NOTES_DIR = `${RUNTIME_HOME}/field-notes`;

const KNOWN_SUBCOMMANDS = new Set(["capture", "help"]);

const SKILL_HINT =
  `Use the "field-note" skill workflow. Practice slug: field-note. ` +
  `Capture verbatim signal under ${FIELD_NOTES_DIR}/. Stage follow-ups; NEVER auto-send. ` +
  `Desktop Run + Receipt: practice.field_note.capture.`;

function usage(): string {
  return [
    "Field Note — capture durable customer/operator/research notes",
    "",
    "Commands:",
    "  /field-note capture <raw note>   capture who/where/when + verbatim quotes",
    "  /field-note help               show this help",
    "",
    `Runtime: ${FIELD_NOTES_DIR}/`,
  ].join("\n");
}

function buildPrompt(sub: string, rest: string): CommandResult {
  const arg = rest.trim();
  switch (sub) {
    case "capture":
      return {
        type: "prompt",
        systemReminder: true,
        content:
          `[/field-note capture] ${SKILL_HINT}\n\n` +
          `Capture the raw note as-is. Record who/where/when, preserve exact quotes ` +
          `(especially objections), extract insights and open questions, and stage ONE ` +
          `follow-up candidate — do not send. Write markdown under ${FIELD_NOTES_DIR}/ or ` +
          `use desktop practice run for receipt linkage.\n\n` +
          `Raw note: ${arg || "(none — ask for the note and source context)"}`,
      };
    case "help":
      return { type: "output", output: usage() };
    default:
      return { type: "output", output: usage() };
  }
}

function runFieldNote(args: string): CommandResult {
  const trimmed = (args ?? "").trim();
  if (!trimmed) {
    return {
      type: "prompt",
      systemReminder: true,
      content: `[/field-note] ${SKILL_HINT}\n\nInvite: /field-note capture <raw note>`,
    };
  }
  const [first, ...restParts] = trimmed.split(/\s+/);
  const sub = first.toLowerCase();
  if (KNOWN_SUBCOMMANDS.has(sub)) return buildPrompt(sub, restParts.join(" "));
  return buildPrompt("capture", trimmed);
}

export default function activate(letta: any) {
  const disposers: Array<() => void> = [];
  if (letta.capabilities?.commands) {
    disposers.push(
      letta.commands.register({
        id: "field-note",
        description: "Field Note: capture verbatim notes into durable state",
        args: "capture [raw note]",
        run(ctx: { args: string }) {
          return runFieldNote(ctx.args);
        },
      }),
    );
  }
  return () => {
    for (const dispose of disposers.reverse()) dispose();
  };
}
