import * as vscode from "vscode";
import { SchemaLoader } from "./SchemaLoader.js";
import { SchemaMerger } from "./SchemaMerger.js";
import { SchemaResolver } from "./SchemaResolver.js";

interface CoreScanSnapshot {
  readonly generatedAt: string;
  readonly wpVersion: string;
  readonly experimental: string[];
  readonly undocumented: string[];
}

/**
 * Coordinates the multi-step schema pipeline:
 * 1. Load raw schema (network → cache → fallback)
 * 2. Resolve $ref and allOf
 * 3. Load core-scan snapshot
 * 4. Merge experimental/undocumented flags
 */
export class SchemaCoordinator {
  private readonly loader: SchemaLoader;
  private readonly merger: SchemaMerger;
  private readonly extensionUri: vscode.Uri;

  constructor(globalState: vscode.Memento, extensionUri: vscode.Uri) {
    this.loader = new SchemaLoader(globalState, extensionUri);
    this.merger = new SchemaMerger();
    this.extensionUri = extensionUri;
  }

  /**
   * Load, resolve, and merge the schema for the given WP version.
   * Returns the final schema ready for the webview.
   */
  async getSchema(version: string): Promise<Record<string, unknown>> {
    const rawSchema = await this.loader.load(version);
    const resolver = new SchemaResolver(rawSchema);
    const resolved = resolver.resolve(rawSchema);
    const snapshot = await this.loadCoreScanSnapshot();
    return this.merger.merge(resolved, snapshot);
  }

  private async loadCoreScanSnapshot(): Promise<CoreScanSnapshot> {
    try {
      const snapshotUri = vscode.Uri.joinPath(
        this.extensionUri,
        "src",
        "schema",
        "core-scan-snapshot.json",
      );
      const raw = await vscode.workspace.fs.readFile(snapshotUri);
      const text = new TextDecoder("utf-8").decode(raw);
      return JSON.parse(text) as CoreScanSnapshot;
    } catch (err) {
      console.error("SchemaCoordinator: failed to load core-scan snapshot", err);
      return {
        generatedAt: "",
        wpVersion: "",
        experimental: [],
        undocumented: [],
      };
    }
  }
}
