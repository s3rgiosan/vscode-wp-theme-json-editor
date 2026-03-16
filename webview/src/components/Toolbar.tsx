import { useEditorStore } from "../store/editorStore";

export function Toolbar() {
  const showExperimental = useEditorStore((s) => s.showExperimental);
  const setShowExperimental = useEditorStore((s) => s.setShowExperimental);
  const schemaVersion = useEditorStore((s) => s.schemaVersion);

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-vscode-panel-border bg-vscode-sidebar-bg">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold">Theme JSON Editor</h1>
        {schemaVersion && (
          <span
            className="px-2 py-0.5 text-xs rounded bg-vscode-badge-bg text-vscode-badge-fg"
            title="WordPress JSON Schema version detected from the $schema field in your theme.json"
          >
            Schema {schemaVersion}
          </span>
        )}
      </div>
      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showExperimental}
          onChange={(e) => setShowExperimental(e.target.checked)}
          className="accent-vscode-checkbox-bg"
        />
        Show Experimental
      </label>
    </header>
  );
}
