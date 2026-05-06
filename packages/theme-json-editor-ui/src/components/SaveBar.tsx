import { useEditorStore, performSave } from "../store/editorStore";
import { useHost } from "../host/HostContext";

/**
 * Fixed bottom bar with Save and Discard buttons.
 * Visible when the editor has unsaved changes.
 * Minifies CSS fields before sending the save request.
 */
export function SaveBar() {
  const resetToSaved = useEditorStore((s) => s.resetToSaved);
  const host = useHost();

  const handleSave = () => {
    performSave(host);
  };

  return (
    <div
      className="flex items-center justify-end gap-2 px-4 py-2 border-t border-tje-panel-border bg-tje-sidebar-bg"
      role="status"
      aria-label="Unsaved changes"
    >
      <span className="text-tje-description-fg mr-auto">
        Unsaved changes
      </span>
      <button
        onClick={resetToSaved}
        className="px-3 py-1 rounded border border-tje-button-secondary-border bg-tje-button-secondary-bg text-tje-button-secondary-fg hover:bg-tje-button-secondary-bg-hover hover:text-tje-button-secondary-fg-hover hover:border-tje-button-secondary-border-hover"
      >
        Discard
      </button>
      <button
        onClick={handleSave}
        className="px-3 py-1 rounded border border-transparent bg-tje-button-bg text-tje-button-fg hover:bg-tje-button-hover"
      >
        Save
      </button>
    </div>
  );
}
