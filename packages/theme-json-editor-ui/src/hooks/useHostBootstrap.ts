import { useEffect } from "react";
import { useEditorStore, performSave } from "../store/editorStore";
import { useHost } from "../host/HostContext";
import SchemaWorker from "../schema/schema.worker?worker&inline";

/**
 * Wires the host adapter (vscodeHost, wpHost, …) into the editor store.
 *
 * On mount, calls `host.start(events)` which triggers the host's
 * bootstrap sequence (initial data, schema, settings) and listens for
 * subsequent file/save/conflict events. Returns the disposer on cleanup.
 *
 * Must be called once at the top level of the component tree (in App).
 */
export function useHostBootstrap(): void {
  const host = useHost();
  useEffect(() => {
    const dispose = host.start({
      onInit: (data, filePath) =>
        useEditorStore.getState().setInitialData(data, filePath),
      onExternalChange: (data) =>
        useEditorStore.getState().setExternalData(data),
      onConflict: (data) =>
        useEditorStore.getState().setConflictData(data),
      onSaved: () => useEditorStore.getState().markSaved(),
      onSchemaReady: (schema, snapshot, version) => {
        const worker = new SchemaWorker();
        worker.onmessage = (e: MessageEvent<Record<string, unknown>>) => {
          useEditorStore.getState().setSchema(e.data, version);
          worker.terminate();
        };
        worker.postMessage({ schema, snapshot });
      },
      onSettings: ({ showExperimental }) =>
        useEditorStore.getState().setShowExperimental(showExperimental),
      onTriggerSave: () => performSave(host),
    });

    let prevIsDirty = useEditorStore.getState().isDirty;
    const unsubscribe = useEditorStore.subscribe((state) => {
      if (state.isDirty !== prevIsDirty) {
        prevIsDirty = state.isDirty;
        host.reportDirty(state.isDirty);
      }
    });

    return () => {
      dispose();
      unsubscribe();
    };
  }, [host]);
}
