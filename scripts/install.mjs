#!/usr/bin/env bun
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const homeDir = os.homedir();
const extensionDir = path.join(homeDir, ".letta", "extensions");
const charterHome = process.env.CHARTER_HOME || path.join(homeDir, ".charter");

function say(message = "") {
  console.log(message);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeExistingFile(target) {
  if (!fs.existsSync(target)) {
    return;
  }

  let stat;
  try {
    stat = fs.lstatSync(target);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    throw new Error(`Refusing to replace directory: ${target}`);
  }

  fs.rmSync(target, { force: true });
}

function installExtensionFile(source, target) {
  ensureDir(path.dirname(target));
  removeExistingFile(target);

  try {
    fs.symlinkSync(source, target, "file");
    say(`linked  ${target} -> ${source}`);
  } catch (error) {
    if (!["EPERM", "EACCES", "EINVAL", "ENOTSUP"].includes(error.code)) {
      throw error;
    }

    fs.copyFileSync(source, target);
    say(`copied  ${target} <- ${source}`);
    say("        symlink unavailable; copied the extension file instead");
  }
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
  say(`copied  ${target}`);
}

say(`Otto / Charter repo: ${repoDir}`);

installExtensionFile(
  path.join(repoDir, "extension", "charter.ts"),
  path.join(extensionDir, "charter.ts"),
);
installExtensionFile(
  path.join(repoDir, "extension", "routine.ts"),
  path.join(extensionDir, "routine.ts"),
);

if (process.env.MEMORY_DIR) {
  copyFile(
    path.join(repoDir, "skill", "SKILL.md"),
    path.join(process.env.MEMORY_DIR, "skills", "charter", "SKILL.md"),
  );
  copyFile(
    path.join(repoDir, "skill", "routine", "SKILL.md"),
    path.join(process.env.MEMORY_DIR, "skills", "routine", "SKILL.md"),
  );
} else {
  say("WARN: MEMORY_DIR not set; skipping skill install.");
  say("      Copy skill/SKILL.md into your agent's skills/charter/ manually.");
  say("      Copy skill/routine/SKILL.md into your agent's skills/routine/ manually.");
}

const chartersDir = path.join(charterHome, "charters");
const activeCharter = path.join(chartersDir, "active.json");
ensureDir(chartersDir);

if (!fs.existsSync(activeCharter)) {
  fs.writeFileSync(activeCharter, '{ "slug": null }\n', "utf8");
  say(`wrote   ${activeCharter}`);
}

say(`runtime ${chartersDir}${path.sep}`);
say("Done. Run /reload in Letta Code.");
