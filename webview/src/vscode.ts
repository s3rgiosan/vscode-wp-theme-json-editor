/**
 * Wrapper for the VSCode Webview API.
 * acquireVsCodeApi() must be called exactly once.
 */

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// In development mode (running in a browser), provide a mock
const api: VsCodeApi =
  typeof acquireVsCodeApi === "function"
    ? acquireVsCodeApi()
    : {
        postMessage: (msg: unknown) => console.log("[vscode mock] postMessage:", msg),
        getState: () => null,
        setState: (state: unknown) => console.log("[vscode mock] setState:", state),
      };

export const vscodeApi = api;
