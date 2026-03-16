import * as vscode from "vscode";
import { ThemeJsonManager } from "../file/ThemeJsonManager.js";
import { SchemaCoordinator } from "../schema/SchemaCoordinator.js";
import { WebviewHtmlRenderer } from "./WebviewHtmlRenderer.js";
import type {
  HostToWebviewMessage,
  WebviewToHostMessage,
} from "./messages.js";

/**
 * Manages Webview panels for theme.json files.
 * Singleton per file path — re-focuses an existing panel if already open.
 */
export class PanelManager {
  private static readonly panels = new Map<string, PanelManager>();
  private static readonly viewType = "wpThemeJsonEditor";

  private readonly panel: vscode.WebviewPanel;
  private readonly fileManager: ThemeJsonManager;
  private readonly schemaCoordinator: SchemaCoordinator;
  private readonly htmlRenderer: WebviewHtmlRenderer;
  private readonly disposables: vscode.Disposable[] = [];
  private currentData: Record<string, unknown> | undefined;
  private isDirty = false;

  private constructor(
    panel: vscode.WebviewPanel,
    fileUri: vscode.Uri,
    extensionUri: vscode.Uri,
    globalState: vscode.Memento,
  ) {
    this.panel = panel;
    this.fileManager = new ThemeJsonManager(fileUri);
    this.schemaCoordinator = new SchemaCoordinator(globalState, extensionUri);
    this.htmlRenderer = new WebviewHtmlRenderer(extensionUri);

    this.setupPanel();
  }

  /**
   * Open or reveal a panel for the given theme.json file.
   */
  static openOrReveal(
    fileUri: vscode.Uri,
    extensionUri: vscode.Uri,
    column: vscode.ViewColumn,
    globalState: vscode.Memento,
  ): PanelManager {
    const key = fileUri.toString();
    const existing = PanelManager.panels.get(key);

    if (existing) {
      existing.panel.reveal(column);
      return existing;
    }

    const panel = vscode.window.createWebviewPanel(
      PanelManager.viewType,
      `Theme JSON: ${vscode.workspace.asRelativePath(fileUri)}`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "webview", "dist"),
        ],
      },
    );

    const manager = new PanelManager(panel, fileUri, extensionUri, globalState);
    PanelManager.panels.set(key, manager);
    return manager;
  }

  /**
   * Sends a TRIGGER_SAVE message to whichever panel is currently active/visible.
   * Called by the save keybinding command.
   */
  static triggerSaveOnActivePanel(): void {
    for (const manager of PanelManager.panels.values()) {
      if (manager.panel.active) {
        manager.postMessage({ type: "TRIGGER_SAVE" });
        return;
      }
    }
  }

  private setupPanel(): void {
    this.panel.webview.html = this.htmlRenderer.render(this.panel.webview);

    this.panel.webview.onDidReceiveMessage(
      (msg: WebviewToHostMessage) => {
        void this.handleWebviewMessage(msg);
      },
      undefined,
      this.disposables,
    );

    this.panel.onDidDispose(
      () => this.dispose(),
      undefined,
      this.disposables,
    );

    this.fileManager.startWatching();
    this.fileManager.onDidChangeExternal(
      () => {
        void this.handleExternalFileChange();
      },
      undefined,
      this.disposables,
    );

    // Data loading is triggered by WEBVIEW_READY from the webview,
    // ensuring the message listener is set up before data is sent.
  }

  private async loadInitialData(): Promise<void> {
    const data = await this.fileManager.read();
    if (!data) {
      void vscode.window.showErrorMessage(
        "Failed to read theme.json. The file may be missing or contain invalid JSON.",
      );
      return;
    }

    this.currentData = data;
    this.postMessage({
      type: "INIT_DATA",
      data,
      filePath: vscode.workspace.asRelativePath(this.fileManager.fileUri),
    });

    // Send extension settings
    const config = vscode.workspace.getConfiguration("wpThemeJsonEditor");
    const showExperimental = config.get<boolean>("showExperimentalByDefault", false);
    this.postMessage({
      type: "SETTINGS",
      showExperimentalByDefault: showExperimental,
    });

    await this.loadAndSendSchema(data);
  }

  private async loadAndSendSchema(
    data: Record<string, unknown>,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration("wpThemeJsonEditor");
    const configVersion = config.get<string>("schemaVersion", "auto");
    const version = configVersion !== "auto"
      ? configVersion
      : this.fileManager.extractSchemaVersion(data) ?? "6.7";

    try {
      const merged = await this.schemaCoordinator.getSchema(version);
      this.postMessage({
        type: "SCHEMA_READY",
        schema: merged,
        schemaVersion: version,
      });
    } catch (err) {
      console.error("PanelManager: failed to load schema", err);
      void vscode.window.showErrorMessage(
        "Failed to load the WordPress theme.json schema.",
      );
    }
  }

  private async handleWebviewMessage(
    msg: WebviewToHostMessage,
  ): Promise<void> {
    switch (msg.type) {
      case "SAVE_REQUEST": {
        const success = await this.fileManager.write(msg.data);
        if (success) {
          this.currentData = msg.data;
          this.isDirty = false;
          this.postMessage({ type: "FILE_SAVED" });
        } else {
          void vscode.window.showErrorMessage("Failed to save theme.json.");
        }
        break;
      }
      case "WEBVIEW_READY": {
        // Webview has mounted — send all initial data
        await this.loadInitialData();
        break;
      }
      case "DIRTY_STATE": {
        this.isDirty = msg.isDirty;
        break;
      }
    }
  }

  private async handleExternalFileChange(): Promise<void> {
    const data = await this.fileManager.read();
    if (!data) {
      return;
    }

    if (this.isDirty) {
      this.postMessage({ type: "FILE_CHANGED_CONFLICT", data });
    } else {
      this.currentData = data;
      this.postMessage({ type: "FILE_CHANGED", data });
    }
  }

  private postMessage(message: HostToWebviewMessage): void {
    void this.panel.webview.postMessage(message);
  }

  getCurrentData(): Record<string, unknown> | undefined {
    return this.currentData;
  }

  private dispose(): void {
    const key = this.fileManager.fileUri.toString();
    PanelManager.panels.delete(key);
    this.fileManager.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
