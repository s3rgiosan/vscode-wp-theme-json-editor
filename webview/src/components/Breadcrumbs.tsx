import { useEditorStore } from "../store/editorStore";
import { formatLabel } from "../utils/formatLabel";

interface BreadcrumbsProps {
  /** Dot-separated path (e.g. "settings.color"). */
  readonly path: string;
}

/**
 * Clickable breadcrumb trail showing the current location in the schema tree.
 * Each segment navigates to that level when clicked.
 * Uses VSCode breadcrumb CSS variables for theme-consistent styling.
 */
export function Breadcrumbs({ path }: BreadcrumbsProps) {
  const setActiveSection = useEditorStore((s) => s.setActiveSection);
  const parts = path.split(".");

  if (parts.length <= 1) {
    return (
      <h2 className="text-base font-semibold mb-4">
        {formatLabel(parts[0] ?? "")}
      </h2>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-xs mb-4" aria-label="Breadcrumb">
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        const targetPath = parts.slice(0, index + 1).join(".");

        return (
          <span key={targetPath} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-vscode-breadcrumb-fg" aria-hidden="true">
                {"\u203A"}
              </span>
            )}
            {isLast ? (
              <span className="font-semibold text-sm text-vscode-breadcrumb-active-fg">
                {formatLabel(part)}
              </span>
            ) : (
              <button
                onClick={() => setActiveSection(targetPath)}
                className="text-vscode-breadcrumb-fg hover:text-vscode-link-fg hover:underline"
              >
                {formatLabel(part)}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
