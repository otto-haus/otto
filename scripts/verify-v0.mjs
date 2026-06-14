#!/usr/bin/env bun
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bun = process.env.BUN_EXE || "bun";
const logDir = os.tmpdir();

let pass = 0;
let fail = 0;

function say(message = "") {
  console.log(message);
}

function logPath(name) {
  return path.join(logDir, name);
}

function writeLog(file, result) {
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  fs.writeFileSync(file, `${stdout}${stderr}`, "utf8");
}

function run(command, args, logName) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
    shell: false,
  });
  const file = logPath(logName);
  writeLog(file, result);
  return { file, result };
}

function ok(message) {
  pass += 1;
  say(`  PASS ${message}`);
}

function no(message) {
  fail += 1;
  say(`  FAIL ${message}`);
}

function latestCount(text, pattern) {
  const matches = [...text.matchAll(pattern)];
  return matches.length ? matches.at(-1)[1] : null;
}

function validateOldNames() {
  const allow = /^(bun\.lock|README\.md|RELEASE_CHECKLIST\.md|SPEC_COMPLIANCE\.md|CLAIMS_AUDIT\.md|SHIP_CHECKS\/|docs\/v1\/|docs\/otto-v01-status\.md|docs\/desktop-convergence\.md|planning\/|receipts\/otto-v01\/|scripts\/verify-v0\.(sh|mjs))/;
  const blocked = /Vinny OS|vinny-os|@vinny-os|TryVeto|cockpit/;
  const listed = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
    shell: false,
  });

  if (listed.status !== 0) {
    return ["git ls-files failed"];
  }

  const hits = [];
  for (const file of listed.stdout.split(/\r?\n/).filter(Boolean)) {
    if (allow.test(file)) continue;

    const fullPath = path.join(root, file);
    let bytes;
    try {
      bytes = fs.readFileSync(fullPath);
    } catch {
      continue;
    }
    if (bytes.includes(0)) continue;

    const text = bytes.toString("utf8");
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (blocked.test(lines[index])) {
        hits.push(`${file}:${index + 1}:${lines[index]}`);
      }
    }
  }

  return hits;
}

say("Otto v0.1 - verify:v0");
say(`repo: ${root}`);
say("----------------------------------------------");

say("[1/5] typecheck (core + practices)");
{
  const { file, result } = run(bun, ["run", "typecheck"], "otto_v0_typecheck.log");
  if (result.status === 0) ok("typecheck (core + practices)");
  else no(`typecheck (see ${file})`);
}

say("[2/5] unit tests (bun test)");
{
  const { file, result } = run(bun, ["test"], "otto_v0_test.log");
  if (result.status === 0) {
    const text = fs.readFileSync(file, "utf8");
    const passes = latestCount(text, /(\d+)\s+pass/g);
    const failures = latestCount(text, /(\d+)\s+fail/g);
    ok(passes && failures ? `${passes} pass / ${failures} fail` : "bun test");
  } else {
    no(`bun test (see ${file})`);
  }
}

say("[3/5] practice specs validate (otto-practices)");
{
  const { file, result } = run(bun, ["packages/practices/src/cli.ts"], "otto_v0_practices.log");
  if (result.status === 0) ok("5 practice specs validate");
  else no(`practice validation (see ${file})`);
}

say("[4/5] desktop typecheck");
{
  const { file, result } = run(
    bun,
    ["run", "--cwd", "apps/desktop", "typecheck"],
    "otto_v0_desktop.log",
  );
  if (result.status === 0) ok("desktop typecheck");
  else no(`desktop typecheck (see ${file})`);
}

say("[5/5] no accidental old names");
{
  const hits = validateOldNames();
  if (hits.length === 0) {
    ok("no old product names in product/code");
  } else {
    no("found old names:");
    for (const hit of hits) say(`      ${hit}`);
  }
}

say("----------------------------------------------");
say(`result: ${pass} passed, ${fail} failed`);
say("");
say("Shipped-status table is the source of truth in: RELEASE_CHECKLIST.md");
say("Nothing is Shipped until Sebastian reviews the demo and approves.");

process.exitCode = fail === 0 ? 0 : 1;
