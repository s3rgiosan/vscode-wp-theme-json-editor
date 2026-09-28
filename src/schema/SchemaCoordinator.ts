import * as vscode from "vscode";
import { SchemaLoader } from "./SchemaLoader.js";
import {
  loadCoreScanSnapshot,
  type CoreScanSnapshot,
} from "./coreScanSnapshot.js";

export interface RawSchemaBundle {
  readonly schema: Record<string, unknown>;
  readonly snapshot: CoreScanSnapshot;
}

/**
 * Loads the raw WP schema and the core-scan snapshot. Resolution and
 * merging happen in the webview package (off the main thread, via worker)
 * — single source of truth for both the VS Code extension and the future
 * WP plugin.
 */
export class SchemaCoordinator {
  private readonly loader: SchemaLoader;
  private readonly extensionUri: vscode.Uri;

  constructor(globalState: vscode.Memento, extensionUri: vscode.Uri) {
    this.loader = new SchemaLoader(globalState, extensionUri);
    this.extensionUri = extensionUri;
  }

  async getSchema(version: string): Promise<RawSchemaBundle> {
    const schema = await this.loader.load(version);
    const snapshot = await loadCoreScanSnapshot(this.extensionUri);
    return { schema, snapshot };
  }
}
