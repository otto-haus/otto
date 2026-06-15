#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);

function takeFlag(name, fallback = undefined) {
  const index = argv.indexOf(name);
  if (index === -1) return fallback;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  argv.splice(index, 2);
  return value;
}

function hasFlag(name) {
  const index = argv.indexOf(name);
  if (index === -1) return false;
  argv.splice(index, 1);
  return true;
}

const source = path.resolve(takeFlag("--source", "planning/hq-tickets"));
const repo = takeFlag("--repo", "otto-haus/otto");
const outFlag = takeFlag("--out");
const date = takeFlag("--date", new Date().toISOString().slice(0, 10));
const write = hasFlag("--write");
const defaultOut = write
  ? "planning/hq-tickets/github-issue-migration.json"
  : path.join(os.tmpdir(), "otto-issue-migration-dry-run.json");

const options = {
  source,
  repo,
  out: path.resolve(outFlag ?? defaultOut),
  date,
  write,
  syncExisting: hasFlag("--sync-existing"),
  includeDone: hasFlag("--include-done"),
  includeZero: hasFlag("--include-zero"),
  limit: Number(takeFlag("--limit", "0")),
};

if (argv.length > 0) {
  throw new Error(`Unknown arguments: ${argv.join(" ")}`);
}

function runGh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function readExistingIssues(repo) {
  const raw = runGh([
    "issue",
    "list",
    "--repo",
    repo,
    "--state",
    "all",
    "--limit",
    "1000",
    "--json",
    "number,title,url,state,body",
  ]);
  return JSON.parse(raw);
}

function titleFromTicket(id, text, filePath) {
  const heading = text.match(/^#\s+(.*)$/m)?.[1]?.trim();
  if (heading) {
    return heading
      .replace(new RegExp(`^${id}\\s*[-:—]\\s*`), "")
      .replace(/^Ticket\s+\d+\s*[-:—]\s*/i, "")
      .trim();
  }

  return path
    .basename(filePath, ".md")
    .replace(/^\d{3}-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusFromPath(relativePath) {
  const firstPart = relativePath.split(path.sep)[0];
  switch (firstPart) {
    case "_Backlog":
      return "backlog";
    case "_InReview":
      return "in review";
    case "_Parked":
      return "parked";
    case "_Done":
      return "done";
    default:
      return "active";
  }
}

function metadata(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escaped}(?:\\s*:\\s*)?(?:\\*\\*)?\\s*(.+)$`, "im"));
  return match?.[1]?.trim();
}

function displaySource(ticket) {
  return path.basename(options.source) === "hq-tickets"
    ? `planning/hq-tickets/${ticket.relativePath}`
    : ticket.relativePath;
}

function displaySourceRoot() {
  return path.basename(options.source) === "hq-tickets"
    ? "planning/hq-tickets"
    : options.source;
}

function discoverTickets(source) {
  const entries = [];

  function walk(dir) {
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolutePath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (!dirent.isFile()) continue;
      if (!/^\d{3}-.+\.md$/.test(dirent.name)) continue;

      const id = dirent.name.slice(0, 3);
      const relativePath = path.relative(source, absolutePath);
      const status = statusFromPath(relativePath);

      if (id === "000" && !options.includeZero) continue;
      if (status === "done" && !options.includeDone) continue;

      const text = fs.readFileSync(absolutePath, "utf8");
      entries.push({
        id,
        absolutePath,
        relativePath: relativePath.split(path.sep).join("/"),
        status,
        title: titleFromTicket(id, text, absolutePath),
        owner: metadata(text, "Owner"),
        priority: metadata(text, "Priority"),
        dependsOn: metadata(text, "Depends on"),
        releaseBucket: metadata(text, "Release bucket"),
        unparkWhen: metadata(text, "Unpark when"),
        text,
      });
    }
  }

  walk(source);
  return entries.sort((a, b) => {
    const idCompare = Number(a.id) - Number(b.id);
    return idCompare || a.relativePath.localeCompare(b.relativePath);
  });
}

function buildIssueBody(ticket) {
  const lines = [
    "## Local ticket",
    "",
    `- Source: \`${displaySource(ticket)}\``,
    `- Local status: ${ticket.status}`,
    `- Migrated from: \`${displaySourceRoot()}\``,
    `- Migration date: ${options.date}`,
  ];

  if (ticket.owner) lines.push(`- Owner: ${ticket.owner}`);
  if (ticket.priority) lines.push(`- Priority: ${ticket.priority}`);
  if (ticket.dependsOn) lines.push(`- Depends on: ${ticket.dependsOn}`);
  if (ticket.releaseBucket) lines.push(`- Release bucket: ${ticket.releaseBucket}`);
  if (ticket.unparkWhen) lines.push(`- Unpark when: ${ticket.unparkWhen}`);

  lines.push(
    "",
    "## Migration note",
    "",
    "This issue was created from the local `planning/hq-tickets/` conveyor so otto can transition work tracking to GitHub Issues. Folder state remains the source of the original local status.",
    "",
    "## Original ticket",
    "",
    ticket.text.trim(),
    ""
  );

  const body = lines.join("\n");
  const maxBodyLength = 60000;
  if (body.length <= maxBodyLength) return body;

  return `${body.slice(0, maxBodyLength)}\n\n[Truncated during migration because the local ticket exceeded GitHub issue body size limits. See the source ticket for the full original text.]\n`;
}

function withBodyFile(body, callback) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "otto-ticket-"));
  const bodyPath = path.join(tmpDir, "body.md");
  fs.writeFileSync(bodyPath, body);

  try {
    return callback(bodyPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function createIssue(repo, title, body) {
  return withBodyFile(body, (bodyPath) =>
    runGh([
      "issue",
      "create",
      "--repo",
      repo,
      "--title",
      title,
      "--body-file",
      bodyPath,
    ])
  );
}

function updateIssueWithTitle(repo, number, title, body) {
  return withBodyFile(body, (bodyPath) =>
    runGh([
      "issue",
      "edit",
      "--repo",
      repo,
      String(number),
      "--title",
      title,
      "--body-file",
      bodyPath,
    ])
  );
}

function sourceFromIssue(issue) {
  const body = typeof issue.body === "string" ? issue.body : "";
  return body.match(/^- Source: `([^`]+)`/m)?.[1];
}

function duplicateTicketIds(tickets) {
  const byId = new Map();
  for (const ticket of tickets) {
    const existing = byId.get(ticket.id) ?? [];
    existing.push(displaySource(ticket));
    byId.set(ticket.id, existing);
  }

  return [...byId.entries()]
    .filter(([, sources]) => sources.length > 1)
    .map(([id, sources]) => ({ id, sources }));
}

let tickets = discoverTickets(options.source);
if (options.limit > 0) tickets = tickets.slice(0, options.limit);
const duplicateIds = duplicateTicketIds(tickets);
if (duplicateIds.length > 0) {
  const detail = duplicateIds
    .map((entry) => `${entry.id}: ${entry.sources.join(", ")}`)
    .join("; ");
  throw new Error(`Duplicate local ticket ids in migration set: ${detail}`);
}

const existing = readExistingIssues(options.repo);
const existingByTitle = new Map(existing.map((issue) => [issue.title, issue]));
const existingBySource = new Map();
for (const issue of existing) {
  const source = sourceFromIssue(issue);
  if (source && !existingBySource.has(source)) existingBySource.set(source, issue);
}

const results = [];
for (const ticket of tickets) {
  const title = `[otto-ticket:${ticket.id}] ${ticket.title}`;
  const source = displaySource(ticket);
  const duplicate = existingBySource.get(source) ?? existingByTitle.get(title);

  if (duplicate) {
    if (options.write && options.syncExisting) {
      updateIssueWithTitle(options.repo, duplicate.number, title, buildIssueBody(ticket));
      results.push({
        id: ticket.id,
        status: ticket.status,
        source,
        title,
        action: "updated",
        reason: existingBySource.get(source) ? "matching source already existed" : "matching title already existed",
        issueNumber: duplicate.number,
        issueUrl: duplicate.url,
      });
      process.stdout.write(`updated ${title} -> ${duplicate.url}\n`);
      continue;
    }

    results.push({
      id: ticket.id,
      status: ticket.status,
      source,
      title,
      action: "skipped",
      reason: existingBySource.get(source) ? "matching source already exists" : "matching title already exists",
      issueNumber: duplicate.number,
      issueUrl: duplicate.url,
    });
    continue;
  }

  if (!options.write) {
    results.push({
      id: ticket.id,
      status: ticket.status,
      source,
      title,
      action: "dry-run",
    });
    continue;
  }

  const url = createIssue(options.repo, title, buildIssueBody(ticket));
  const number = Number(url.match(/\/issues\/(\d+)$/)?.[1] ?? 0);
  existingByTitle.set(title, {
    number,
    title,
    url,
    state: "OPEN",
  });
  results.push({
    id: ticket.id,
    status: ticket.status,
    source,
    title,
    action: "created",
    issueNumber: number,
    issueUrl: url,
  });
  process.stdout.write(`created ${title} -> ${url}\n`);
}

const summary = results.reduce(
  (acc, result) => {
    acc[result.action] = (acc[result.action] ?? 0) + 1;
    acc.total += 1;
    return acc;
  },
  { total: 0 }
);

const output = {
  repo: options.repo,
  source: displaySourceRoot(),
  includeDone: options.includeDone,
  includeZero: options.includeZero,
  wroteIssues: options.write,
  syncedExisting: options.syncExisting,
  generatedAt: options.date,
  summary,
  issues: results,
};

fs.mkdirSync(path.dirname(options.out), { recursive: true });
fs.writeFileSync(options.out, `${JSON.stringify(output, null, 2)}\n`);

process.stdout.write(`summary ${JSON.stringify(summary)}\n`);
process.stdout.write(`wrote ${options.out}\n`);
