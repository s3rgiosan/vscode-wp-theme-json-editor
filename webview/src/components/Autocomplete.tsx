import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type InputHTMLAttributes,
} from "react";
import { useCssVariables } from "../hooks/useCssVariables";
import type { CssVariable } from "../utils/cssVariables";

// ── Autocomplete dropdown ──────────────────────────────────────────────

interface AutocompleteProps {
  /** All available CSS variables. */
  readonly variables: CssVariable[];
  /** Current input value. */
  readonly inputValue: string;
  /** Cursor position in the input (selectionStart). */
  readonly cursorPos: number;
  /** Called when the user picks a suggestion. Returns the new full input value. */
  readonly onSelect: (newValue: string) => void;
  /** Called to dismiss the dropdown. */
  readonly onDismiss: () => void;
}

/** Maximum items shown in the dropdown. */
const MAX_VISIBLE = Infinity;

/**
 * Determines the CSS variable trigger fragment near the cursor.
 * Returns the matched fragment and its start index, or null if no trigger found.
 */
function getTrigger(value: string, cursor: number): { fragment: string; start: number } | null {
  // Look backward from cursor for `var(--` or a standalone `--wp`
  const before = value.slice(0, cursor);

  // Match `var(--...` without a closing `)`
  const varMatch = /var\(([^)]*$)/i.exec(before);
  if (varMatch) {
    const inner = varMatch[1] ?? "";
    // The fragment is whatever is inside var( so far
    return { fragment: inner, start: varMatch.index + 4 }; // 4 = "var(".length
  }

  // Match standalone `--wp...` (not inside var())
  const wpMatch = /(--wp[a-z0-9-]*)$/i.exec(before);
  if (wpMatch) {
    return { fragment: wpMatch[1] ?? "", start: wpMatch.index };
  }

  return null;
}

/**
 * Filter variables by a fragment. Case-insensitive prefix match on the name.
 * The fragment comes from after `var(` or from a standalone `--wp` trigger,
 * so it represents the start of the variable name the user is typing.
 */
function filterVariables(variables: CssVariable[], fragment: string): CssVariable[] {
  if (!fragment) return variables.slice(0, MAX_VISIBLE);
  const lower = fragment.toLowerCase();
  return variables
    .filter((v) => v.name.toLowerCase().startsWith(lower))
    .slice(0, MAX_VISIBLE);
}

/**
 * Lightweight autocomplete dropdown for CSS variable suggestions.
 * Renders an absolutely-positioned list below its parent container.
 */
export function Autocomplete({
  variables,
  inputValue,
  cursorPos,
  onSelect,
  onDismiss,
}: AutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const trigger = getTrigger(inputValue, cursorPos);
  const filtered = trigger ? filterVariables(variables, trigger.fragment) : [];

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!trigger || filtered.length === 0) return null;

  const handleSelect = (variable: CssVariable) => {
    const before = inputValue.slice(0, trigger.start);
    const after = inputValue.slice(cursorPos);

    // Check if we're inside a `var(` context
    const insideVar = /var\([^)]*$/i.test(inputValue.slice(0, trigger.start + 1));
    let insertion: string;

    if (insideVar) {
      // We're inside var(), just insert the variable name and close the paren
      insertion = variable.name + (after.startsWith(")") ? "" : ")");
    } else {
      // Standalone trigger, wrap in var()
      insertion = `var(${variable.name})`;
    }

    onSelect(before + insertion + (insideVar && after.startsWith(")") ? after.slice(1) : after));
  };

  return (
    <ul
      ref={listRef}
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-48 overflow-y-auto rounded border border-vscode-input-border bg-vscode-dropdown-bg shadow-lg"
      onMouseDown={(e) => e.preventDefault()} // prevent input blur
    >
      {filtered.map((v, i) => (
        <li
          key={v.name}
          role="option"
          aria-selected={i === selectedIndex}
          className={`flex items-center justify-between px-2 py-1 text-xs cursor-pointer ${
            i === selectedIndex
              ? "bg-vscode-list-active-bg text-vscode-list-active-fg"
              : "text-vscode-dropdown-fg hover:bg-vscode-list-hover hover:text-vscode-list-hover-fg"
          }`}
          onMouseEnter={() => setSelectedIndex(i)}
          onClick={() => {
            handleSelect(v);
            onDismiss();
          }}
        >
          <span className="font-mono truncate">{v.name}</span>
          <span className="ml-2 shrink-0 text-[10px] text-vscode-description-fg">
            {v.value ? `${v.category}: ${v.value}` : v.category}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Keyboard handler for the autocomplete dropdown.
 * Returns true if the key was handled (should preventDefault).
 */
export function handleAutocompleteKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  variables: CssVariable[],
  inputValue: string,
  cursorPos: number,
  selectedIndex: number,
  setSelectedIndex: (i: number) => void,
  onSelect: (newValue: string) => void,
  onDismiss: () => void,
): boolean {
  const trigger = getTrigger(inputValue, cursorPos);
  if (!trigger) return false;

  const filtered = filterVariables(variables, trigger.fragment);
  if (filtered.length === 0) return false;

  if (e.key === "ArrowDown") {
    setSelectedIndex(Math.min(selectedIndex + 1, filtered.length - 1));
    return true;
  }
  if (e.key === "ArrowUp") {
    setSelectedIndex(Math.max(selectedIndex - 1, 0));
    return true;
  }
  if (e.key === "Enter" || e.key === "Tab") {
    const variable = filtered[selectedIndex];
    if (!variable) return false;

    const before = inputValue.slice(0, trigger.start);
    const after = inputValue.slice(cursorPos);
    const insideVar = /var\([^)]*$/i.test(inputValue.slice(0, trigger.start + 1));
    let insertion: string;

    if (insideVar) {
      insertion = variable.name + (after.startsWith(")") ? "" : ")");
    } else {
      insertion = `var(${variable.name})`;
    }

    onSelect(before + insertion + (insideVar && after.startsWith(")") ? after.slice(1) : after));
    onDismiss();
    return true;
  }
  if (e.key === "Escape") {
    onDismiss();
    return true;
  }

  return false;
}

// ── TextInputWithAutocomplete ──────────────────────────────────────────

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">;

interface TextInputWithAutocompleteProps extends InputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

/**
 * A text `<input>` wrapped with CSS variable autocomplete.
 * Drop-in replacement for `<input type="text">` in field components.
 */
export function TextInputWithAutocomplete({
  value,
  onChange,
  onKeyDown: externalKeyDown,
  ...inputProps
}: TextInputWithAutocompleteProps) {
  const variables = useCssVariables();
  const [open, setOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState(value.length);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateCursor = useCallback(() => {
    const pos = inputRef.current?.selectionStart ?? 0;
    setCursorPos(pos);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const pos = inputRef.current?.selectionStart ?? newValue.length;
      onChange(newValue);
      setCursorPos(pos);
      // Only open the dropdown if the new value has a trigger pattern
      setOpen(getTrigger(newValue, pos) !== null);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (open) {
        const handled = handleAutocompleteKeyDown(
          e,
          variables,
          value,
          cursorPos,
          selectedIndex,
          setSelectedIndex,
          (newValue) => {
            onChange(newValue);
            setOpen(false);
          },
          () => setOpen(false),
        );
        if (handled) {
          e.preventDefault();
          return;
        }
      }
      externalKeyDown?.(e);
    },
    [open, variables, value, cursorPos, selectedIndex, onChange, externalKeyDown],
  );

  const handleBlur = useCallback(() => {
    // Delay to allow click on dropdown item
    setTimeout(() => setOpen(false), 150);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={updateCursor}
        onKeyUp={updateCursor}
        {...inputProps}
      />
      {open && (
        <Autocomplete
          variables={variables}
          inputValue={value}
          cursorPos={cursorPos}
          onSelect={(newValue) => {
            onChange(newValue);
            setOpen(false);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </div>
  );
}
