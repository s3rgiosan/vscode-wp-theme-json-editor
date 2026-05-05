import * as vscode from "vscode";
import { SchemaLoader } from "./SchemaLoader.js";

interface CoreScanSnapshot {
  readonly generatedAt: string;
  readonly wpVersion: string;
  readonly experimental: string[];
  readonly undocumented: string[];
}

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
    const snapshot = await this.loadCoreScanSnapshot();
    return { schema, snapshot };
  }

  private async loadCoreScanSnapshot(): Promise<CoreScanSnapshot> {
    try {
      const snapshotUri = vscode.Uri.joinPath(
        this.extensionUri,
        "packages",
        "theme-json-editor-ui",
        "assets",
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
