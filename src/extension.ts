/**
 * Extension entry point.
 * Registers commands for opening theme.json files in the visual editor.
 * @module extension
 */
import * as vscode from "vscode";
import { PanelManager } from "./panel/PanelManager.js";
import {
  DEFAULT_INCLUDE_PATTERNS,
  isEditableThemeFile,
} from "./file/isEditableThemeFile.js";

/** Warning shown when no file matching `includePatterns` is available. */
const NO_EDITABLE_FILE_MESSAGE =
  "No matching theme JSON file. Open or right-click a file matched by " +
  "wpThemeJsonEditor.includePatterns (theme.json or styles/*.json by default).";

/**
 * Called when the extension is activated.
 * Registers the open, openSidePanel, and openTab commands.
 */
export function activate(context: vscode.ExtensionContext): void {
  const open = vscode.commands.registerCommand(
    "wpThemeJsonEditor.open",
    (uri?: vscode.Uri) => {
      const fileUri = resolveFileUri(uri);
      if (!fileUri) {
        void vscode.window.showWarningMessage(NO_EDITABLE_FILE_MESSAGE);
        return;
      }
      const config = vscode.workspace.getConfiguration("wpThemeJsonEditor");
      const layout = config.get<string>("defaultLayout", "tab");
      const column = layout === "sidePanel" ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
      PanelManager.openOrReveal(
        fileUri,
        context.extensionUri,
        column,
        context.globalState,
      );
    },
  );

  const openSidePanel = vscode.commands.registerCommand(
    "wpThemeJsonEditor.openSidePanel",
    (uri?: vscode.Uri) => {
      const fileUri = resolveFileUri(uri);
      if (!fileUri) {
        void vscode.window.showWarningMessage(NO_EDITABLE_FILE_MESSAGE);
        return;
      }
      PanelManager.openOrReveal(
        fileUri,
        context.extensionUri,
        vscode.ViewColumn.Beside,
        context.globalState,
      );
    },
  );

  const openTab = vscode.commands.registerCommand(
    "wpThemeJsonEditor.openTab",
    (uri?: vscode.Uri) => {
      const fileUri = resolveFileUri(uri);
      if (!fileUri) {
        void vscode.window.showWarningMessage(NO_EDITABLE_FILE_MESSAGE);
        return;
      }
      PanelManager.openOrReveal(
        fileUri,
        context.extensionUri,
        vscode.ViewColumn.Active,
        context.globalState,
      );
    },
  );

  const save = vscode.commands.registerCommand(
    "wpThemeJsonEditor.save",
    () => {
      PanelManager.triggerSaveOnActivePanel();
    },
  );

  // `activeFileEditable` drives the keybinding `when`-clause: it tracks whether
  // the active editor's file matches the configured include patterns.
  const syncActiveFileContext = (): void => {
    const activeEditor = vscode.window.activeTextEditor;
    const editable =
      activeEditor !== undefined &&
      isEditableThemeFile(activeEditor.document.fileName, getIncludePatterns());
    void vscode.commands.executeCommand(
      "setContext",
      "wpThemeJsonEditor.activeFileEditable",
      editable,
    );
  };

  // `hasCustomPatterns` lets the explorer context menu widen to every `.json`
  // file only once the user has defined their own patterns. The menu's
  // `when`-clause cannot read the patterns themselves (it is static), so the
  // open command re-validates the chosen file against them.
  const syncCustomPatternsContext = (): void => {
    void vscode.commands.executeCommand(
      "setContext",
      "wpThemeJsonEditor.hasCustomPatterns",
      hasCustomIncludePatterns(),
    );
  };

  syncActiveFileContext();
  syncCustomPatternsContext();

  context.subscriptions.push(
    open,
    openSidePanel,
    openTab,
    save,
    vscode.window.onDidChangeActiveTextEditor(syncActiveFileContext),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("wpThemeJsonEditor.includePatterns")) {
        syncActiveFileContext();
        syncCustomPatternsContext();
      }
    }),
  );
}

/** Read the configured include-pattern allowlist, falling back to defaults. */
function getIncludePatterns(): readonly string[] {
  const config = vscode.workspace.getConfiguration("wpThemeJsonEditor");
  const patterns = config.get<string[]>("includePatterns");
  if (patterns && patterns.length > 0) {
    return patterns;
  }
  return DEFAULT_INCLUDE_PATTERNS;
}

/** Whether the user has set `includePatterns` in any settings scope. */
function hasCustomIncludePatterns(): boolean {
  const config = vscode.workspace.getConfiguration("wpThemeJsonEditor");
  const inspected = config.inspect<string[]>("includePatterns");
  if (!inspected) {
    return false;
  }
  return (
    inspected.globalValue !== undefined ||
    inspected.workspaceValue !== undefined ||
    inspected.workspaceFolderValue !== undefined
  );
}

/** Called when the extension is deactivated. Panels dispose themselves. */
export function deactivate(): void {
  // No cleanup needed — panels dispose themselves
}

/**
 * Resolve the file URI from the command argument or the active editor.
 *
 * Commands invoked from the context menu receive the URI directly; commands
 * invoked from the palette fall back to the active editor. Either way the file
 * must match the configured include patterns — the explorer menu can widen to
 * every `.json` file, so the chosen file is re-validated here.
 */
function resolveFileUri(uri: vscode.Uri | undefined): vscode.Uri | undefined {
  const patterns = getIncludePatterns();

  if (uri) {
    return isEditableThemeFile(uri.fsPath, patterns) ? uri : undefined;
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (
    activeEditor &&
    isEditableThemeFile(activeEditor.document.fileName, patterns)
  ) {
    return activeEditor.document.uri;
  }

  return undefined;
}
