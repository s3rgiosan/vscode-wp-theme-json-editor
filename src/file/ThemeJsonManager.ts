import * as vscode from "vscode";

/**
 * Handles reading, writing, and watching a theme.json file.
 * All file I/O goes through this class — no other module should touch the file system.
 */
export class ThemeJsonManager {
  private readonly uri: vscode.Uri;
  private watcher: vscode.FileSystemWatcher | undefined;
  private onDidChangeExternalEmitter = new vscode.EventEmitter<void>();

  /**
   * Fires when the file changes externally (outside of our own writes).
   */
  readonly onDidChangeExternal = this.onDidChangeExternalEmitter.event;

  private writingInProgress = false;

  constructor(uri: vscode.Uri) {
    this.uri = uri;
  }

  /** Public accessor for the file URI. */
  get fileUri(): vscode.Uri {
    return this.uri;
  }

  /**
   * Read and parse the theme.json file. Returns the parsed object
   * or undefined if the file cannot be read or is not valid JSON.
   */
  async read(): Promise<Record<string, unknown> | undefined> {
    try {
      const raw = await vscode.workspace.fs.readFile(this.uri);
      const text = new TextDecoder("utf-8").decode(raw);
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      console.error("ThemeJsonManager: file is not a JSON object");
      return undefined;
    } catch (err) {
      console.error("ThemeJsonManager: failed to read file", err);
      return undefined;
    }
  }

  /**
   * Write the given data back to the theme.json file.
   * Serialises with 2-space indent.
   */
  async write(data: Record<string, unknown>): Promise<boolean> {
    try {
      this.writingInProgress = true;
      const text = JSON.stringify(data, null, 2);
      const encoded = new TextEncoder().encode(text);
      await vscode.workspace.fs.writeFile(this.uri, encoded);
      return true;
    } catch (err) {
      console.error("ThemeJsonManager: failed to write file", err);
      return false;
    } finally {
      // Delay clearing the flag to absorb file watcher events
      // that fire asynchronously after the write completes
      setTimeout(() => {
        this.writingInProgress = false;
      }, 500);
    }
  }

  /**
   * Extract the schema version from the `$schema` field.
   * Returns the version string (e.g. "6.7") or undefined if not found.
   */
  extractSchemaVersion(data: Record<string, unknown>): string | undefined {
    const schemaUrl = data["$schema"];
    if (typeof schemaUrl !== "string") {
      return undefined;
    }
    const match = /\/wp\/([^/]+)\/theme\.json/.exec(schemaUrl);
    if (match && match[1]) {
      return match[1];
    }
    return undefined;
  }

  /**
   * Start watching the file for external changes.
   */
  startWatching(): void {
    if (this.watcher) {
      return;
    }

    const pattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(this.uri, ".."),
      vscode.workspace.asRelativePath(this.uri).split("/").pop() ?? "theme.json"
    );

    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.watcher.onDidChange(() => {
      if (!this.writingInProgress) {
        this.onDidChangeExternalEmitter.fire();
      }
    });
  }

  /**
   * Stop watching and release resources.
   */
  dispose(): void {
    this.watcher?.dispose();
    this.watcher = undefined;
    this.onDidChangeExternalEmitter.dispose();
  }
}
