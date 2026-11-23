/**
 * Web Worker that resolves $ref/allOf and merges the core-scan snapshot
 * into the WP theme.json schema. Runs off the main thread so the editor
 * UI stays responsive while the (potentially large) schema is processed.
 */

import { SchemaResolver } from "./SchemaResolver";
import { SchemaMerger } from "./SchemaMerger";
import type { CoreScanSnapshot } from "../host/HostAdapter";

interface MergeRequest {
  readonly schema: Record<string, unknown>;
  readonly snapshot: CoreScanSnapshot;
}

self.onmessage = (event: MessageEvent<MergeRequest>) => {
  const { schema, snapshot } = event.data;
  const resolver = new SchemaResolver(schema);
  const resolved = resolver.resolve(schema);
  const merger = new SchemaMerger();
  const merged = merger.merge(resolved, snapshot);
  (self as unknown as Worker).postMessage(merged);
};
