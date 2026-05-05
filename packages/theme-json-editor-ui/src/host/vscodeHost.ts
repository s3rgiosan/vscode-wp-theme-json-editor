import type { HostToWebviewMessage } from "@shared/messages";
import { vscodeApi } from "../vscode";
import type { HostAdapter } from "./HostAdapter";

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
};
