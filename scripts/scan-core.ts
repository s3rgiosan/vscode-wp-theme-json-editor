/**
 * CLI script to regenerate the core-scan snapshot.
 * Run with: npx tsx scripts/scan-core.ts
 *
 * Scans the trunk of WordPress core and Gutenberg and records the latest
 * WordPress release as the snapshot's version.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { scanCore } from "../src/scanner/CoreScanner.js";

const VERSION_CHECK_URL = "https://api.wordpress.org/core/version-check/1.7/";
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../packages/theme-json-editor-ui/assets/core-scan-snapshot.json",
);

interface VersionCheckResponse {
  readonly offers?: ReadonlyArray<{ readonly current?: string }>;
}

/**
 * Get the major.minor version of the latest WordPress release
 * (e.g. "7.1.2" becomes "7.1").
 */
async function fetchLatestWpVersion(): Promise<string> {
  const response = await fetch(VERSION_CHECK_URL);
  if (!response.ok) {
    throw new Error(`Version check returned ${response.status}`);
  }

  const data = (await response.json()) as VersionCheckResponse;
  const current = data.offers?.[0]?.current ?? "";
  const version = /^(\d+\.\d+)/.exec(current)?.[1];
  if (!version) {
    throw new Error(`Unexpected version in version check: "${current}"`);
  }

  return version;
}

async function main(): Promise<void> {
  const wpVersion = await fetchLatestWpVersion();
  console.log(
    `Scanning WP core and Gutenberg trunk (latest release: WordPress ${wpVersion})...`,
  );

  const result = await scanCore(wpVersion);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`Snapshot written to ${OUTPUT_PATH}`);
  console.log(
    `Found ${result.properties.length} supported, ${result.experimental.length} experimental properties`,
  );
}

main().catch((err) => {
  console.error("Scan failed:", err);
  process.exit(1);
});
