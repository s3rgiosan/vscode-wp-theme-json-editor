/**
 * Extension entry point.
 * Registers commands for opening theme.json files in the visual editor.
 * @module extension
 */
import * as vscode from "vscode";
import { PanelManager } from "./panel/PanelManager.js";

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
        void vscode.window.showWarningMessage(
          "No theme.json file selected. Open or right-click a theme.json file first.",
        );
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
        void vscode.window.showWarningMessage(
          "No theme.json file selected. Open or right-click a theme.json file first.",
        );
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
        void vscode.window.showWarningMessage(
          "No theme.json file selected. Open or right-click a theme.json file first.",
        );
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

  context.subscriptions.push(open, openSidePanel, openTab, save);
}

/** Called when the extension is deactivated. Panels dispose themselves. */
export function deactivate(): void {
  // No cleanup needed — panels dispose themselves
}

/**
 * Resolve the file URI from the command argument or the active editor.
 * Commands invoked from the context menu receive the URI directly.
 * Commands invoked from the palette fall back to the active editor.
 */
function resolveFileUri(uri: vscode.Uri | undefined): vscode.Uri | undefined {
  if (uri) {
    return uri;
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && activeEditor.document.fileName.endsWith("theme.json")) {
    return activeEditor.document.uri;
  }

  return undefined;
}
