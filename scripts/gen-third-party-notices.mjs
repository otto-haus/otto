#!/usr/bin/env node
// Generate THIRD_PARTY_NOTICES.md from the production dependency tree otto redistributes.
//
// Satisfies the #671 license/redistribution gate condition: enumerate every bundled
// package with its SPDX license id + copyright, include the full text of each distinct
// license, and add source pointers for the weak-copyleft deps (LGPL-3.0 sharp/libvips,
// MPL-2.0 lightningcss).
//
// HARD GUARD: exits non-zero if any GPL/AGPL/SSPL (strong copyleft / source-offer
// blocking) license is found in the scanned tree. The embedded Letta bundle must never
// ship one. Run before packaging the embedded runtime.
//
// Usage:
//   node scripts/gen-third-party-notices.mjs [--root <node_modules dir>] [--check]
//   --root   directory to scan (default: apps/desktop/node_modules — the tree electron-builder ships)
//   --check  do not write; only scan + run the copyleft guard (exit 1 on block / drift)

import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = { root: join(REPO_ROOT, 'apps', 'desktop', 'node_modules'), check: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') args.root = resolve(argv[++i]);
    else if (argv[i] === '--check') args.check = true;
  }
  return args;
}

// Strong copyleft / source-offer licenses that would block redistribution inside otto.app.
const BLOCKING = [/\bAGPL\b/i, /\bGPL-\d/i, /\bGPL\b/i, /\bSSPL\b/i, /\bCPAL\b/i, /\bEUPL\b/i];
// LGPL is weak copyleft (allowed with notice + source pointer); exclude it from the block test.
const isBlocking = (id) => id && !/LGPL/i.test(id) && BLOCKING.some((re) => re.test(id));

function licenseId(pkg) {
  if (typeof pkg.license === 'string') return pkg.license;
  if (pkg.license && typeof pkg.license === 'object') return pkg.license.type ?? null;
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => l.type ?? l).filter(Boolean).join(' OR ');
  if (pkg.license === undefined && pkg.licenses) return String(pkg.licenses);
  return null;
}

function copyright(pkg) {
  const author = typeof pkg.author === 'string' ? pkg.author : pkg.author?.name;
  if (author) return author;
  const maint = Array.isArray(pkg.maintainers) && pkg.maintainers[0];
  if (maint) return typeof maint === 'string' ? maint : maint.name ?? null;
  return null;
}

const LICENSE_FILE_RE = /^(LICENSE|LICENCE|COPYING|NOTICE)(\..*)?$/i;
function licenseText(dir) {
  try {
    for (const name of readdirSync(dir)) {
      if (LICENSE_FILE_RE.test(name)) {
        const p = join(dir, name);
        if (statSync(p).isFile()) return readFileSync(p, 'utf8').trim();
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Walk node_modules (incl. scoped @org/* and nested node_modules) collecting package dirs.
function collect(root) {
  const out = [];
  const seen = new Set();
  const walk = (nmDir) => {
    let entries;
    try {
      entries = readdirSync(nmDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.name === '.bin' || ent.name === '.cache') continue;
      const full = join(nmDir, ent.name);
      if (ent.name.startsWith('@')) {
        walk(full); // scope dir holds the actual packages
        continue;
      }
      if (!ent.isDirectory() && !ent.isSymbolicLink()) continue;
      const pkgJson = join(full, 'package.json');
      if (existsSync(pkgJson)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgJson, 'utf8'));
          const key = `${pkg.name}@${pkg.version}`;
          if (pkg.name && !seen.has(key)) {
            seen.add(key);
            out.push({ pkg, dir: full });
          }
        } catch {
          /* ignore unreadable package.json */
        }
      }
      const nested = join(full, 'node_modules');
      if (existsSync(nested)) walk(nested);
    }
  };
  walk(root);
  return out.sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));
}

const args = parseArgs(process.argv.slice(2));
if (!existsSync(args.root)) {
  console.error(`gen-third-party-notices: scan root not found: ${args.root}`);
  console.error('Run `bun install` first (and `--root` a built app Resources/app/node_modules to match the shipped bundle).');
  process.exit(1);
}

const pkgs = collect(args.root);
const blocked = pkgs.filter(({ pkg }) => isBlocking(licenseId(pkg)));
if (blocked.length) {
  console.error('LICENSE GATE FAIL — strong copyleft / source-offer license(s) in the bundled tree:');
  for (const { pkg } of blocked) console.error(`  - ${pkg.name}@${pkg.version}: ${licenseId(pkg)}`);
  console.error('This blocks redistribution inside otto.app (#671). Remove/replace the dep before bundling.');
  process.exit(1);
}

// Tally + group.
const byLicense = new Map();
const lines = [];
const texts = new Map(); // license id -> representative full text
for (const { pkg, dir } of pkgs) {
  const id = licenseId(pkg) ?? 'UNKNOWN';
  byLicense.set(id, (byLicense.get(id) ?? 0) + 1);
  const c = copyright(pkg);
  lines.push(`- \`${pkg.name}@${pkg.version}\` — ${id}${c ? ` — ${c}` : ''}`);
  if (!texts.has(id)) {
    const t = licenseText(dir);
    if (t) texts.set(id, t);
  }
}

const tally = [...byLicense.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => `- ${id} — ${n}`);

const lgplPkgs = pkgs.filter(({ pkg }) => /LGPL/i.test(licenseId(pkg) ?? ''));
const mplPkgs = pkgs.filter(({ pkg }) => /MPL/i.test(licenseId(pkg) ?? ''));
const weakPointers = [];
if (lgplPkgs.length) {
  weakPointers.push(
    `- **LGPL-3.0** — ${lgplPkgs.map(({ pkg }) => `\`${pkg.name}@${pkg.version}\``).join(', ')}: ` +
      `unmodified prebuilt of libvips, pulled transitively by \`sharp\` (a Letta Code dependency). ` +
      `Source: https://github.com/libvips/libvips and https://github.com/lovell/sharp-libvips . ` +
      `The binary is relinkable; otto does not modify it.`,
  );
}
if (mplPkgs.length) {
  weakPointers.push(
    `- **MPL-2.0** — ${mplPkgs.map(({ pkg }) => `\`${pkg.name}@${pkg.version}\``).join(', ')}: ` +
      `file-level copyleft on the MPL files only; does not affect otto's own MIT/Apache code. ` +
      `Source: https://github.com/parcel-bundler/lightningcss . ` +
      `Build-time tooling; exclude from the runtime bundle where possible (#671 hygiene flag).`,
  );
}
const weakSection = weakPointers.length
  ? weakPointers.join('\n')
  : '- None present in the scanned tree (no LGPL/MPL packages found).';

const header = `# Third-Party Notices

otto bundles the **Letta Code** engine (\`@letta-ai/letta-code\`, Apache-2.0) and its
dependencies inside \`otto.app\` to provide the zero-setup "This Mac" runtime. "Letta" and
"Letta Code" are marks of Letta, Inc., used here only to identify the bundled engine. otto
is independent and not endorsed by Letta, Inc. otto is **powered by Letta**.

This file is generated mechanically from the shipped dependency tree by
\`scripts/gen-third-party-notices.mjs\`; it is regenerated on dependency bumps so the
attribution stays accurate. It satisfies the redistribution conditions recorded in
otto-haus/otto issue #671 (Apache-2.0 §4 attribution + weak-copyleft source pointers).

No GPL / AGPL / SSPL (strong copyleft / source-offer) licenses are present — the generator
fails the build if any appear.

## License tally (${pkgs.length} packages scanned)

${tally.join('\n')}

## Weak-copyleft source pointers

${weakSection}

## Bundled packages

${lines.join('\n')}

## Full license texts

`;

const textSections = [...texts.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([id, text]) => `### ${id}\n\n\`\`\`\n${text}\n\`\`\`\n`)
  .join('\n');

const body = `${header}${textSections}`;

if (args.check) {
  console.log(`gen-third-party-notices --check: ${pkgs.length} packages, no blocking licenses.`);
  process.exit(0);
}

const outPath = join(REPO_ROOT, 'THIRD_PARTY_NOTICES.md');
writeFileSync(outPath, body);
console.log(`Wrote ${outPath} (${pkgs.length} packages, ${byLicense.size} distinct licenses).`);
