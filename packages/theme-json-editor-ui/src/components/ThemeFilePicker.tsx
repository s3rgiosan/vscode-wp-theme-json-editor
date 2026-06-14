import { useEffect, useRef, useState } from "react";
import type { HostMode } from "../host/HostAdapter";

interface ThemeFilePickerProps {
  modes: readonly HostMode[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Custom dropdown for switching the editing target (theme.json, style
 * variations under `styles/`, and any other host-supplied source).
 *
 * A native `<select>` cannot render a selectable parent with truly
 * indented children, so this is a small popover listbox. Modes flagged
 * `indent` are nested beneath the preceding top-level entry.
 */
export function ThemeFilePicker({
  modes,
  activeId,
  onSelect,
}: ThemeFilePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeMode = modes.find((mode) => mode.id === activeId);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSelect = (mode: HostMode) => {
    if (mode.disabled) {
      return;
    }
    setOpen(false);
    if (mode.id !== activeId) {
      onSelect(mode.id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-tje-dropdown-border bg-tje-dropdown-bg text-tje-dropdown-fg"
      >
        <span>{activeMode?.label ?? "Select file"}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 min-w-full max-h-72 overflow-auto rounded border border-tje-panel-border bg-tje-sidebar-bg py-1 shadow-lg"
        >
          {modes.map((mode) => (
            <li
              key={mode.id}
              role="option"
              aria-selected={mode.id === activeId}
              aria-disabled={mode.disabled}
              title={mode.disabledReason}
              onClick={() => handleSelect(mode)}
              className={[
                "flex items-center gap-1 px-3 py-1 whitespace-nowrap",
                mode.indent ? "pl-6" : "",
                mode.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-tje-dropdown-bg",
                mode.id === activeId ? "font-semibold" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {mode.indent && (
                <span aria-hidden="true" className="text-tje-description-fg">
                  └
                </span>
              )}
              <span>{mode.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
