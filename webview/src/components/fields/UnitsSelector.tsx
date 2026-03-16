/** CSS units supported by the WordPress block editor. */
const SUPPORTED_UNITS = [
  { value: "px", label: "px" },
  { value: "em", label: "em" },
  { value: "rem", label: "rem" },
  { value: "%", label: "%" },
  { value: "vw", label: "vw" },
  { value: "vh", label: "vh" },
  { value: "svw", label: "svw" },
  { value: "svh", label: "svh" },
  { value: "lvw", label: "lvw" },
  { value: "lvh", label: "lvh" },
  { value: "dvw", label: "dvw" },
  { value: "dvh", label: "dvh" },
  { value: "vi", label: "vi" },
  { value: "vb", label: "vb" },
  { value: "vmin", label: "vmin" },
  { value: "vmax", label: "vmax" },
] as const;

interface UnitsSelectorProps {
  readonly value: string[];
  readonly path: string[];
  readonly setField: (path: string[], value: unknown) => void;
}

/**
 * Renders a checkbox grid for selecting CSS units.
 * Shows the known WP-supported units as toggleable chips.
 */
export function UnitsSelector({ value, path, setField }: UnitsSelectorProps) {
  const selected = new Set(value);

  const toggleUnit = (unit: string) => {
    const next = new Set(selected);
    if (next.has(unit)) {
      next.delete(unit);
    } else {
      next.add(unit);
    }
    setField(path, [...next]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {SUPPORTED_UNITS.map(({ value: unit, label }) => {
        const isSelected = selected.has(unit);
        return (
          <button
            key={unit}
            onClick={() => toggleUnit(unit)}
            className={`px-2 py-1 text-[11px] rounded border transition-colors ${
              isSelected
                ? "bg-vscode-button-bg text-vscode-button-fg border-vscode-button-bg"
                : "border-vscode-panel-border text-vscode-description-fg hover:bg-vscode-list-hover hover:text-vscode-list-hover-fg"
            }`}
            title={isSelected ? `Remove ${label}` : `Add ${label}`}
            aria-pressed={isSelected}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Check if the array path represents a units property. */
export function isUnitsArray(path: string[]): boolean {
  return path[path.length - 1] === "units";
}
