import { useMemo } from "react";
import { useEditorStore } from "../store/editorStore";

/**
 * Displays validation errors relevant to the given field path.
 * Uses VSCode input validation styling for theme consistency.
 * Renders nothing if there are no errors for this path.
 */
export function ValidationErrors({ path }: { readonly path: string[] }) {
  const validationErrors = useEditorStore((s) => s.validationErrors);

  const fieldPath = path.join(".");

  const errors = useMemo(
    () =>
      validationErrors.filter(
        (e) => e.path === fieldPath || e.path.startsWith(`${fieldPath}.`),
      ),
    [validationErrors, fieldPath],
  );

  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      className="mt-1 px-2 py-1 rounded border border-vscode-input-error-border bg-vscode-input-error-bg text-vscode-input-error-fg"
      role="alert"
    >
      {errors.map((err, i) => (
        <p key={i} className="text-[10px]">
          {err.path !== fieldPath && (
            <span className="font-mono mr-1">
              {err.path.slice(fieldPath.length + 1)}:
            </span>
          )}
          {err.message}
        </p>
      ))}
    </div>
  );
}
