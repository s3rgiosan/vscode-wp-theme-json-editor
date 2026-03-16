import { useEditorStore, performSave } from "../store/editorStore";
import { vscodeApi } from "../vscode";

/**
 * Fixed bottom bar with Save and Discard buttons.
 * Visible when the editor has unsaved changes.
 * Minifies CSS fields before sending the save request.
 */
export function SaveBar() {
  const resetToSaved = useEditorStore((s) => s.resetToSaved);

  const handleSave = () => {
    performSave(vscodeApi.postMessage.bind(vscodeApi));
  };

  return (
    <div
      className="flex items-center justify-end gap-2 px-4 py-2 border-t border-vscode-panel-border bg-vscode-sidebar-bg"
      role="status"
      aria-label="Unsaved changes"
    >
      <span className="text-xs text-vscode-description-fg mr-auto">
        Unsaved changes
      </span>
      <button
        onClick={resetToSaved}
        className="px-3 py-1 text-xs rounded bg-vscode-button-secondary-bg text-vscode-button-secondary-fg hover:opacity-80"
      >
        Discard
      </button>
      <button
        onClick={handleSave}
        className="px-3 py-1 text-xs rounded bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover"
      >
        Save
      </button>
    </div>
  );
}
