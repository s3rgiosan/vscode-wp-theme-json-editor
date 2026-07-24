import { useEditorStore } from "../store/editorStore";
import { getVariationHints } from "../utils/variationHints";

/**
 * Advisory notes at the top of the Variation section: how WordPress will read
 * the file, and declarations that are valid but probably not intended.
 *
 * Purely informational — nothing here blocks saving.
 */
export function VariationHints() {
  const filePath = useEditorStore((s) => s.filePath);
  const themeJson = useEditorStore((s) => s.themeJson);

  const hints = getVariationHints(filePath, themeJson);
  if (hints.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Variation hints"
      className="list-none p-0 m-0 mb-4 space-y-1"
    >
      {hints.map(({ id, severity, message }) => (
        <li
          key={id}
          className={`px-2 py-1 rounded border-l-2 bg-tje-sidebar-bg ${
            severity === "warning"
              ? "border-tje-error-fg"
              : "border-tje-panel-border text-tje-description-fg"
          }`}
        >
          {message}
        </li>
      ))}
    </ul>
  );
}
