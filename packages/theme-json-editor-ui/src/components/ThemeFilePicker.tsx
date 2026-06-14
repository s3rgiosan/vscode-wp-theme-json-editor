import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
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
 * indented children, so this implements the ARIA APG select-only
 * combobox pattern: the trigger keeps focus and tracks the highlighted
 * option via `aria-activedescendant`, with full keyboard support
 * (Arrow/Home/End to move, Enter/Space to select, Escape to dismiss).
 * Modes flagged `indent` are nested beneath the preceding top-level entry.
 */
export function ThemeFilePicker({
  modes,
  activeId,
  onSelect,
}: ThemeFilePickerProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-opt-${index}`;

  const activeMode = modes.find((mode) => mode.id === activeId);
  const isSelectable = (mode: HostMode) => !mode.disabled;

  const firstEnabled = () => modes.findIndex(isSelectable);
  const lastEnabled = () => {
    for (let i = modes.length - 1; i >= 0; i--) {
      if (isSelectable(modes[i])) {
        return i;
      }
    }
    return -1;
  };
  const nextEnabled = (from: number) => {
    for (let i = from + 1; i < modes.length; i++) {
      if (isSelectable(modes[i])) {
        return i;
      }
    }
    return from;
  };
  const prevEnabled = (from: number) => {
    for (let i = from - 1; i >= 0; i--) {
      if (isSelectable(modes[i])) {
        return i;
      }
    }
    return from;
  };

  const openMenu = (toIndex?: number) => {
    let index = toIndex ?? -1;
    if (index < 0) {
      const selected = modes.findIndex((mode) => mode.id === activeId);
      index =
        selected >= 0 && isSelectable(modes[selected])
          ? selected
          : firstEnabled();
    }
    setActiveIndex(index);
    setOpen(true);
  };

  const selectIndex = (index: number) => {
    const mode = modes[index];
    if (!mode || !isSelectable(mode)) {
      return;
    }
    setOpen(false);
    if (mode.id !== activeId) {
      onSelect(mode.id);
    }
  };

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
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (open) {
          setActiveIndex((index) => nextEnabled(index));
        } else {
          openMenu();
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (open) {
          setActiveIndex((index) => prevEnabled(index));
        } else {
          openMenu();
        }
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActiveIndex(firstEnabled());
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActiveIndex(lastEnabled());
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) {
          selectIndex(activeIndex);
        } else {
          openMenu();
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        if (open) {
          setOpen(false);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-tje-dropdown-border bg-tje-dropdown-bg text-tje-dropdown-fg"
      >
        <span>{activeMode?.label ?? "Select file"}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Editing target"
          className="absolute z-10 mt-1 min-w-full max-h-72 overflow-auto rounded border border-tje-panel-border bg-tje-sidebar-bg py-1 shadow-lg"
        >
          {modes.map((mode, index) => (
            <li
              key={mode.id}
              id={optionId(index)}
              role="option"
              aria-selected={mode.id === activeId}
              aria-disabled={mode.disabled || undefined}
              title={mode.disabledReason}
              onMouseMove={() => {
                if (isSelectable(mode)) {
                  setActiveIndex(index);
                }
              }}
              onClick={() => selectIndex(index)}
              className={[
                "flex items-center gap-1 px-3 py-1 whitespace-nowrap",
                mode.indent ? "pl-6" : "",
                mode.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer",
                !mode.disabled && index === activeIndex
                  ? "bg-tje-dropdown-bg"
                  : "",
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
