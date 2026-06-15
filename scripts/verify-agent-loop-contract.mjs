#!/usr/bin/env bun
/**
 * Verifies agent-loop docs encode per-ticket merge/review gates (Fixes #345).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const checks = [
  {
    file: "docs/agent-goals/README.md",
    includes: [
      "per ticket",
      "lane continues",
      "Awaiting review / merge",
      "Active next work",
      "one_active_task",
    ],
  },
  {
    file: "docs/agent-prompts/composer-implementer.md",
    includes: [
      "only that issue",
      "file-disjoint",
      "Awaiting review / merge",
      "Active next work",
      "Otherwise keep looping",
    ],
  },
  {
    file: "docs/goals/github-ready-loop/goal.md",
    includes: ["per-ticket", "file-disjoint", "Fixes #345"],
  },
  {
    file: "docs/goals/github-ready-loop/state.yaml",
    includes: [
      "merge_review_gates_are_per_ticket",
      "lane_continues_at_merge_gate",
      "one_active_task",
      "no_safe_work",
      "handoff_sections",
    ],
  },
];

let fail = 0;

for (const { file, includes } of checks) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`FAIL missing ${file}`);
    fail += 1;
    continue;
  }
  const text = fs.readFileSync(full, "utf8").toLowerCase();
  for (const needle of includes) {
    if (!text.includes(needle.toLowerCase())) {
      console.error(`FAIL ${file} missing: ${needle}`);
      fail += 1;
    }
  }
}

if (fail === 0) {
  console.log("PASS verify:agent-loop — per-ticket gate contract present");
  process.exit(0);
}

process.exit(1);
