/**
 * CLI script to regenerate the core-scan snapshot.
 * Run with: npx tsx scripts/scan-core.ts
 *
 * Scans the trunk of WordPress core and Gutenberg and compares the result
 * against the theme.json schema of the latest WordPress release.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { scanCore } from "../src/scanner/CoreScanner.js";
import { extractSchemaPropertyPaths } from "../src/scanner/schemaProperties.js";
import { SchemaResolver } from "../packages/theme-json-editor-ui/src/schema/SchemaResolver.js";

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

async function loadSchema(
  wpVersion: string,
): Promise<Record<string, unknown>> {
  const schemaUrl = `https://schemas.wp.org/wp/${wpVersion}/theme.json`;
  console.log(`Fetching schema from ${schemaUrl}...`);

  const response = await fetch(schemaUrl);
  if (!response.ok) {
    throw new Error(`Schema fetch returned ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  const wpVersion = await fetchLatestWpVersion();
  console.log(
    `Scanning WP core and Gutenberg trunk against the WordPress ${wpVersion} schema...`,
  );

  // Load and resolve the official schema to get known property paths
  const rawSchema = await loadSchema(wpVersion);
  const resolver = new SchemaResolver(rawSchema);
  const resolvedSchema = resolver.resolve(rawSchema);
  const knownProperties = extractSchemaPropertyPaths(resolvedSchema);
  console.log(`Loaded ${knownProperties.size} known properties from schema`);

  const result = await scanCore(knownProperties, wpVersion);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`Snapshot written to ${OUTPUT_PATH}`);
  console.log(
    `Found ${result.experimental.length} experimental, ${result.undocumented.length} undocumented properties`,
  );
}

main().catch((err) => {
  console.error("Scan failed:", err);
  process.exit(1);
});
