/**
 * Finds the style variations that live in a theme's `styles/` directory.
 * @module file/VariationScanner
 */
import * as vscode from "vscode";
import {
  getThemeRootPath,
  summarizeVariations,
  type VariationFile,
  type VariationSummary,
} from "./variationSummary.js";

/** Depth limit for the recursive scan, mirroring how shallow themes nest. */
const MAX_DEPTH = 5;

/**
 * Summarize every `*.json` file under the theme's `styles/` directory.
 *
 * The theme is located from the open file: the parent of `styles/` when a
 * variation is open, otherwise the file's own directory. A missing or
 * unreadable directory yields an empty list — themes without variations are
 * the common case, not an error.
 *
 * @param fileUri The file currently open in the editor.
 */
export async function scanVariations(
  fileUri: vscode.Uri,
): Promise<VariationSummary[]> {
  const rootUri = fileUri.with({ path: getThemeRootPath(fileUri.path) });
  const stylesUri = vscode.Uri.joinPath(rootUri, "styles");

  const files = await readJsonFiles(stylesUri, 0);
  return summarizeVariations(files);
}

/** Read every `*.json` file in a directory tree, depth-first. */
async function readJsonFiles(
  dirUri: vscode.Uri,
  depth: number,
): Promise<VariationFile[]> {
  if (depth > MAX_DEPTH) {
    return [];
  }

  let entries: [string, vscode.FileType][];
  try {
    entries = await vscode.workspace.fs.readDirectory(dirUri);
  } catch {
    return [];
  }

  const files: VariationFile[] = [];

  for (const [name, type] of entries) {
    const entryUri = vscode.Uri.joinPath(dirUri, name);

    if (type === vscode.FileType.Directory) {
      files.push(...(await readJsonFiles(entryUri, depth + 1)));
      continue;
    }

    if (!name.toLowerCase().endsWith(".json")) {
      continue;
    }

    try {
      const raw = await vscode.workspace.fs.readFile(entryUri);
      files.push({
        path: vscode.workspace.asRelativePath(entryUri),
        content: new TextDecoder("utf-8").decode(raw),
      });
    } catch (err) {
      console.error("VariationScanner: failed to read file", entryUri.path, err);
    }
  }

  return files;
}
