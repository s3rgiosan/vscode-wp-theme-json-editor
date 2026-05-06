import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { useHost } from "../host/useHost";

export function Toolbar() {
  const showExperimental = useEditorStore((s) => s.showExperimental);
  const setShowExperimental = useEditorStore((s) => s.setShowExperimental);
  const schemaVersion = useEditorStore((s) => s.schemaVersion);
  const host = useHost();

  const modes = host.modes?.() ?? [];
  // The host owns the canonical mode; we mirror it locally so the
  // <select> stays controlled. Initial value comes from host.getMode().
  const [activeMode, setActiveMode] = useState(() => host.getMode?.() ?? "");

  const handleModeChange = async (next: string) => {
    if (!host.setMode || next === activeMode) {
      return;
    }
    setActiveMode(next);
    await host.setMode(next);
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-tje-panel-border bg-tje-sidebar-bg">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold">Theme JSON Editor</h1>
        {schemaVersion && (
          <span
            className="px-2 py-0.5 rounded bg-tje-badge-bg text-tje-badge-fg"
            title="WordPress JSON Schema version detected from the $schema field in your theme.json"
          >
            Schema {schemaVersion}
          </span>
        )}
        {modes.length >= 2 && (
          <label className="flex items-center gap-1.5">
            <span className="text-tje-description-fg">Editing</span>
            <select
              value={activeMode}
              onChange={(e) => void handleModeChange(e.target.value)}
              className="px-2 py-0.5 rounded border border-tje-dropdown-border bg-tje-dropdown-bg text-tje-dropdown-fg"
            >
              {modes.map((mode) => (
                <option
                  key={mode.id}
                  value={mode.id}
                  disabled={mode.disabled}
                  title={mode.disabledReason}
                >
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showExperimental}
          onChange={(e) => setShowExperimental(e.target.checked)}
          className="accent-tje-checkbox-bg"
        />
        Show Experimental
      </label>
    </header>
  );
}
