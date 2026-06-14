import { readFileSync } from "node:fs";

const bunVersion = readFileSync(
  new URL("../.bun-version", import.meta.url),
  "utf8",
).trim();
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const expectedPackageManager = `bun@${bunVersion}`;

if (packageJson.packageManager !== expectedPackageManager) {
  console.error("packageManager pin mismatch:");
  console.error(`- .bun-version: ${bunVersion || "<empty>"}`);
  console.error(
    `- package.json packageManager: ${packageJson.packageManager ?? "<missing>"}`,
  );
  console.error(`- expected packageManager: ${expectedPackageManager}`);
  process.exit(1);
}

console.log(`packageManager matches .bun-version (${expectedPackageManager})`);
