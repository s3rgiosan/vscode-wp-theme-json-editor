import { useEffect } from "react";
import type { HostToWebviewMessage } from "@shared/messages";
import { useEditorStore, performSave } from "../store/editorStore";
import { vscodeApi } from "../vscode";

/**
 * Listens for messages from the extension host and dispatches them
 * to the Zustand store.
 *
 * On mount, sends a WEBVIEW_READY message to the host which triggers
 * the full initialization sequence (INIT_DATA, SETTINGS, SCHEMA_READY).
 *
 * Must be called once at the top level of the component tree (in App).
 */
export function useMessageListener(): void {
  useEffect(() => {
    const handler = (event: MessageEvent<HostToWebviewMessage>) => {
      const msg = event.data;
      const store = useEditorStore.getState();

      switch (msg.type) {
        case "INIT_DATA":
          store.setInitialData(msg.data, msg.filePath);
          break;
        case "FILE_CHANGED":
          store.setExternalData(msg.data);
          break;
        case "FILE_CHANGED_CONFLICT":
          store.setConflictData(msg.data);
          break;
        case "FILE_SAVED":
          store.markSaved();
          break;
        case "SCHEMA_READY":
          store.setSchema(msg.schema, msg.schemaVersion);
          break;
        case "SETTINGS":
          store.setShowExperimental(msg.showExperimentalByDefault);
          break;
        case "TRIGGER_SAVE":
          performSave(vscodeApi.postMessage.bind(vscodeApi));
          break;
      }
    };

    window.addEventListener("message", handler);

    // Sync isDirty state to the extension host so it can detect conflicts.
    let prevIsDirty = useEditorStore.getState().isDirty;
    const unsubscribe = useEditorStore.subscribe((state) => {
      if (state.isDirty !== prevIsDirty) {
        prevIsDirty = state.isDirty;
        vscodeApi.postMessage({ type: "DIRTY_STATE", isDirty: state.isDirty });
      }
    });

    // Tell the host we're ready to receive data.
    // The host responds with INIT_DATA + SETTINGS + SCHEMA_READY.
    vscodeApi.postMessage({ type: "WEBVIEW_READY" });

    return () => {
      window.removeEventListener("message", handler);
      unsubscribe();
    };
  }, []);
}
