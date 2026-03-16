import * as vscode from "vscode";

/**
 * Generates the HTML content for the Webview panel.
 * Handles CSP headers, nonce generation, and asset URI resolution.
 */
export class WebviewHtmlRenderer {
  private readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  /** Generate the full HTML document for the webview, including CSP and asset links. */
  render(webview: vscode.Webview): string {
    const distUri = vscode.Uri.joinPath(
      this.extensionUri,
      "webview",
      "dist",
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distUri, "main.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distUri, "main.css"),
    );

    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src ${webview.cspSource} 'unsafe-inline';
             script-src 'nonce-${nonce}';
             font-src ${webview.cspSource};
             img-src ${webview.cspSource} data:;" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>WP Theme JSON Editor</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

/** Generate a cryptographically random nonce for CSP script-src. */
function getNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
