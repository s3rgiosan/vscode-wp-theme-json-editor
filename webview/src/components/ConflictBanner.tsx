import { useEditorStore } from "../store/editorStore";

interface ConflictBannerProps {
  readonly conflictData: Record<string, unknown>;
}

/**
 * Shows when the file changes externally while local unsaved changes exist.
 */
export function ConflictBanner({ conflictData }: ConflictBannerProps) {
  const setExternalData = useEditorStore((s) => s.setExternalData);

  const handleReload = () => {
    setExternalData(conflictData);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-vscode-warning-fg bg-vscode-sidebar-bg">
      <span className="text-xs text-vscode-warning-fg">
        File changed on disk while you have unsaved changes.
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleReload}
          className="px-2 py-1 text-xs rounded bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover"
        >
          Reload from disk
        </button>
        <span className="text-[11px] text-vscode-description-fg">
          or keep editing to preserve your changes
        </span>
      </div>
    </div>
  );
}
