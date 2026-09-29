import * as vscode from "vscode";

export interface CoreScanSnapshot {
  readonly generatedAt: string;
  /** Latest WordPress release when the snapshot was generated (e.g. "7.1"). */
  readonly wpVersion: string;
  readonly experimental: string[];
  readonly properties: string[];
}

/**
 * Read the bundled core-scan snapshot. Returns an empty snapshot when the
 * file is missing or unreadable.
 */
export async function loadCoreScanSnapshot(
  extensionUri: vscode.Uri,
): Promise<CoreScanSnapshot> {
  try {
    const snapshotUri = vscode.Uri.joinPath(
      extensionUri,
      "packages",
      "theme-json-editor-ui",
      "assets",
      "core-scan-snapshot.json",
    );
    const raw = await vscode.workspace.fs.readFile(snapshotUri);
    const text = new TextDecoder("utf-8").decode(raw);
    return JSON.parse(text) as CoreScanSnapshot;
  } catch (err) {
    console.error("loadCoreScanSnapshot: failed to load core-scan snapshot", err);
    return {
      generatedAt: "",
      wpVersion: "",
      experimental: [],
      properties: [],
    };
  }
}
