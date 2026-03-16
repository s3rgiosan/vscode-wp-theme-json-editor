/**
 * CLI script to regenerate the core-scan snapshot.
 * Run with: npx ts-node scripts/scan-core.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { scanCore } from "../src/scanner/CoreScanner.js";

const WP_VERSION = "6.7";
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../src/schema/core-scan-snapshot.json",
);

async function main(): Promise<void> {
  console.log(`Scanning WP core (version ${WP_VERSION}) for theme.json properties...`);

  // In a full implementation, we'd load the official schema and extract
  // all known property paths. For now, use an empty set.
  const knownProperties = new Set<string>();

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
