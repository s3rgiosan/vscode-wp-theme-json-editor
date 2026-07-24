import { vscodeApi } from "../vscode";
import type {
  CoreScanSnapshot,
  HostAdapter,
  VariationSummary,
} from "./HostAdapter";

/**
 * Subset of the VS Code → webview message protocol the editor cares
 * about. Defined locally so the package doesn't depend on the
 * extension's `src/shared/messages.ts` (which would couple consumers
 * to the extension's path aliases).
 */
type HostToWebviewMessage =
  | { type: "INIT_DATA"; data: Record<string, unknown>; filePath: string }
  | { type: "FILE_CHANGED"; data: Record<string, unknown> }
  | { type: "FILE_CHANGED_CONFLICT"; data: Record<string, unknown> }
  | { type: "FILE_SAVED" }
  | {
      type: "SCHEMA_READY";
      schema: Record<string, unknown>;
      snapshot: CoreScanSnapshot;
      schemaVersion: string;
    }
  | { type: "SETTINGS"; showExperimentalByDefault: boolean }
  | { type: "VARIATIONS"; variations: VariationSummary[] }
  | { type: "TRIGGER_SAVE" };

/**
 * HostAdapter implementation backed by the VS Code webview API.
 * Bridges postMessage / window message events to the host-agnostic
 * event interface consumed by `useHostBootstrap`.
 */
export const vscodeHost: HostAdapter = {
  start(events) {
    const handler = (event: MessageEvent<HostToWebviewMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case "INIT_DATA":
          events.onInit?.(msg.data, msg.filePath);
          break;
        case "FILE_CHANGED":
          events.onExternalChange?.(msg.data);
          break;
        case "FILE_CHANGED_CONFLICT":
          events.onConflict?.(msg.data);
          break;
        case "FILE_SAVED":
          events.onSaved?.();
          break;
        case "SCHEMA_READY":
          events.onSchemaReady?.(msg.schema, msg.snapshot, msg.schemaVersion);
          break;
        case "SETTINGS":
          events.onSettings?.({
            showExperimental: msg.showExperimentalByDefault,
          });
          break;
        case "VARIATIONS":
          events.onVariations?.(msg.variations);
          break;
        case "TRIGGER_SAVE":
          events.onTriggerSave?.();
          break;
      }
    };

    window.addEventListener("message", handler);

    // Tell the host we're ready to receive data.
    vscodeApi.postMessage({ type: "WEBVIEW_READY" });

    return () => window.removeEventListener("message", handler);
  },

  save(data) {
    vscodeApi.postMessage({ type: "SAVE_REQUEST", data });
  },

  reportDirty(isDirty) {
    vscodeApi.postMessage({ type: "DIRTY_STATE", isDirty });
  },

  requestVariations() {
    vscodeApi.postMessage({ type: "REQUEST_VARIATIONS" });
  },

  openVariation(path) {
    vscodeApi.postMessage({ type: "OPEN_VARIATION", path });
  },
};
