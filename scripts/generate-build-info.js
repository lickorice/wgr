#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function getGitDate() {
  try {
    // ISO 8601 committer date
    const out = execSync("git log -1 --format=%cI", {
      encoding: "utf8",
    }).trim();
    return out || new Date().toISOString();
  } catch (_e) {
    return new Date().toISOString();
  }
}

const repoRoot = path.join(process.cwd());
const pkgPath = path.join(repoRoot, "package.json");
let pkg = { version: "0.0.0" };
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
} catch (_e) {
  // fall back
}
const version = pkg.version || "0.0.0";
const last = getGitDate();

const dest = path.join(repoRoot, "src", "build_info.ts");
const content =
  `// Generated file — do not edit by hand\n` +
  `export const BUILD_VERSION = ${JSON.stringify(version)}\n` +
  `export const LAST_UPDATED_ISO = ${JSON.stringify(last)}\n`;

fs.writeFileSync(dest, content, "utf8");
console.log("Wrote", dest, version, last);
