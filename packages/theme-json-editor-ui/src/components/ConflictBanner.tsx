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
    <div className="flex items-center justify-between px-4 py-2 border-b border-tje-warning-fg bg-tje-sidebar-bg">
      <span className="text-tje-warning-fg">
        File changed on disk while you have unsaved changes.
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleReload}
          className="px-2 py-1 rounded bg-tje-button-bg text-tje-button-fg hover:bg-tje-button-hover"
        >
          Reload from disk
        </button>
        <span className="text-secondary text-tje-description-fg">
          or keep editing to preserve your changes
        </span>
      </div>
    </div>
  );
}
