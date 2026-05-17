/**
 * CLI script to regenerate the core-scan snapshot.
 * Run with: npx tsx scripts/scan-core.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { scanCore } from "../src/scanner/CoreScanner.js";
import { extractSchemaPropertyPaths } from "../src/scanner/schemaProperties.js";
import { SchemaResolver } from "../packages/theme-json-editor-ui/src/schema/SchemaResolver.js";

const WP_VERSION = "6.7";
const SCHEMA_URL = `https://schemas.wp.org/wp/${WP_VERSION}/theme.json`;
const FALLBACK_PATH = path.resolve(
  __dirname,
  "../packages/theme-json-editor-ui/assets/theme.json.fallback",
);
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../packages/theme-json-editor-ui/assets/core-scan-snapshot.json",
);

async function loadSchema(): Promise<Record<string, unknown>> {
  try {
    console.log(`Fetching schema from ${SCHEMA_URL}...`);
    const response = await fetch(SCHEMA_URL);
    if (response.ok) {
      return (await response.json()) as Record<string, unknown>;
    }
    console.warn(`Schema fetch returned ${response.status}, using fallback`);
  } catch (err) {
    console.warn("Schema fetch failed, using fallback:", err);
  }

  const raw = fs.readFileSync(FALLBACK_PATH, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function main(): Promise<void> {
  console.log(
    `Scanning WP core and Gutenberg (version ${WP_VERSION}) for theme.json properties...`,
  );

  // Load and resolve the official schema to get known property paths
  const rawSchema = await loadSchema();
  const resolver = new SchemaResolver(rawSchema);
  const resolvedSchema = resolver.resolve(rawSchema);
  const knownProperties = extractSchemaPropertyPaths(resolvedSchema);
  console.log(`Loaded ${knownProperties.size} known properties from schema`);

  const result = await scanCore(knownProperties, WP_VERSION);

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
