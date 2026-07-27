/**
 * "New Block Style Variation" command — scaffolds a `styles/<slug>.json`
 * partial and opens it in the editor.
 *
 * @module commands/newBlockStyleVariation
 */
import * as vscode from "vscode";
import { PanelManager } from "../panel/PanelManager.js";
import { getThemeRootPath } from "../file/variationSummary.js";
import {
  buildVariationDocument,
  parseBlockTypesInput,
  toVariationSlug,
} from "../file/variationScaffold.js";

/** Fallback when the theme's own theme.json cannot be read. */
const DEFAULT_SCHEMA_URI = "https://schemas.wp.org/wp/6.7/theme.json";
const DEFAULT_VERSION = 3;

/**
 * Prompt for a title and target blocks, write the variation file, and open it.
 *
 * The theme is taken from the active file when it is a theme.json or an
 * existing variation; otherwise the user picks from the theme.json files in
 * the workspace.
 */
export async function newBlockStyleVariation(
  extensionUri: vscode.Uri,
  globalState: vscode.Memento,
): Promise<void> {
  const themeRootUri = await resolveThemeRoot();
  if (!themeRootUri) {
    return;
  }

  const title = await vscode.window.showInputBox({
    title: "New Block Style Variation",
    prompt: "Title of the variation, as shown in the editor",
    placeHolder: "Primary",
    validateInput: (value) =>
      toVariationSlug(value) === ""
        ? "Enter a title with at least one letter or number."
        : undefined,
  });
  if (title === undefined) {
    return;
  }

  const blockTypesInput = await vscode.window.showInputBox({
    title: "New Block Style Variation",
    prompt:
      "Blocks to register the style on, comma-separated. Leave empty for a variation that applies to the whole site.",
    placeHolder: "core/group, core/column",
  });
  if (blockTypesInput === undefined) {
    return;
  }

  const slug = toVariationSlug(title);
  const stylesUri = vscode.Uri.joinPath(themeRootUri, "styles");
  const targetUri = vscode.Uri.joinPath(stylesUri, `${slug}.json`);

  if (await fileExists(targetUri)) {
    void vscode.window.showErrorMessage(
      `${vscode.workspace.asRelativePath(targetUri)} already exists.`,
    );
    return;
  }

  const { schemaUri, version } = await readThemeDefaults(themeRootUri);
  const document = buildVariationDocument({
    title: title.trim(),
    slug,
    blockTypes: parseBlockTypesInput(blockTypesInput),
    schemaUri,
    version,
  });

  try {
    await vscode.workspace.fs.createDirectory(stylesUri);
    await vscode.workspace.fs.writeFile(
      targetUri,
      new TextEncoder().encode(`${JSON.stringify(document, null, 2)}\n`),
    );
  } catch (err) {
    console.error("newBlockStyleVariation: failed to write file", err);
    void vscode.window.showErrorMessage(
      `Failed to create ${vscode.workspace.asRelativePath(targetUri)}.`,
    );
    return;
  }

  PanelManager.openOrReveal(
    targetUri,
    extensionUri,
    vscode.ViewColumn.Active,
    globalState,
  );
}

/**
 * The theme to scaffold into: the active file's theme when it has one,
 * otherwise a theme.json chosen from the workspace.
 */
async function resolveThemeRoot(): Promise<vscode.Uri | undefined> {
  const activeUri = vscode.window.activeTextEditor?.document.uri;
  if (activeUri && /(^|\/)(theme\.json|styles\/.+\.json)$/i.test(activeUri.path)) {
    return activeUri.with({ path: getThemeRootPath(activeUri.path) });
  }

  const themeJsonUris = await vscode.workspace.findFiles(
    "**/theme.json",
    "**/node_modules/**",
    50,
  );

  if (themeJsonUris.length === 0) {
    void vscode.window.showWarningMessage(
      "No theme.json found in this workspace, so there is no theme to add a variation to.",
    );
    return undefined;
  }

  if (themeJsonUris.length === 1) {
    return themeJsonUris[0].with({
      path: getThemeRootPath(themeJsonUris[0].path),
    });
  }

  const picked = await vscode.window.showQuickPick(
    themeJsonUris.map((uri) => ({
      label: vscode.workspace.asRelativePath(uri),
      uri,
    })),
    { title: "Which theme?", placeHolder: "Select the theme.json to add to" },
  );

  return picked?.uri.with({ path: getThemeRootPath(picked.uri.path) });
}

/** `$schema` and `version` from the theme's own theme.json, when readable. */
async function readThemeDefaults(
  themeRootUri: vscode.Uri,
): Promise<{ schemaUri: string; version: number }> {
  try {
    const raw = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(themeRootUri, "theme.json"),
    );
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8").decode(raw));
    if (typeof parsed === "object" && parsed !== null) {
      const data = parsed as Record<string, unknown>;
      const schemaUri = typeof data["$schema"] === "string" ? data["$schema"] : DEFAULT_SCHEMA_URI;
      const version = typeof data["version"] === "number" ? data["version"] : DEFAULT_VERSION;
      return { schemaUri, version };
    }
  } catch {
    // Fall through to the defaults — a theme without a readable theme.json
    // is unusual but not a reason to refuse to scaffold.
  }

  return { schemaUri: DEFAULT_SCHEMA_URI, version: DEFAULT_VERSION };
}

/** Whether a file already exists at the given URI. */
async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}
