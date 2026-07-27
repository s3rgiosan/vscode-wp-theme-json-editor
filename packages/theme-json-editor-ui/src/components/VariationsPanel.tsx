import { useEditorStore } from "../store/editorStore";
import { useHost } from "../host/useHost";
import { PRIMARY_BUTTON_CLASS } from "./styles";

/**
 * Lists the style variations that live alongside the open document — the
 * `styles/*.json` files of the same theme — with the blocks each one
 * registers on. Selecting an entry opens that file in its own editor.
 */
export function VariationsPanel() {
  const variations = useEditorStore((s) => s.variations);
  const host = useHost();

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-secondary text-tje-description-fg m-0">
          {variations.length === 0
            ? "No style variations found in this theme's styles/ directory."
            : `${variations.length} ${
                variations.length === 1 ? "file" : "files"
              } in styles/`}
        </p>
        {host.requestVariations && (
          <button
            onClick={() => host.requestVariations?.()}
            className={PRIMARY_BUTTON_CLASS}
          >
            Refresh
          </button>
        )}
      </div>

      {variations.length > 0 && (
        <ul
          aria-label="Style variations"
          className="list-none p-0 m-0 space-y-2"
        >
          {variations.map(({ path, title, slug, blockTypes }) => (
            <li key={path}>
              <button
                onClick={() => host.openVariation?.(path)}
                disabled={!host.openVariation}
                className="w-full text-left px-2 py-1.5 rounded border border-tje-panel-border hover:bg-tje-list-hover hover:text-tje-list-hover-fg transition-colors disabled:cursor-default"
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-medium">{title}</span>
                  <span className="text-tertiary text-tje-description-fg font-mono">
                    {path}
                  </span>
                </span>
                <span className="block text-tertiary text-tje-description-fg mt-0.5">
                  {blockTypes.length === 0
                    ? `${slug} — global, applies to the whole site`
                    : `${slug} — ${blockTypes.join("  ")}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
