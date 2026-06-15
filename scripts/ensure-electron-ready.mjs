#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const desktopDir = path.join(repoRoot, "apps", "desktop");
const requireFromDesktop = createRequire(path.join(desktopDir, "package.json"));
const electronPackagePath = requireFromDesktop.resolve("electron/package.json");
const electronDir = path.dirname(electronPackagePath);
const electronPackage = JSON.parse(readFileSync(electronPackagePath, "utf8"));
const distDir = path.join(electronDir, "dist");
const pathFile = path.join(electronDir, "path.txt");
const platformPath = getPlatformPath();

if (electronReady()) {
  finishReady();
  process.exit(0);
}

if (process.platform !== "darwin") {
  runElectronInstall();
  if (electronReady()) {
    finishReady();
    process.exit(0);
  }
  fail(
    "Electron is not ready. Try deleting node_modules and rerunning `bun install`, then retry `task electron`.",
  );
}

let zipPath = findElectronZip();
if (!zipPath) {
  runElectronInstall();
  zipPath = findElectronZip();
}

if (!zipPath) {
  fail(
    "Electron binary cache was not found. Rerun `bun install` with network access, then retry `task electron`.",
  );
}

repairMacElectronFromZip(zipPath);

if (!electronReady()) {
  fail(
    "Electron repair did not produce a runnable macOS bundle. Delete node_modules and rerun `bun install`.",
  );
}

console.log("repaired Electron macOS bundle from Bun cache");
finishReady();

function finishReady() {
  ensureNativeModulesForElectron();
  warnIfLettaCliWillBootstrap();
}

// Native modules (better-sqlite3, #754 durable outbox) must match Electron's NODE_MODULE_VERSION,
// not the system Node ABI that `bun install` builds against. Rebuild once per Electron version
// (stamp-guarded so normal dev launches stay fast). Dev-only: this never runs in CI install or
// the packaged build (electron-builder rebuilds the bundled copy itself).
function ensureNativeModulesForElectron() {
  const NATIVE_MODULES = ["better-sqlite3"];
  const electronVersion = electronPackage.version;
  const stampFile = path.join(desktopDir, "node_modules", ".otto-native-abi");
  try {
    if (existsSync(stampFile) && readFileSync(stampFile, "utf8").trim() === electronVersion) {
      return;
    }
  } catch {
    // fall through and rebuild
  }

  console.log(`rebuilding native modules for Electron ${electronVersion}: ${NATIVE_MODULES.join(", ")}`);
  const result = spawnSync(
    "bunx",
    [
      "electron-rebuild",
      "--version",
      electronVersion,
      "--module-dir",
      desktopDir,
      ...NATIVE_MODULES.flatMap((m) => ["--only", m]),
    ],
    { cwd: repoRoot, env: process.env, stdio: "inherit" },
  );

  if (result.status !== 0) {
    console.warn(
      "WARN: could not rebuild native modules for Electron. The durable chat outbox (better-sqlite3) may fail to load in dev; otto will degrade to an honest empty queue. Run `bunx electron-rebuild` manually if needed.",
    );
    return;
  }

  try {
    const tmp = `${stampFile}.${process.pid}.tmp`;
    writeFileSync(tmp, `${electronVersion}\n`);
    renameSync(tmp, stampFile);
  } catch {
    // Stamp is an optimization only; a missing stamp just means we rebuild again next launch.
  }
}

function electronReady() {
  try {
    const electronPath = requireFromDesktop("electron");
    if (!existsSync(electronPath)) {
      return false;
    }
    if (process.platform !== "darwin") {
      return true;
    }
    return macBundleReady();
  } catch {
    return false;
  }
}

function macBundleReady() {
  const frameworkLink = path.join(
    distDir,
    "Electron.app",
    "Contents",
    "Frameworks",
    "Electron Framework.framework",
    "Electron Framework",
  );
  const frameworkBinary = path.join(
    distDir,
    "Electron.app",
    "Contents",
    "Frameworks",
    "Electron Framework.framework",
    "Versions",
    "A",
    "Electron Framework",
  );
  try {
    return lstatSync(frameworkLink).isSymbolicLink() && existsSync(frameworkBinary);
  } catch {
    return false;
  }
}

function runElectronInstall() {
  const result = spawnSync(process.execPath, [path.join(electronDir, "install.js")], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    fail("Electron install script failed before `task electron` could start.");
  }
}

function repairMacElectronFromZip(zipPath) {
  const unzip = "/usr/bin/unzip";
  if (!existsSync(unzip)) {
    fail("macOS unzip was not found at /usr/bin/unzip; cannot repair Electron.");
  }

  rmSync(distDir, { force: true, recursive: true });
  rmSync(pathFile, { force: true });
  mkdirSync(distDir, { recursive: true });

  const result = spawnSync(unzip, ["-q", zipPath, "-d", distDir], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    fail("Could not unzip the cached Electron macOS bundle.");
  }

  writeFileSync(pathFile, platformPath);
}

function findElectronZip() {
  const roots = [
    process.env.electron_config_cache,
    process.env.npm_config_electron_cache,
    process.env.HOME ? path.join(process.env.HOME, "Library", "Caches", "electron") : undefined,
    process.env.XDG_CACHE_HOME ? path.join(process.env.XDG_CACHE_HOME, "electron") : undefined,
    path.join(os.homedir(), "Library", "Caches", "electron"),
  ].filter(Boolean);

  const preferredName = `electron-v${electronPackage.version}-${process.platform}-${process.arch}.zip`;
  const fallbackPrefix = `electron-v${electronPackage.version}-${process.platform}-`;

  for (const root of roots) {
    const matches = findFiles(root, (name) => name === preferredName);
    if (matches.length > 0) {
      return matches[0];
    }
  }
  for (const root of roots) {
    const matches = findFiles(
      root,
      (name) => name.startsWith(fallbackPrefix) && name.endsWith(".zip"),
    );
    if (matches.length > 0) {
      return matches[0];
    }
  }
  return undefined;
}

function findFiles(root, predicate) {
  if (!root || !existsSync(root)) {
    return [];
  }
  const results = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && predicate(entry.name)) {
        results.push(entryPath);
      } else if (!entry.isDirectory()) {
        try {
          if (statSync(entryPath).isFile() && predicate(entry.name)) {
            results.push(entryPath);
          }
        } catch {
          // Ignore unreadable cache entries.
        }
      }
    }
  }
  return results.sort();
}

function getPlatformPath() {
  switch (process.platform) {
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "linux":
    case "freebsd":
    case "openbsd":
      return "electron";
    case "win32":
      return "electron.exe";
    default:
      fail(`Electron builds are not available on platform: ${process.platform}`);
  }
}

function warnIfLettaCliWillBootstrap() {
  const explicit = process.env.LETTA_CLI_PATH;
  if (explicit) {
    if (existsSync(explicit)) {
      return;
    }
    console.warn(`LETTA_CLI_PATH is set but not found: ${explicit}`);
    console.warn("Install or repair Letta Desktop / Letta Code before expecting live chat to connect.");
    return;
  }

  const defaultMacCli =
    "/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js";
  if (process.platform === "darwin" && existsSync(defaultMacCli)) {
    console.warn("Letta Desktop CLI found; Otto disables Letta Code auto-update during dev launch.");
    return;
  }

  console.warn("Letta CLI was not found at the default macOS app path.");
  console.warn(
    "Otto will use the SDK-bundled Letta Code CLI with auto-update disabled; install Letta Desktop or set LETTA_CLI_PATH for the intended local runtime.",
  );
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
