import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const requiredScripts = ["docs:dev", "docs:validate", "docs:links"];
const pinPattern = /\bbunx\s+--bun\s+mint@(\d+\.\d+\.\d+)\b/;
const versions = new Set();
const failures = [];

for (const scriptName of requiredScripts) {
  const command = packageJson.scripts?.[scriptName];

  if (typeof command !== "string") {
    failures.push(`${scriptName} is missing from package.json scripts`);
    continue;
  }

  const match = command.match(pinPattern);
  if (!match) {
    failures.push(`${scriptName} must use bunx --bun mint@<exact-version>`);
    continue;
  }

  versions.add(match[1]);
}

if (versions.size > 1) {
  failures.push(
    `Mintlify scripts must use one version, found: ${[...versions].join(", ")}`,
  );
}

if (failures.length > 0) {
  console.error("Mintlify tool pin check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Mintlify scripts pinned to mint@${[...versions][0]}`);
